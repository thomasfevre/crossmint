import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createGenericFile, createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount, sol } from '@metaplex-foundation/umi';
import { mockStorage } from '@metaplex-foundation/umi-storage-mock';
import * as fs from 'fs';
import secret from './wallet.json';

const QUICKNODE_RPC = process.env.QUICKNODE_RPC || 'https://api.devnet.solana.com';
const umi = createUmi(QUICKNODE_RPC); 

const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
const creator = createSignerFromKeypair(umi, creatorWallet);
umi.use(keypairIdentity(creator));
umi.use(mplTokenMetadata());
umi.use(mockStorage());


const nftDetail = {
    name: `Demo Airdrop # 1`,
    image: 'https://arweave.net/UTFFfaVA3HoFcxwoMHEcvBLq19HrW6FuzpyygXqxduk',
    description: 'Demo airdrop NFT using Crossmint Mint API via the Quicknode add-on',
    attributes: [
        {
            trait_type: "background",
            value: "blue"
        },
        {
            trait_type: "type",
            value: "pixel"
        },
        {
            trait_type: "id",
            value: "1"
        }
    ],
    properties: {
        files: [
            {
                "uri": "https://arweave.net/UTFFfaVA3HoFcxwoMHEcvBLq19HrW6FuzpyygXqxduk",
                "type": "image/png"
            }
        ],
        category: "image"
    }
}

async function uploadMetadata(): Promise<string> {
    try {
        const metadata = {
            name: nftDetail.name,
            description: nftDetail.description,
            image: nftDetail.image,
            attributes: nftDetail.attributes,
            properties: {
                files: [
                    {
                        type: nftDetail.properties.category,
                        uri: nftDetail.image,
                    },
                ]
            }
        };
        const metadataUri = await umi.uploader.uploadJson(metadata);
        console.log('Uploaded metadata:', metadataUri);
        return metadataUri;
    } catch (e) {
        throw e;
    }
}


async function mintNft(metadataUri: string) {
    try {
        const mint = generateSigner(umi);
        await createNft(umi, {
            mint,
            name: nftDetail.name,
            symbol: "test",
            uri: metadataUri,
            sellerFeeBasisPoints: percentAmount(0),
            creators: [{ address: creator.publicKey, verified: true, share: 100 }],
        }).sendAndConfirm(umi)
        console.log(`Created NFT: ${mint.publicKey.toString()}`)
    } catch (e) {
        throw e;
    }
}

async function main() {
    // const imageUri = await uploadImage();
    const metadataUri = await uploadMetadata();
    await mintNft(metadataUri);
}

main();

// Uploaded metadata: https://mockstorage.example.com/qoagIIcE3bhSZUsRTlRc
// Created NFT: 5oaWemm2ZGvtBswRbs9rcQjKDqvmUfp5XSxEz6oa32rb