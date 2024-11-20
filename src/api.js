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
    const { amount, tokenAddress, channel, roundInterval } = req.body;

    if (!amount || !address || !channel || !roundInterval) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const usersInChannel = await getUsersInChannel(channel)

    if (usersInChannel.length === 0) {
        res.status(400).json({ error: `Channel ${channel} is not tracked at https://graph.cast.k3l.io/channels/rankings/${channel}` });
        return
    }

    // todo check if sender is in the channel?
    
    let assetType
    if (isZeroAddress(tokenAddress)) {
        assetType = assetTypes.eth
    } else {
        assetType = assetTypes.erc20
    }


    if (!ethers.isAddress(address)) {
        res.status(400).json({ error: `${address} must be a valid ethereum 0x address` });
        return
    }

    // const roundAddress = createRoundV1()
    const type = roundTypes.v1
    const createdAt = Date.now().toString()

    try {
        await saveRound({ type, amount, address, channel, roundInterval, createdAt });

        // todo address
        res.status(201).json({ message: 'Round created successfully' });
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

const init = () => {
    const PORT = 3009;

    app.listen(PORT, () => {
        logger.info(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = {
    init
}
