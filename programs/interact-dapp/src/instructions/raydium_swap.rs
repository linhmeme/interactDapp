use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke_signed};

pub fn raydium_swap_cpi(
    ctx: Context<RaydiumSwapCpi>,
    amount_in: u64,
    min_amount_out: u64,
) -> Result<()> {
    // TODO: thay bằng layout instruction Raydium thực tế
    let mut data: Vec<u8> = vec![1u8]; // opcode giả định
    data.extend_from_slice(&amount_in.to_le_bytes());
    data.extend_from_slice(&min_amount_out.to_le_bytes());

    let raydium_program = ctx.accounts.raydium_program.key();
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
        program_id: raydium_program_id(),
        accounts,
        data,
    };

    invoke_signed(&ix, &ctx.remaining_accounts, &[])?;
    Ok(())
}

fn raydium_program_id() -> Pubkey {
    Pubkey::from_str("RaydiumProgram11111111111111111111111111111").unwrap()
}

#[derive(Accounts)]
pub struct RaydiumSwap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    // TODO: thêm accounts của Raydium pool, vault...
}
