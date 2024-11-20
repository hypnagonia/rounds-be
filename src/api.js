const express = require('express');
const morgan = require('morgan');
const { loadRounds, saveRound } = require('./db');

const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.post('/rounds', async (req, res) => {
    const { amount, address, channel, roundInterval } = req.body;

    if (!amount || !address || !channel || !roundInterval) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const createdAt = Date.now().toString()
    
    try {
        await saveRound({ amount, address, channel, roundInterval, createdAt });
        res.status(201).json({ message: 'Round created successfully' });
    } catch (error) {
        console.error('Error saving to DB:', error);
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
        console.error('Error reading from DB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const init = () => {
    const PORT = 3009;

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = {
    init
}
