import * as anchor from "@coral-xyz/anchor";
import { InteractDapp } from "../target/types/interact_dapp";
import {
    Connection,
    AccountMeta,
    PublicKey,
    Transaction,
    SystemProgram,
  } from "@solana/web3.js";
import { ApiV3Token, ApiClmmConfigV3, ComputeClmmPoolInfo, PoolUtils, ReturnTypeFetchMultiplePoolTickArrays, toApiV3Token } from '@raydium-io/raydium-sdk-v2';
import {provider, program} from "./lending";
import { getPoolAddress, getPoolVaultAddress, getOrcleAccountAddress, getAmmConfigAddress, getTickArrayAddress} from "./utils";
import { createSyncNativeInstruction, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {MEMO_PROGRAM_ID} from "@solana/spl-memo";
import { getAccount, getMint } from "@solana/spl-token";

export const ClmmProgram = new PublicKey(
  "DRayAUgENGQBKVaX8owNhgzkEDyoHTGVEGHVJT1E9pfH"
);

const token0 = new PublicKey("So11111111111111111111111111111111111111112");
const token1 = new PublicKey("USDCoctVLVnvTXBEuP9s8hntucdJokbo17RwHuNXemT");
const owner = anchor.Wallet.local().payer;

export async function test() {
    const [configAddress] = await getAmmConfigAddress(
        0,
        ClmmProgram
    )
    const [poolAddress] = await getPoolAddress(
        configAddress,
        token0,
        token1,
        ClmmProgram
    );
    const accountInfo = await provider.connection.getAccountInfo(poolAddress);
    const data = accountInfo.data;
    const tickSpacing = data.readUInt16LE(227);
    const tickCurrent = data.readInt32LE(261);
    const tickArraySpacing = tickSpacing * 88;
    const startIndex = Math.floor(tickCurrent / tickArraySpacing) * tickArraySpacing;
    const [tickArrayAddress] = await getTickArrayAddress(
        poolAddress,
        ClmmProgram,
        startIndex
    )
    console.log(poolAddress.toBase58());
    console.log(tickArrayAddress.toBase58());
}

async function wrapSol(
    provider: anchor.AnchorProvider,
    amountSol: number
  ): Promise<PublicKey> {
    const lamports = amountSol * 1e9; // convert SOL → lamports
    const owner = provider.wallet.publicKey;
  
    // WSOL ATA (Associated Token Account)
    const wsolATA = getAssociatedTokenAddressSync(token0, owner);
  
    // check xem ATA có chưa
    const info = await provider.connection.getAccountInfo(wsolATA);
    const tx = new Transaction();
  
    if (!info) {
      // chưa có thì tạo account + nạp SOL
      tx.add(
        SystemProgram.createAccount({
          fromPubkey: owner,
          newAccountPubkey: wsolATA,
          lamports,
          space: 165, // fixed size for token account
          programId: TOKEN_PROGRAM_ID,
        }),
        createSyncNativeInstruction(wsolATA)
      );
    } else {
      // có rồi thì chỉ cần gửi thêm SOL
      tx.add(
        SystemProgram.transfer({
          fromPubkey: owner,
          toPubkey: wsolATA,
          lamports,
        }),
        createSyncNativeInstruction(wsolATA)
      );
    }
  
    await provider.sendAndConfirm(tx);
    console.log(`✅ Wrapped ${amountSol} SOL → WSOL`);
    return wsolATA;
}

export async function swapClmm () {
    await wrapSol(provider, 0.1);
    const amount = new anchor.BN(1e6);
    const otherAmountThreshold = new anchor.BN(0.1 * 1e6); 
    const [configAddress] = await getAmmConfigAddress(
        0,
        ClmmProgram
    )
    const inputTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        owner,
        token0,
        owner.publicKey,
        true
    )
    const outputTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        owner,
        token1,
        owner.publicKey,
        true
    )
    const [poolAddress] = await getPoolAddress(
        configAddress,
        token0,
        token1,
        ClmmProgram
    );
    const [inputVault] = await getPoolVaultAddress(
        poolAddress,
        token0,
        ClmmProgram
    )
    const [outputVault] = await getPoolVaultAddress(
        poolAddress,
        token1,
        ClmmProgram
    )
    const [observationState] = await getOrcleAccountAddress(
        poolAddress,
        ClmmProgram
    )
    const accountInfo = await provider.connection.getAccountInfo(poolAddress);
    const data = accountInfo.data;
    const mintA = await toApiV3Token({
        address: token0.toString(),
        programId: TOKEN_PROGRAM_ID.toString(),
        decimals: 9
    });
    const mintB = await toApiV3Token({
        address: token1.toString(),
        programId: TOKEN_2022_PROGRAM_ID.toString(),
        decimals: 6
    });
    const config: ApiClmmConfigV3 = {
        id: configAddress.toString(),
        index: 0,
        protocolFeeRate: data.readUInt16LE(225),
        tradeFeeRate: data.readUInt16LE(223),
        tickSpacing: data.readUInt16LE(227),
        fundFeeRate: data.readUInt16LE(226),
        description: "",
        defaultRange: data.readInt32LE(229),
        defaultRangePoint: [data.readInt32LE(233), data.readInt32LE(237)],
    };

    const clmmPoolInfo = await PoolUtils.fetchComputeClmmInfo({
        connection: provider.connection,
        poolInfo: {
            id: poolAddress.toString(),
            programId: ClmmProgram.toString(),
            mintA: mintA,
            mintB: mintB,
            config: config,
            price: 0,
        },
    });
    const tickArrayCache = await PoolUtils.fetchMultiplePoolTickArrays({
        connection: provider.connection,
        poolKeys: [clmmPoolInfo],
    });
    const {expectedAmountOut, remainingAccounts} = 
    PoolUtils.getOutputAmountAndRemainAccounts(
        clmmPoolInfo,
        tickArrayCache[poolAddress.toBase58()],
        token0,
        new anchor.BN(1_000_000)
    );

    const token0AccountInfo = await getAccount(provider.connection, inputVault);
    const token1AccountInfo = await getAccount(provider.connection, outputVault);   
    const mint0Info = await getMint(provider.connection, token0);
    const mint1Info = await getMint(provider.connection, token1);
    const inputBalance = Number(token0AccountInfo.amount) / 10 ** mint0Info.decimals;
    const outputBalance = Number(token1AccountInfo.amount) / 10 ** mint1Info.decimals;
    const sqrtPriceLimit = new anchor.BN(Math.sqrt(outputBalance / inputBalance) - 1);
    console.log("price current: ", outputBalance / inputBalance);
    console.log("Input Vault Balance:", inputBalance);
    console.log("Output Vault Balance:", outputBalance);
    console.log("expectedAmountOut:", expectedAmountOut.toString());
    console.log("remainingAccounts:", remainingAccounts.map(a => a.toBase58()));
    console.log("payer:", owner.publicKey.toBase58());
    console.log("ammConfig:", configAddress.toBase58());
    console.log("poolState:", poolAddress.toBase58());
    console.log("inputTokenAccount:", inputTokenAccount.address.toBase58());
    console.log("outputTokenAccount:", outputTokenAccount.address.toBase58());
    console.log("inputVault:", inputVault.toBase58());
    console.log("outputVault:", outputVault.toBase58());
    console.log("observationState:", observationState.toBase58());
    console.log("tokenProgram:", TOKEN_PROGRAM_ID.toBase58());
    console.log("tokenProgram2022:", TOKEN_2022_PROGRAM_ID.toBase58());
    console.log("memoProgram:", MEMO_PROGRAM_ID.toBase58());
    console.log("inputVaultMint:", token0.toBase58());
    console.log("outputVaultMint:", token1.toBase58());

    const tx = await program.methods
    .proxySwap(amount, otherAmountThreshold, sqrtPriceLimit, false)
    .accountsPartial({
        clmmProgram: ClmmProgram,
        payer: owner.publicKey,
        ammConfig: configAddress,
        poolState: poolAddress,
        inputTokenAccount: inputTokenAccount.address,
        outputTokenAccount: outputTokenAccount.address,
        inputVault: inputVault,
        outputVault: outputVault,
        observationState: observationState,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenProgram2022: TOKEN_2022_PROGRAM_ID,
        memoProgram: MEMO_PROGRAM_ID,
        inputVaultMint: token0,
        outputVaultMint: token1,
    })
    .remainingAccounts(remainingAccounts.map((pubkey): AccountMeta => {
        return {
            pubkey: pubkey,
            isSigner: false,
            isWritable: true,
        };
    }))
    .rpc();

    console.log("swap tx:", tx);
}


