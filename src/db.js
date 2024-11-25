const fs = require('fs-extra');
const csv = require('csv-parser');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'rounds.csv');

/** 
    roundId - round id
    topUserCount - number of top users get reward
    type - type of round
    amount - amount of token to distribute 
    channel - cura channel string
    createdAt - timestamp
    roundInterval - WIP
    lastUpdated - time of last reward
    rewardedUsersCount - number of users got reward
*/
const CSV_HEADER = 'roundId,topUserCount,type,amount,assetAddress,channelId,roundAddress,createdAt,roundInterval,lastUpdated,rewardedUsersCount\n'

fs.ensureFileSync(dbPath);
if (fs.readFileSync(dbPath, 'utf8').trim() === '') {
    fs.writeFileSync(dbPath, CSV_HEADER);
}

const getRoundRewardName = roundAddress => `rewards-${roundAddress}.csv`

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

const loadRoundReward = async (roundAddress) => {
    const dbPath = path.join(__dirname, '..', 'db', getRoundRewardName(roundAddress));
    
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
    const {
        type,
        amount,
        assetAddress,
        channelId,
        roundInterval,
        topUserCount,
        createdAt,
        rewardedUsersCount = 0,
        roundAddress,
        roundId
    } = round;

    const lastUpdated = 0

    const newRound = `${roundId},${topUserCount},${type},${amount},${assetAddress},${channelId},${roundAddress},${createdAt},${roundInterval},${lastUpdated},${rewardedUsersCount}\n`;
    await fs.appendFile(dbPath, newRound);
};

const saveRoundRewardDetails = async (round, rewardData) => {
    const {
        roundAddress,
    } = round;
    const { fid, recipientAddress, amountSent, txHash } = rewardData

    const dbPath = path.join(__dirname, '..', 'db', getRoundRewardName(roundAddress));

    const CSV_ROUND_REWARD = 'fid,recipientAddress,amountSent,timestamp,txHash\n'
    fs.ensureFileSync(dbPath);
    if (fs.readFileSync(dbPath, 'utf8').trim() === '') {
        fs.writeFileSync(dbPath, CSV_ROUND_REWARD);
    }

    const timestamp = Date.now()

    const newRound = `${fid},${recipientAddress},${amountSent},${timestamp},${txHash}\n`;
    await fs.appendFile(dbPath, newRound);
};

const updateRound = async (roundId, updatedFields) => {
    const rounds = await loadRounds();

    const index = rounds.findIndex((round) => round.roundId === roundId);
    if (index === -1) {
        throw new Error(`Round with roundId ${roundId} not found`);
    }

    const updatedRound = { ...rounds[index], ...updatedFields };
    rounds[index] = updatedRound;
    const csvContent = [
        CSV_HEADER.trim(),
        ...rounds.map((r) =>
            `${r.roundId},${r.topUserCount},${r.type},${r.amount},${r.assetAddress},${r.channelId},${r.roundAddress},${r.createdAt},${r.roundInterval},${r.lastUpdated},${r.rewardedUsersCount}`
        ),
    ].join('\n');

    await fs.writeFile(dbPath, csvContent);
};

module.exports = {
    loadRounds,
    saveRound,
    updateRound,
    saveRoundRewardDetails,
    loadRoundReward
};
