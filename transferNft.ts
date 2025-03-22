import { getOrCreateAssociatedTokenAccount, createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { Connection, Keypair, ParsedAccountData, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import secret from './wallet.json';

const QUICKNODE_RPC = process.env.QUICKNODE_RPC || 'https://api.devnet.solana.com';
const connection = new Connection(QUICKNODE_RPC);

const DESTINATION_WALLET = 'EuEVeJStQoJmXgXyDabgdeAhK75d3wWexJ9C3uCezGAP'; 
const MINT_ADDRESS = '5oaWemm2ZGvtBswRbs9rcQjKDqvmUfp5XSxEz6oa32rb'; 
const TRANSFER_AMOUNT = 1;

const FROM_KEYPAIR = Keypair.fromSecretKey(new Uint8Array(secret));
console.log(`My public key is: ${FROM_KEYPAIR.publicKey.toString()}.`);

async function getNumberDecimals(mintAddress: string):Promise<number> {
    const info = await connection.getParsedAccountInfo(new PublicKey(MINT_ADDRESS));
    const result = (info.value?.data as ParsedAccountData).parsed.info.decimals as number;
    return result;
}

async function sendTokens() {
    console.log(`Sending ${TRANSFER_AMOUNT} ${(MINT_ADDRESS)} from ${(FROM_KEYPAIR.publicKey.toString())} to ${(DESTINATION_WALLET)}.`)
    //Step 1
    console.log(`1 - Getting Source Token Account`);
    let sourceAccount = await getOrCreateAssociatedTokenAccount(
        connection, 
        FROM_KEYPAIR,
        new PublicKey(MINT_ADDRESS),
        FROM_KEYPAIR.publicKey
    );
    console.log(`    Source Account: ${sourceAccount.address.toString()}`);

    //Step 2
    console.log(`2 - Getting Destination Token Account`);
    
    const destinationTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(MINT_ADDRESS), // NFT Mint Address
        new PublicKey(DESTINATION_WALLET), // Receiver's Public Key
        false, // Not a PDA
    );
    const tx = new Transaction();
    // Check if the account exists
    try {
        
        await connection.getAccountInfo(destinationTokenAccount);
    } catch (error) {
        console.log("Destination account not found, creating one...");
    
        const createTokenAccountIx = createAssociatedTokenAccountInstruction(
            FROM_KEYPAIR.publicKey, // Fee Payer
            destinationTokenAccount,
            new PublicKey(DESTINATION_WALLET),
            new PublicKey (MINT_ADDRESS)
        );
    
        tx.add(createTokenAccountIx);
    }
    
    console.log(`    Destination Account: ${destinationTokenAccount.toString()}`);

    //Step 3
    console.log(`3 - Fetching Number of Decimals for Mint: ${MINT_ADDRESS}`);
    const numberDecimals = await getNumberDecimals(MINT_ADDRESS);
    console.log(`    Number of Decimals: ${numberDecimals}`);

    //Step 4
    console.log(`4 - Creating and Sending Transaction`);
    
    tx.add(createTransferInstruction(
        sourceAccount.address,
        destinationTokenAccount,
        FROM_KEYPAIR.publicKey,
        TRANSFER_AMOUNT * Math.pow(10, numberDecimals)
    ));

    const latestBlockHash = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = await latestBlockHash.blockhash;    
    const signature = await sendAndConfirmTransaction(connection,tx,[FROM_KEYPAIR]);
    console.log(
        '\x1b[32m', //Green Text
        `   Transaction Success!🎉`,
        `\n    https://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
}

sendTokens();

// Output:
// https://explorer.solana.com/tx/4mHCxAGcJWgJf7EddZT82aEDaB2F3SUMpeo7u9Pda4BMDy3fpZjnMX8MwJUJ9TwoaRRgdkZACrn9XvoSTY8vmFy9?cluster=devnet