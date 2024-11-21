const express = require('express');
const morgan = require('morgan');
const { loadRounds, saveRound } = require('./db');
const { roundTypes, assetTypes } = require('./constants')
const { ethers } = require("ethers");
const log4js = require("log4js");
const logger = log4js.getLogger();
const httpLogger = log4js.getLogger('http');
const { getUsersInChannel } = require('./openrankClient')
const app = express();
const { createRoundV1 } = require('./roundV1Service')
const { isZeroAddress } = require('./utils')
const { logFilename } = require('./constants')
const path = require('path');
const fs = require('fs');

app.use(express.json());
app.use(morgan('dev'));

app.use(log4js.connectLogger(httpLogger, {
    level: 'info',
    format: ':method :url :status :response-time ms',
}));

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// this is go-through request
// todo
// return response and create a round async

app.post('/rounds', async (req, res) => {
    const { amount, assetAddress, channel, roundInterval, topUserCount } = req.body;
    // top users
    // date range for recurring rounds

    if (!amount || !assetAddress || !channel || !roundInterval || !topUserCount) {
        return res.status(400).json({ error: 'All fields are required { amount, assetAddress, channel, roundInterval, topUserCount }' });
    }

    const usersInChannel = await getUsersInChannel(channel)

    if (usersInChannel.length === 0) {
        res.status(400).json({ error: `Channel ${channel} is not tracked at https://graph.cast.k3l.io/channels/rankings/${channel}` });
        return
    }

    // todo check if sender is in the channel

    let assetType
    if (isZeroAddress(assetAddress)) {
        assetType = assetTypes.eth
    } else {
        assetType = assetTypes.erc20
    }


    if (!ethers.isAddress(assetAddress)) {
        res.status(400).json({ error: `${assetAddress} must be a valid ethereum 0x address` });
        return
    }

    const roundId = 4 // todo
    let roundAddress
    const type = roundTypes.v1
    const createdAt = Date.now().toString()

    try {
        roundAddress = await createRoundV1({ assetType, assetAddress, roundId, amount })
    }
    catch (e) {
        logger.error('Error during creating round', e);
        res.status(500).json({ error: 'Internal server error' });
    }

    if (!ethers.isAddress(roundAddress)) {
        logger.error(`Error during creating a round ${roundAddress}`)
    }

    console.log({roundAddress})
    try {
        await saveRound({ type, amount, assetAddress, channel, roundInterval, createdAt, topUserCount, roundAddress, roundId });

        logger.info(`New round created! 
            ${JSON.stringify({ type, amount, assetAddress, channel, roundInterval, createdAt, topUserCount, roundAddress, roundId })}
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
