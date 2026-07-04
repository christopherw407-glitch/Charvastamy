use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount};

use crate::{error::ErrorCode, state::{ProgramState, UserStake}};
use crate::events::StakeEvent;

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"state", authority.key().as_ref()],
        bump = state.bump,
        has_one = authority @ ErrorCode::InvalidAuthority
    )]
    pub state: Account<'info, ProgramState>,

    #[account(
        init,
        payer = authority,
        space = 8 + UserStake::INIT_SPACE,
        seeds = [b"stake", authority.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Stake>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);
    if ctx.accounts.state.gate_enabled {
        let token_account_info = ctx.remaining_accounts.get(0).ok_or(ErrorCode::TokenGateNotConfigured)?;
        require!(token_account_info.owner == &token::ID, ErrorCode::InvalidTokenAccount);
        let data = token_account_info.try_borrow_data()?;
        let token_account = TokenAccount::try_deserialize_unchecked(&mut &data[..])
            .map_err(|_| error!(ErrorCode::InvalidTokenAccount))?;
        require!(token_account.owner == ctx.accounts.authority.key(), ErrorCode::InvalidAuthority);
        require!(token_account.amount > 0, ErrorCode::TokenAccountEmpty);
        require!(token_account.mint == ctx.accounts.state.token_mint, ErrorCode::InvalidTokenMint);
    }

    let state = &mut ctx.accounts.state;
    let user_stake = &mut ctx.accounts.user_stake;

    state.total_staked = state.total_staked.checked_add(amount).ok_or(ErrorCode::Overflow)?;
    user_stake.authority = ctx.accounts.authority.key();
    user_stake.amount = amount;
    user_stake.started_at = Clock::get()?.unix_timestamp;
    user_stake.rate_bps = state.apy_bps;
    user_stake.referrer = Pubkey::default();
    let deposit_reward = amount.checked_mul(200).ok_or(ErrorCode::Overflow)?.checked_div(10000).ok_or(ErrorCode::Overflow)?;
    user_stake.pending_rewards = deposit_reward;
    user_stake.bump = ctx.bumps.user_stake;
    let ts = Clock::get()?.unix_timestamp;
    emit!(StakeEvent{
      authority: user_stake.authority,
      amount: user_stake.amount,
      timestamp: ts,
      rate_bps: user_stake.rate_bps,
    });

    msg!("Staked {} with APY {} bps and deposit reward {}", amount, state.apy_bps, deposit_reward);
    Ok(())
}
