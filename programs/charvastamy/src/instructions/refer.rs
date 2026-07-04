use anchor_lang::prelude::*;

use crate::{error::ErrorCode, state::{ProgramState, UserStake}, events::ReferralEvent};

#[derive(Accounts)]
pub struct Refer<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"state", authority.key().as_ref()],
        bump = state.bump,
        has_one = authority @ ErrorCode::InvalidAuthority
    )]
    pub state: Account<'info, ProgramState>,

    #[account(mut, seeds = [b"stake", authority.key().as_ref()], bump = user_stake.bump)]
    pub user_stake: Account<'info, UserStake>,

    #[account(mut, seeds = [b"stake", referrer.key().as_ref()], bump = referrer_stake.bump)]
    pub referrer_stake: Account<'info, UserStake>,

    /// CHECK: pubkey only
    pub referrer: UncheckedAccount<'info>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Refer>) -> Result<()> {
    let user_stake = &mut ctx.accounts.user_stake;
    let referrer_stake = &mut ctx.accounts.referrer_stake;

    // Can't refer yourself
    require!(user_stake.authority != ctx.accounts.referrer.key(), ErrorCode::InvalidAuthority);

    // set referrer
    user_stake.referrer = ctx.accounts.referrer.key();

    // reward is 5% of the user's stake amount
    let reward = user_stake.amount.checked_mul(500).ok_or(ErrorCode::Overflow)?.checked_div(10000).ok_or(ErrorCode::Overflow)?;
    referrer_stake.pending_rewards = referrer_stake.pending_rewards.checked_add(reward).ok_or(ErrorCode::Overflow)?;

    let ts = Clock::get()?.unix_timestamp;
    emit!(ReferralEvent{ referee: user_stake.authority, referrer: ctx.accounts.referrer.key(), amount: user_stake.amount, reward_amount: reward, timestamp: ts });

    msg!("Registered referrer {} for {} and rewarded {}", ctx.accounts.referrer.key(), user_stake.authority, reward);
    Ok(())
}
