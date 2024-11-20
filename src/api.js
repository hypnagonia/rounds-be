const express = require('express');
const morgan = require('morgan');
const { loadRounds, saveRound } = require('./db');
const axios = require('axios');
const { ethers } = require("ethers");
const log4js = require("log4js");
const logger = log4js.getLogger();
const httpLogger = log4js.getLogger('http');

const OPENRANK_HOST = `https://graph.cast.k3l.io`;

const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use(log4js.connectLogger(httpLogger, {
    level: 'info',
    format: ':method :url :status :response-time ms', 
}));

app.post('/rounds', async (req, res) => {
    const { amount, address, channel, roundInterval } = req.body;

    if (!amount || !address || !channel || !roundInterval) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const url = `${OPENRANK_HOST}/channels/rankings/${channel}`
    const response = await axios.get(url);
    
    if (response.data.result.length === 0) {
        res.status(400).json({ error: `Channel ${channel} is not tracked at https://graph.cast.k3l.io/channels/rankings/${channel}` });
        return
    }

    if (!ethers.isAddress(address)) {
        res.status(400).json({ error: `${address} must be a valid ethereum 0x address` });
        return 
    } 

    const createdAt = Date.now().toString()

    try {
        await saveRound({ amount, address, channel, roundInterval, createdAt });

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
