import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { InteractDapp } from "../target/types/interact_dapp";
import {
  PublicKey,
  SystemProgram
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount
} from "@solana/spl-token";

export const provider = anchor.AnchorProvider.env();
anchor.setProvider(anchor.AnchorProvider.env());
export const program = anchor.workspace.InteractDapp as Program<InteractDapp>;

  export const lendingProgramID = new PublicKey(
    "7tjE28izRUjzmxC1QNXnNwcc4N82CNYCexf3k8mw67s3"
  );
  export const user = provider.wallet.publicKey;
  export const liquidityProgramID = new PublicKey(
    "5uDkCoM96pwGYhAUucvCzLfm5UcjVRuxz6gH81RnRBmL"
  );
  export const mint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
  export const JUPITER_ACCOUNTS_SEED_BYTE = {
    lendingAdmin: [
      108, 101, 110, 100, 105, 110, 103, 95, 97, 100, 109, 105, 110,
    ],
    fTokenMint: [102, 95, 116, 111, 107, 101, 110, 95, 109, 105, 110, 116],
    lending: [108, 101, 110, 100, 105, 110, 103],
    liquidity: [108, 105, 113, 117, 105, 100, 105, 116, 121],
    userSupplyPosition: [
      117, 115, 101, 114, 95, 115, 117, 112, 112, 108, 121, 95, 112, 111, 115,
      105, 116, 105, 111, 110,
    ],
    tokenReserve: [114, 101, 115, 101, 114, 118, 101],
    rateModel: [114, 97, 116, 101, 95, 109, 111, 100, 101, 108],
    vaultState: [118, 97, 117, 108, 116, 95, 115, 116, 97, 116, 101],
    lendingRewardRateModel: [
      108, 101, 110, 100, 105, 110, 103, 95, 114, 101, 119, 97, 114, 100, 115,
      95, 114, 97, 116, 101, 95, 109, 111, 100, 101, 108,
    ],
    lendingRewardAdmin: [
      108, 101, 110, 100, 105, 110, 103, 95, 114, 101, 119, 97, 114, 100, 115,
      95, 97, 100, 109, 105, 110,
    ],
    claimAccount: [117, 115, 101, 114, 95, 99, 108, 97, 105, 109]
  };

let lendingAdminPDA: PublicKey;
let fTokenMintPDA: PublicKey;
let lendingPDA: PublicKey;
let liquidityPDA: PublicKey;
let vaultPDA : PublicKey;
let userSupplyPositionPDA: PublicKey;
let tokenReservePDA: PublicKey;
let rateModelPDA: PublicKey;
let lendingRewardsRateModelPDA: PublicKey;
let claimAccountPDA: PublicKey;

let ownerATA: anchor.web3.PublicKey;
let depositorATA: anchor.web3.PublicKey;
let recipientATA: anchor.web3.PublicKey;
let recipient_withdraw_ATA: anchor.web3.PublicKey;

export async function setupEnvironment() {
  console.log("environment for lending!");

  const [lendingAdminPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from(JUPITER_ACCOUNTS_SEED_BYTE.lendingAdmin)],
    lendingProgramID
  );

  const [fTokenMintPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(JUPITER_ACCOUNTS_SEED_BYTE.fTokenMint), mint.toBuffer()],
    lendingProgramID
  );

  const [lendingPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(JUPITER_ACCOUNTS_SEED_BYTE.lending),
      mint.toBuffer(),
      fTokenMintPDA.toBuffer(),
    ],
    lendingProgramID
  );
  const [liquidityPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(JUPITER_ACCOUNTS_SEED_BYTE.liquidity)],
    liquidityProgramID
  );
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [liquidityPDA.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    lendingProgramID
  )

  const [userSupplyPositionPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(JUPITER_ACCOUNTS_SEED_BYTE.userSupplyPosition),
      mint.toBuffer(),
      lendingPDA.toBuffer(),
    ],
    liquidityProgramID
  );

  const [tokenReservePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(JUPITER_ACCOUNTS_SEED_BYTE.tokenReserve), mint.toBuffer()],
    liquidityProgramID
  );

  const [rateModelPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(JUPITER_ACCOUNTS_SEED_BYTE.rateModel), mint.toBuffer()],
    liquidityProgramID
  );

  const [lendingRewardsRateModelPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(JUPITER_ACCOUNTS_SEED_BYTE.lendingRewardRateModel),
      mint.toBuffer(),
    ],
    lendingProgramID
  );
  console.log("lending", lendingRewardsRateModelPDA);

  const ownerATA = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    fTokenMintPDA,
    user,
    true
  )

  const depositorATA = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    mint,
    user,
    true
  )

  const recipientATA = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    fTokenMintPDA,
    user,
    true
  )

  const recipient_withdraw_ATA = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    mint,
    user,
    true
  )

  const [claimAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(JUPITER_ACCOUNTS_SEED_BYTE.claimAccount), user.toBuffer(), mint.toBuffer()],
    liquidityProgramID
  )
}

export async function depositEarn() {
  const tx1 = await program.methods
    .depositEarn(new anchor.BN(1_000_000))
    .accounts({
    signer: user,
    depositorTokenAccount: depositorATA,
    recipientTokenAccount: recipientATA,
    mint: mint,
    lendingAdmin: lendingAdminPDA,
    lending: lendingPDA,
    fTokenMint: fTokenMintPDA,
    supplyTokenReservesLiquidity: tokenReservePDA,
    lendingSupplyPositionOnLiquidity: userSupplyPositionPDA,
    rateModel: rateModelPDA,
    vault: new PublicKey("CWFPa1gcDqGyeTHTmdbhGjCnQv7eRfdhnBpZKFzNr1R2"),
    liquidity: liquidityPDA,
    liquidityProgram: liquidityProgramID,
    rewardsRateModel: new PublicKey("GGtryeuwjcWoG6zg4Xi1vUJN1xRhypms4xt129BKTUxt"),
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    lendingProgram: lendingProgramID,
    })
    .rpc();
  console.log("deposit earn signature", tx1);
}

export async function withdrawEarn() {
  const tx2 = await program.methods.withdrawEarn(new anchor.BN(20_000))
    .accounts({
      signer: user,
      ownerTokenAccount: ownerATA,
      recipientTokenAccount: recipient_withdraw_ATA,
      lendingAdmin: lendingAdminPDA,
      lending: lendingPDA,
      mint: mint,
      fTokenMint: fTokenMintPDA,
      supplyTokenReservesLiquidity:tokenReservePDA,
      lendingSupplyPositionOnLiquidity: userSupplyPositionPDA,
      rateModel: rateModelPDA,
      vault: new PublicKey("CWFPa1gcDqGyeTHTmdbhGjCnQv7eRfdhnBpZKFzNr1R2"),
      claimAccount: claimAccountPDA,
      liquidity: liquidityPDA,
      liquidityProgram: liquidityProgramID,
      rewardsRateModel: new PublicKey("GGtryeuwjcWoG6zg4Xi1vUJN1xRhypms4xt129BKTUxt"),
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      lendingProgram: lendingProgramID,
    }).rpc();
    console.log("withdraw earn signature", tx2);
}