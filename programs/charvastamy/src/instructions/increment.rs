use anchor_lang::prelude::*;

use crate::{error::ErrorCode, state::ProgramState};

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"state", authority.key().as_ref()],
        bump = state.bump,
        has_one = authority @ ErrorCode::InvalidAuthority
    )]
    pub state: Account<'info, ProgramState>,
}

pub fn handler(ctx: Context<Increment>) -> Result<()> {
    let state = &mut ctx.accounts.state;
    state.count = state.count.checked_add(1).ok_or(ErrorCode::Overflow)?;
    msg!("Incremented count to {}", state.count);
    Ok(())
}
