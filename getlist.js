import fetch from 'node-fetch';
import getParsedTx from './getParsedTx.js';
import getNFT from './getNFT.js';
import fs from 'fs';
import getSig from './getSig.js';
import discord from './discord.js';
import dotenv from 'dotenv';
import cron from 'cron';

const CronJob = cron.CronJob;

dotenv.config();

if (process.argv[2] === 'now') {
    var when = '* * * * *';
} else {
    var when = '0 * * * *';
}
console.log('Cronjob set to', when);
const job = new CronJob(when, async function () {

    try {
        const url = process.env.API_URL;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        };

        const req = await fetch(url, { headers });
        const res = await req.json();
        const data = res.data;

        const collectionList = []

        for (const collection of data) {
            const tx = collection.last_trade_id;
            const name = collection.collection_name;
            console.log('Signature', tx);

            if (tx === '3TEk8AFgpAeqKZAJKYK4o6ZkCMXTaNTDYiNtfjTpzhS9jZQUD4XAGebiw6omHokbh9yCtu755fc5pydb6Za3o4F2') {
                console.log('Skipping', name);
            }

            if (tx !== '3TEk8AFgpAeqKZAJKYK4o6ZkCMXTaNTDYiNtfjTpzhS9jZQUD4XAGebiw6omHokbh9yCtu755fc5pydb6Za3o4F2') {
                // Add a delay of 1 second between each API call
                await new Promise(resolve => setTimeout(resolve, 500));
                const mintAddress = await getParsedTx(tx);
                // Get creator
                const nft = await getNFT(mintAddress);
                // console.log('Creator', nft?.creators[0]?.address);
                if (nft?.creators[0]?.address) {

                    // get transactions for the creator
                    const txs = await getSig(nft?.creators[0]?.address, 1000);
                    console.log(`${name} had Address Transactions`, txs.length);

                    // filter tx
                    const currentTime = new Date().getTime();
                    const previousHourTimestamp = currentTime - (60 * 60 * 1000);
                    const transactionsInPreviousHour = txs.filter((transaction) => {
                        const blockTimeMilliseconds = transaction.blockTime * 1000;
                        return blockTimeMilliseconds > previousHourTimestamp && blockTimeMilliseconds <= currentTime;
                    }
                    );
                    console.log(`${name} transactions executed in the previous hour:`, transactionsInPreviousHour.length);

                    const nfts = [];
                    for (const salesTx of transactionsInPreviousHour) {
                        const mintAddress = salesTx.meta?.innerInstructions[0]?.instructions[0]?.parsed?.info?.mint ? salesTx.meta?.innerInstructions[0]?.instructions[0]?.parsed?.info?.mint : undefined;
                        if (mintAddress) {
                            const nft = await getNFT(mintAddress);
                            nfts.push(nft);
                        }
                    }
                    console.log(`There were ${nfts.length} NFTs sold in the previous hour.`)
                    const collection = { name: name, mint: mintAddress, creator: nft.creators[0].address, nftsSold: nfts.length, transactions: transactionsInPreviousHour.length }
                    collectionList.push(collection);
                    fs.appendFileSync('nfts.json', JSON.stringify(collection));
                }

            }
            collectionList.sort((a, b) => {
                return b.nftsSold - a.nftsSold;
            });
            fs.writeFileSync('list.json', JSON.stringify(collectionList));
        }

        const list = `Top ${collectionList.length} collections in the past hour:\n`

        collectionList.map((collection) => {
            list += `${collection.name} - ${collection.nftsSold} NFTs sold\n`
        })

        console.log(list);
        await discord(process.env.DISCORD_REPORT_WEBHOOK, list)
    } catch (err) {
        console.log(err);
    }

});

job.start();

