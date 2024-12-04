(async function () {
    require("dotenv").config();
    const { ethers } = require("ethers");
    const path = require('path');

    // dune query
    // https://dune.com/queries/4354729?sidebar=version-history

    // https://docs.neynar.com/docs/address-user-score-contract
    // Environment variables
    const PROVIDER_URL = 'https://base-mainnet.infura.io/v3/0a86f4dd6262404ca9558fcc0c3197e8'
    const PRIVATE_KEY = process.env.PRIVATE_KEY;

    const CONTRACT_ADDRESS = "0xd3C43A38D1D3E47E9c420a733e439B03FAAdebA8";

    const CONTRACT_ABI = [
        "function getScores(uint256[] calldata fids) external view returns (uint24[])"
    ];

    const fs = require('fs');
    const csv = require('csv-parser');

    const filePath = './script/top50.csv';
    const outputPath = path.join(__dirname, 'output50.csv');

    let batch = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
            batch.push(row);
        })
        .on('end', async () => {
            await loop()
        })
        .on('error', (err) => {
            console.error('Error reading the CSV file:', err);
        });

    let finalScores = []
    const loop = async () => {
        // batch.length = 100

        let fids = []
        for (let i = 0; i < batch.length; i++) {
            fids.push(batch[i])

            if (i && i % 10 === 0) {
                const r = await callContract(fids.map(a => a.i))

                if (r.length !== fids.length) {
                    console.log(r.length, fids.length)
                }
                console.log(i)

                finalScores.push(...r)
                fids = []
            }
        }

        const r = await callContract(fids.map(a => a.i))
        finalScores.push(...r)

        console.log(batch.length)
        console.log(finalScores.length)
        createCSV(batch, finalScores, outputPath);
    }

    const createCSV = (batch, scores, outputPath) => {
        if (batch.length !== scores.length) {
            console.error('Batch and scores arrays must have the same length.');
            return;
        }

        const csvRows = ['fid,neynar,openrank']; 

        for (let i = 0; i < batch.length; i++) {
            const fid = batch[i].i;
            const neynar = scores[i];
            const openrank = batch[i].v;

            csvRows.push(`${fid},${neynar},${openrank}`);
        }

        const csvContent = csvRows.join('\n');
        fs.writeFileSync(outputPath, csvContent, 'utf8');
        console.log(`CSV file created at: ${outputPath}`);
    };

    const callContract = async (batch) => {
        try {
            const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
            const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

            const fids = batch

            const scores = await contract.getScores(fids);
            return scores
        } catch (error) {
            console.error("Error fetching scores from contract:", error);
        }
    };

})()
