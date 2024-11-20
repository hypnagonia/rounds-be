const fs = require('fs-extra');
const csv = require('csv-parser');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'rounds.csv');
const CSV_HEADER = 'type,amount,address,channel,createdAt,roundInterval,lastUpdated\n'

fs.ensureFileSync(dbPath);
if (fs.readFileSync(dbPath, 'utf8').trim() === '') {
    fs.writeFileSync(dbPath, CSV_HEADER);
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
    const { type, amount, address, channel, roundInterval, createdAt } = round;
    const lastUpdated = 0

    const newRound = `${type},${amount},${address},${channel},${createdAt},${roundInterval},${lastUpdated}\n`;
    await fs.appendFile(dbPath, newRound);
};

module.exports = {
    loadRounds,
    saveRound,
};
