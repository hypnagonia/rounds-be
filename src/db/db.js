const {Level} = require('level');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'db');
const roundsDb = new Level(path.join(dbPath, 'rounds'), { valueEncoding: 'json' });
const rewardsDb = new Level(path.join(dbPath, 'rewards'), { valueEncoding: 'json' });

const loadRounds = async () => {
    const rounds = [];
    for await (const [key, value] of roundsDb.iterator()) {
        rounds.push(value);
    }
    return rounds;
};

const saveRound = async (round) => {
    await roundsDb.put(round.roundAddress, {...round, lastUpdated: 0});
};

const updateRound = async (roundAddress, updatedFields) => {
    try {
        const round = await roundsDb.get(roundAddress);
        const updatedRound = { ...round, ...updatedFields };
        await roundsDb.put(roundAddress, updatedRound);
    } catch (error) {
        if (error.notFound) {
            throw new Error(`Round with roundId ${roundId} not found`);
        }
        throw error;
    }
};

const loadRoundReward = async (roundAddress) => {
    try {
        const rewards = await rewardsDb.get(roundAddress);
        return rewards;
    } catch (error) {
        if (error.notFound) {
            return [];
        }
        throw error;
    }
};

const saveRoundRewardDetails = async (round, rewardData) => {
    const { roundAddress } = round;
    const { fid, recipientAddress, amountSent, txHash } = rewardData;

    const timestamp = Date.now();
    const rewardDetails = {
        fid,
        recipientAddress,
        amountSent,
        timestamp,
        txHash,
    };

    try {
        const rewards = await loadRoundReward(roundAddress);
        rewards.push(rewardDetails);
        await rewardsDb.put(roundAddress, rewards);
    } catch (error) {
        throw new Error(`Failed to save reward details for roundAddress ${roundAddress}: ${error.message}`);
    }
};

module.exports = {
    loadRounds,
    saveRound,
    updateRound,
    saveRoundRewardDetails,
    loadRoundReward,
};
