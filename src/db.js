const fs = require('fs-extra');
const csv = require('csv-parser');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'rounds.csv');

fs.ensureFileSync(dbPath); // Ensure the file exists
if (fs.readFileSync(dbPath, 'utf8').trim() === '') {
    fs.writeFileSync(dbPath, 'amount,address,channel,createdAt,roundInterval\n'); // Write header if empty
}

const loadRounds = async () => {
    const rounds = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(dbPath)
            .pipe(csv())
            .on('data', (data) => rounds.push(data))
            .on('end', () => resolve(rounds))
            .on('error', (error) => reject(error));
    });
};

const saveRound = async (round) => {
    const { amount, address, channel, roundInterval, createdAt } = round;
    const newRound = `${amount},${address},${channel},${createdAt},${roundInterval}\n`;
    await fs.appendFile(dbPath, newRound);
};

module.exports = {
    loadRounds,
    saveRound,
};
