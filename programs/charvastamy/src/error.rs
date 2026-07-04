use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
    #[msg("The authority does not match the state account")]
    InvalidAuthority,
    #[msg("Counter overflow")]
    Overflow,
    #[msg("Stake amount must be greater than zero")]
    InvalidAmount,
    #[msg("Token gating is enabled, but no valid token account was supplied")]
    TokenGateNotConfigured,
    #[msg("The provided token account is not a valid SPL token account")]
    InvalidTokenAccount,
    #[msg("The provided token account mint does not match the gated mint")]
    InvalidTokenMint,
    #[msg("The provided token account is empty")]
    TokenAccountEmpty,
}
