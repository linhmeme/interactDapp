use anchor_lang::prelude::*;
pub mod error;
pub mod constant;
pub mod instructions;
use crate::instructions::*;

declare_id!("DC2y62K2opFJ21AMZwcYG7HDaNfUTU4YZszpnpG18r61");

#[program]
pub mod interact_dapp {
    use super::*;
    pub fn deposit_earn(ctx: Context<DepositParams>, amount: u64) -> Result<()> {
        ctx.accounts.deposit_earn(amount)
    }
    pub fn withdraw_earn(ctx: Context<WithdrawParams>, assets: u64) -> Result<()> {
        ctx.accounts.withdraw_earn(assets)
    }
    pub fn proxy_swap<'a, 'b, 'c: 'info, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ProxySwap<'info>>,
        amount: u64,
        other_amount_threshold: u64,
        sqrt_price_limit_x64: u128,
        is_base_input: bool,
    ) -> Result<()> {
        instructions::proxy_swap(
            ctx,
            amount,
            other_amount_threshold,
            sqrt_price_limit_x64,
            is_base_input,
        )
    }
}
