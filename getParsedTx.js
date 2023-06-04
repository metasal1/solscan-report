import { Connection, clusterApiUrl } from '@solana/web3.js';
import jsonpath from 'jsonpath';
import dotenv from 'dotenv';

dotenv.config();

// const endpoint = clusterApiUrl('mainnet-beta');
const endpoint = `https://${process.env.RPC}`
const solana = new Connection(endpoint, 'confirmed');


export default async (tx) => {
    const sig = await solana.getParsedTransaction(tx, { maxSupportedTransactionVersion: 0 });
    const mints = jsonpath.query(sig, '$..mint');

    try {
        const mint = mints[0];
        return mint;
    } catch (error) {
        console.log('error', error)
    }
}