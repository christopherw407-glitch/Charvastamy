use anchor_lang::prelude::*;

use crate::state::ProgramState;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [b"state", authority.key().as_ref()],
        bump
    )]
    pub state: Account<'info, ProgramState>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let state = &mut ctx.accounts.state;
    state.authority = ctx.accounts.authority.key();
    state.count = 0;
    state.apy_bps = 2500;
    state.total_staked = 0;
    state.token_mint = Pubkey::default();
    state.gate_enabled = false;
    state.bump = ctx.bumps.state;

    msg!("Initialized state for {:?}", state.authority);
    Ok(())
}
