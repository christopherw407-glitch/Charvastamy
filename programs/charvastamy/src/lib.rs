pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod events;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;

declare_id!("FCFnNNwPf2Ej1Eub1k4mctfdXvcoWZNRZ81FgyBh6Yjc");

#[program]
pub mod charvastamy {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        increment::handler(ctx)
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        stake::handler(ctx, amount)
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        unstake::handler(ctx)
    }

    pub fn refer(ctx: Context<Refer>) -> Result<()> {
        refer::handler(ctx)
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        claim_rewards::handler(ctx)
    }

    pub fn set_token_gate(ctx: Context<SetTokenGate>, token_mint: Pubkey, enable: bool) -> Result<()> {
        set_token_gate::handler(ctx, token_mint, enable)
    }
}
