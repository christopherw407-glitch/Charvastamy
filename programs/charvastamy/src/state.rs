use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub authority: Pubkey,
    pub count: u64,
    pub apy_bps: u64,
    pub total_staked: u64,
    pub token_mint: Pubkey,
    pub gate_enabled: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserStake {
    pub authority: Pubkey,
    pub amount: u64,
    pub started_at: i64,
    pub rate_bps: u64,
    pub bump: u8,
    pub referrer: Pubkey,
    pub pending_rewards: u64,
}
