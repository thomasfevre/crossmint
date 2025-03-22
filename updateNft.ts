import { updateMetadataAccountV2, mplTokenMetadata, updateArgs, fetchMetadataFromSeeds, updateV1 } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createGenericFile, createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount, sol } from '@metaplex-foundation/umi';
import { mockStorage } from '@metaplex-foundation/umi-storage-mock';
import { publicKey, unwrapOptionRecursively } from '@metaplex-foundation/umi'

import secret from './wallet.json';
import * as dotenv from 'dotenv';
dotenv.config();

const QUICKNODE_RPC = process.env.QUICKNODE_RPC;
console.log(`QUICKNODE_RPC: ${QUICKNODE_RPC}`);
const umi = createUmi(QUICKNODE_RPC!, { commitment: 'confirmed' }); 
const MINT_ADDRESS = publicKey('5oaWemm2ZGvtBswRbs9rcQjKDqvmUfp5XSxEz6oa32rb');

const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
const creator = createSignerFromKeypair(umi, creatorWallet);
umi.use(keypairIdentity(creator));
umi.use(mplTokenMetadata());
umi.use(mockStorage());


const nftDetailUpdated = {
    name: `Demo Airdrop # 1 - Updated`,
    image: 'https://arweave.net/UTFFfaVA3HoFcxwoMHEcvBLq19HrW6FuzpyygXqxduk',
    description: 'Demo airdrop NFT using UMI from Metaplex Foundation',
    attributes: [
        {
            trait_type: "background",
            value: "red"
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
            name: nftDetailUpdated.name,
            description: nftDetailUpdated.description,
            image: nftDetailUpdated.image,
            attributes: nftDetailUpdated.attributes,
            properties: {
                files: [
                    {
                        type: nftDetailUpdated.properties.category,
                        uri: nftDetailUpdated.image,
                    },
                ]
            }
        };
        console.log('Uploading metadata:', metadata);
        const metadataUri = await umi.uploader.uploadJson(metadata);
        console.log('Uploaded metadata:', metadataUri);
        return metadataUri;
    } catch (e) {
        throw e;
    }
}


async function updateNft(metadataUri: string) {
    try {
        const update = generateSigner(umi);

        (async () => {
            const metadata = await fetchMetadataFromSeeds(umi, { mint: MINT_ADDRESS });
            await updateV1(umi, {
                mint: MINT_ADDRESS,
                authority: creator,
                data: {
                    ...metadata,
                    name: nftDetailUpdated.name,
                    symbol: "testU",
                    uri: metadataUri,
                    sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
                    creators: metadata.creators
                }
            }).sendAndConfirm(umi);
            console.log(`Updated NFT metadata for mint: ${MINT_ADDRESS.toString()}`);
        })();
        
        console.log(`Updated NFT: ${update.publicKey.toString()}`)
    } catch (e) {
        throw e;
    }
}

async function main() {
    console.log('Updating NFT metadata...');
   
    const metadataUri = await uploadMetadata();
    await updateNft(metadataUri);
}

main();

// Uploaded metadata: https://mockstorage.example.com/m5r7uIwHHR8Q5qFKNOIf
// Updated NFT: DB1KJTwzyRdBhby2r2jEDissqRGFvL9f1sApxVa8xyLd
// Updated NFT metadata for mint: 5oaWemm2ZGvtBswRbs9rcQjKDqvmUfp5XSxEz6oa32rb