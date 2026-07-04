use anchor_lang::prelude::*;

use crate::{error::ErrorCode, state::{ProgramState, UserStake}, events::RewardClaimEvent};

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
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

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimRewards>) -> Result<()> {
    let user_stake = &mut ctx.accounts.user_stake;
    let claimed = user_stake.pending_rewards;
    require!(claimed > 0, ErrorCode::InvalidAmount);

    // For now, we only reset pending_rewards and emit an event. Actual lamport payouts
    // would require the program to hold funds and invoke system transfers.
    user_stake.pending_rewards = 0;

    let ts = Clock::get()?.unix_timestamp;
    emit!(RewardClaimEvent{ authority: user_stake.authority, claimed_amount: claimed, timestamp: ts });

    msg!("{} claimed {} rewards", user_stake.authority, claimed);
    Ok(())
}
