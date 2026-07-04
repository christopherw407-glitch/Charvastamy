use anchor_lang::prelude::*;

use crate::{error::ErrorCode, state::{ProgramState, UserStake}, events::UnstakeEvent};

#[derive(Accounts)]
pub struct Unstake<'info> {
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
        mut,
        seeds = [b"stake", authority.key().as_ref()],
        bump = user_stake.bump,
        close = authority
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Unstake>) -> Result<()> {
    let state = &mut ctx.accounts.state;
    let user_stake = &mut ctx.accounts.user_stake;

    // Ensure amounts are sensible
    require!(user_stake.amount > 0, ErrorCode::InvalidAmount);

    // Subtract user's stake from the global total
    state.total_staked = state.total_staked.checked_sub(user_stake.amount).ok_or(ErrorCode::Overflow)?;

    let ts = Clock::get()?.unix_timestamp;
    emit!(UnstakeEvent{ authority: user_stake.authority, amount: user_stake.amount, timestamp: ts, rate_bps: user_stake.rate_bps });

    msg!("Unstaked {} from {}", user_stake.amount, user_stake.authority);
    Ok(())
}
