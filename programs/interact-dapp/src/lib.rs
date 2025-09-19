use anchor_lang::prelude::*;
pub mod instructions;
pub use instructions::*; 

declare_id!("3XVtwgUZ7P1xhMJ96yHzKaoSMGF7f1DbY4RLP7AyLLMn");

#[program]
pub mod your_program {
    use super::*;

    pub fn raydium_swap_cpi(
        ctx: Context<RaydiumSwapCpi>,
        amount_in: u64,
        min_amount_out: u64,
    ) -> Result<()> {
        instructions::raydium_swap::raydium_swap_cpi(ctx, amount_in, min_amount_out)
    }

    pub fn jupiter_deposit_cpi(ctx: Context<JupiterLendCpi>, amount: u64) -> Result<()> {
        instructions::jupiter_deposit::jupiter_deposit_cpi(ctx, amount)
    }

    pub fn jupiter_withdraw_cpi(ctx: Context<JupiterLendCpi>, amount: u64) -> Result<()> {
        instructions::jupiter_withdraw::jupiter_withdraw_cpi(ctx, amount)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
