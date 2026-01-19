use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::{
    account_info::AccountInfo,
    instruction::{AccountMeta, Instruction},
    program::invoke,
};
use crate::error::InteractDappError;

fn get_deposit_discriminator() -> Vec<u8> {
    // discriminator = sha256("global:deposit")[0..8]
    vec![242, 35, 198, 137, 82, 225, 242, 182]
}

#[derive(Accounts)]
pub struct DepositParams<'info> {
    ///CHECK:
    #[account(mut)]
    pub signer: Signer<'info>,
    ///CHECK:
    #[account(mut)]
    pub depositor_token_account: AccountInfo<'info>,
    ///CHECK:
    #[account(mut)]
    pub recipient_token_account: AccountInfo<'info>,

    ///CHECK:
    pub mint: AccountInfo<'info>,

    ///CHECK:
    pub lending_admin: AccountInfo<'info>,
    ///CHECK:
    #[account(mut)]
    pub lending: AccountInfo<'info>,
    ///CHECK:
    #[account(mut)]
    pub f_token_mint: AccountInfo<'info>,

    // Liquidity protocol accounts
    ///CHECK:
    #[account(mut)]
    pub supply_token_reserves_liquidity: AccountInfo<'info>,
    ///CHECK:
    #[account(mut)]
    pub lending_supply_position_on_liquidity: AccountInfo<'info>,
    ///CHECK:
    pub rate_model: AccountInfo<'info>,
    ///CHECK:
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    ///CHECK:
    #[account(mut)]
    pub liquidity: AccountInfo<'info>,
    ///CHECK:
    #[account(mut)]
    pub liquidity_program: AccountInfo<'info>,

    // Rewards and programs
    ///CHECK:
    pub rewards_rate_model: AccountInfo<'info>,
    ///CHECK:
    pub token_program: AccountInfo<'info>,
    ///CHECK:
    pub associated_token_program: AccountInfo<'info>,
    ///CHECK:
    pub system_program: AccountInfo<'info>,

    // Target lending program
    ///CHECK:
    pub lending_program: UncheckedAccount<'info>,
}

impl<'info> DepositParams<'info> {
    
    pub fn deposit_earn(&self, amount: u64) -> Result<()> {
        let mut instruction_data = get_deposit_discriminator();
        instruction_data.extend_from_slice(&amount.to_le_bytes());

        let account_metas = vec![
            // signer (mutable, signer)
            AccountMeta::new(*self.signer.key, true),
            // depositor_token_account (mutable)
            AccountMeta::new(*self.depositor_token_account.key, false),
            // recipient_token_account (mutable)
            AccountMeta::new(*self.recipient_token_account.key, false),
            // mint
            AccountMeta::new_readonly(*self.mint.key, false),
            // lending_admin (readonly)
            AccountMeta::new_readonly(*self.lending_admin.key, false),
            // lending (mutable)
            AccountMeta::new(*self.lending.key, false),
            // f_token_mint (mutable)
            AccountMeta::new(*self.f_token_mint.key, false),
            // supply_token_reserves_liquidity (mutable)
            AccountMeta::new(*self.supply_token_reserves_liquidity.key, false),
            // lending_supply_position_on_liquidity (mutable)
            AccountMeta::new(*self.lending_supply_position_on_liquidity.key, false),
            // rate_model (readonly)
            AccountMeta::new_readonly(*self.rate_model.key, false),
            // vault (mutable)
            AccountMeta::new(*self.vault.key, false),
            // liquidity (mutable)
            AccountMeta::new(*self.liquidity.key, false),
            // liquidity_program (mutable)
            AccountMeta::new(*self.liquidity_program.key, false),
            // rewards_rate_model (readonly)
            AccountMeta::new_readonly(*self.rewards_rate_model.key, false),
            // token_program
            AccountMeta::new_readonly(*self.token_program.key, false),
            // associated_token_program
            AccountMeta::new_readonly(*self.associated_token_program.key, false),
            // system_program
            AccountMeta::new_readonly(*self.system_program.key, false),
        ];

        let instruction = Instruction {
            program_id: *self.lending_program.key,
            accounts: account_metas,
            data: instruction_data,
        };
        msg!("hehe");

        invoke(
            &instruction,
            &[
                self.signer.to_account_info(),
                self.depositor_token_account.clone(),
                self.recipient_token_account.clone(),
                self.mint.clone(),
                self.lending_admin.clone(),
                self.lending.clone(),
                self.f_token_mint.clone(),
                self.supply_token_reserves_liquidity.clone(),
                self.lending_supply_position_on_liquidity.clone(),
                self.rate_model.clone(),
                self.vault.clone(),
                self.liquidity.clone(),
                self.liquidity_program.clone(),
                self.rewards_rate_model.clone(),
                self.token_program.clone(),
                self.associated_token_program.clone(),
                self.system_program.clone(),
            ],
        )
        .map_err(|_| InteractDappError::CpiToLendingProgramFailed.into())
    }
}