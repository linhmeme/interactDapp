use anchor_lang::prelude::*;

#[error_code]
pub enum InteractDappError {
    #[msg("CPI to vaults failed.")]
    CpiToVaultsProgramFailed,

    #[msg("Swap failed.")]
    SwapFailed,

    #[msg("CPI to lending program failed.")]
    CpiToLendingProgramFailed,
}