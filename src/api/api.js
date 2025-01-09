const express = require('express');
const morgan = require('morgan');
const { loadRounds, saveRound, loadRoundReward } = require('../db/db');
const { roundTypes, assetTypes } = require('../constants')
const { ethers } = require("ethers");
const log4js = require("log4js");
const logger = log4js.getLogger();
const httpLogger = log4js.getLogger('http');
const { getUsersInChannel, getUsersInfoByAddresses } = require('../client/openrankClient')
const { getERC20Decimals } = require('../client/ethClient')
const app = express();
const { createRoundV1 } = require('../service/roundV1Service')
const { isZeroAddress } = require('../utils')
const { logFilename } = require('../constants')
const path = require('path');
const fs = require('fs');
const { fetchChannelInfo } = require('../client/wrapcast');

app.use(express.json());
app.use(morgan('dev'));

app.use(log4js.connectLogger(httpLogger, {
    level: 'info',
    format: ':method :url :status :response-time ms',
}));

// this is go-through request
// todo
// return response and create a round async


/** 
channelId: "music"
dateRange: Object { from: "2024-12-22T18:30:00.000Z", to: "2024-12-26T18:30:00.000Z" }
distributionType: "recurring"
eligibleUsersCount: 21
frequencyDays: 2
recipientPercentage: 10
tokenAddress: "0x0000000000000000000000000000000000000000"
tokenAmount: 100
*/

app.post('/rounds', async (req, res) => {
    const { message, signature } = req.body

    console.log({ message })
    const {
        tokenAmount,
        tokenAddress,
        channelId,
        frequencyDays,
        eligibleUsersCount,
        dateRange,
        orderUsersBy,
        stpContract,
        excludedUsersFID = [],
    } = JSON.parse(message);

    const amount = tokenAmount
    const topUserCount = eligibleUsersCount
    const roundInterval = frequencyDays
    const assetAddress = tokenAddress
    
    try {
        // todo check message.timestamp

        const address = ethers.verifyMessage(message, signature);
        const usersInfo = await getUsersInfoByAddresses([address])
        const userInfo = usersInfo[0] 
        const channelInfo = await fetchChannelInfo(channelId)
        if (!userInfo || !channelInfo.moderatorFids.includes(userInfo.fid)) {
            res.status(403)
            return    
        }
    } catch (e) {
        res.status(403)
        return
    }

    if (!amount || !assetAddress || !channelId || !roundInterval || !topUserCount || !orderUsersBy) {
        return res.status(400).json({
            error: `All fields are required 
            ${JSON.stringify({ amount, assetAddress, channelId, roundInterval, topUserCount, orderUsersBy })}`
        });
    }

    const usersInChannel = await getUsersInChannel(channelId)

    if (usersInChannel.length === 0) {
        res.status(400).json({ error: `Channel ${channelId} is not tracked at https://graph.cast.k3l.io/channels/rankings/${channelId}` });
        return
    }

    // todo check if sender is in the channel

    let decimals = 18
    let assetType
    if (isZeroAddress(assetAddress)) {
        assetType = assetTypes.eth
    } else {
        decimals = await getERC20Decimals(assetAddress)
        assetType = assetTypes.erc20

    }

    if (!ethers.isAddress(assetAddress)) {
        res.status(400).json({ error: `${assetAddress} must be a valid ethereum 0x address` });
        return
    }

    const dbRounds = await loadRounds();
    const roundId = 100 + dbRounds.length + Math.floor(Math.random() * 1000001)
    let roundAddress
    const type = roundTypes.v1
    const createdAt = Date.now().toString()

    try {
        roundAddress = await createRoundV1({ assetType, assetAddress, roundId, amount })
    }
    catch (e) {
        logger.error('Error during creating round', e);
        res.status(500).json({ error: 'Error during creating round ' + e });
        return
    }

    if (!ethers.isAddress(roundAddress)) {
        logger.error(`Error during creating a round ${roundAddress}`)
    }

    try {
        const newRound = {
            type, amount, assetAddress, channelId, roundInterval, createdAt,
            topUserCount, roundAddress, roundId, decimals, orderUsersBy,
            excludedUsersFID,
            stpContract
        }
        await saveRound(newRound);

        logger.info(`New round created! 
            ${JSON.stringify({
            type, amount, assetAddress, channelId, roundInterval, createdAt,
            topUserCount, roundAddress, roundId, decimals, orderUsersBy, excludedUsersFID,
            stpContract
        })}
            `)

        res.status(201).json({ message: 'Round created successfully', roundAddress });
    } catch (error) {
        logger.error('Error saving to DB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/rounds', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    try {
        const rounds = await loadRounds();
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const paginatedRounds = rounds.slice(startIndex, endIndex);
        res.status(200).json({
            total: rounds.length,
            page: pageNumber,
            limit: pageSize,
            data: paginatedRounds,
        });
    } catch (error) {
        logger.error('Error reading from DB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/rounds/channel/:channelId', async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    try {
        const allRounds = await loadRounds();
        const filteredRounds = allRounds.filter(round => round.channelId === channelId);


        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedRounds = filteredRounds.slice(startIndex, endIndex);

        res.status(200).json({
            total: filteredRounds.length,
            page: pageNumber,
            limit: pageSize,
            data: paginatedRounds,
        });
    } catch (error) {
        logger.error('Error reading from DB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/rounds/:roundAddress/rewards', async (req, res) => {
    const { roundAddress } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    if (!ethers.isAddress(roundAddress)) {
        res.status(400).json({ error: `${roundAddress} must be a valid ethereum 0x address` });
        return
    }

    try {
        const allRounds = await loadRoundReward(roundAddress);

        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedRoundRewards = allRounds.slice(startIndex, endIndex);

        res.status(200).json({
            total: allRounds.length,
            page: pageNumber,
            limit: pageSize,
            data: paginatedRoundRewards,
        });
    } catch (error) {
        logger.error('Error reading from DB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const getLastLines = (filePath, maxLines, callback) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return callback(err, null);
        }

        const lines = data.split('\n');
        const lastLines = lines.slice(-maxLines).join('\n');
        callback(null, lastLines);
    });
};

app.get('/log', (req, res) => {
    const logFilePath = path.join(__dirname, '..', logFilename);

    const linesCount = 500

    if (!fs.existsSync(logFilePath)) {
        return res.status(404).send('<h1>Log file not found</h1>');
    }

    getLastLines(logFilePath, linesCount, (err, lastLines) => {
        if (err) {
            console.error('Error reading log file:', err);
            return res.status(500).send('<h1>Error reading log file</h1>');
        }

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Log File</title>
        </head>
        <body>
          <h1>Application Log (Last ${linesCount} Lines)</h1>
          <pre style="white-space: pre-wrap; word-wrap: break-word;">${lastLines}</pre>
        </body>
        </html>
      `;

        res.send(htmlContent);
    });
});

const PORT = 3009;

const init = () => {
    app.listen(PORT, () => {
        logger.info(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = {
    init
}
