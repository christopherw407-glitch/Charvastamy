use anchor_lang::prelude::*;

#[event]
pub struct StakeEvent {
    pub authority: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub rate_bps: u64,
}

#[event]
pub struct UnstakeEvent {
    pub authority: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub rate_bps: u64,
}

#[event]
pub struct DepositRewardEvent {
    pub authority: Pubkey,
    pub amount: u64,
    pub reward_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ReferralEvent {
    pub referee: Pubkey,
    pub referrer: Pubkey,
    pub amount: u64,
    pub reward_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct RewardClaimEvent {
    pub authority: Pubkey,
    pub claimed_amount: u64,
    pub timestamp: i64,
}
