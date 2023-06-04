import { Metaplex } from "@metaplex-foundation/js";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

export default async (mint) => {

    console.log('mint', mint)
    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const metaplex = new Metaplex(connection);
    const mintAddress = new PublicKey(mint);
    const nft = await metaplex.nfts().findByMint({ mintAddress });
    return nft;
}

