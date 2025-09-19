use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke_signed};

pub fn jupiter_deposit_cpi(ctx: Context<JupiterLendCpi>, amount: u64) -> Result<()> {
    // TODO: thay bằng layout instruction Jupiter deposit thực tế
    let mut data: Vec<u8> = vec![0u8]; // opcode giả định = deposit
    data.extend_from_slice(&amount.to_le_bytes());

    let jupiter_program = ctx.accounts.jupiter_program.key();
    let accounts = ctx
        .remaining_accounts
        .iter()
        .map(|acc| {
            if acc.is_writable {
                AccountMeta::new(*acc.key, acc.is_signer)
            } else {
                AccountMeta::new_readonly(*acc.key, acc.is_signer)
            }
        })
        .collect::<Vec<_>>();

    let ix = Instruction {
        program_id: jupiter_program_id(),
        accounts,
        data,
    };

    invoke_signed(&ix, &ctx.remaining_accounts, &[])?;
    Ok(())
}

fn jupiter_program_id() -> Pubkey {
    Pubkey::from_str("JupiterProgram1111111111111111111111111111").unwrap()
}

#[derive(Accounts)]
pub struct JupiterDeposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    // TODO: thêm accounts của Jupiter Lend
}