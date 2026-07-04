use anchor_lang::prelude::*;

use crate::{error::ErrorCode, state::ProgramState};

#[derive(Accounts)]
pub struct SetTokenGate<'info> {
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

pub fn handler(ctx: Context<SetTokenGate>, token_mint: Pubkey, enable: bool) -> Result<()> {
    let state = &mut ctx.accounts.state;
    state.token_mint = token_mint;
    state.gate_enabled = enable;

    msg!("Token gating {} for mint {}", if enable { "enabled" } else { "disabled" }, token_mint);
    Ok(())
}
