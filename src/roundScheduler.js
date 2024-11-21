const { loadRounds, saveRound } = require('./db');
const { getBalance } = require('./ethClient')
const { getUsersInChannel, getAddressByFids } = require('./openrankClient')
const log4js = require("log4js");
const logger = log4js.getLogger('scheduler');
const { ethers, BigNumber } = require("ethers");

const INTERVAL_MS = 1000 * 60

const init = () => {
    loop()
}

const loop = async () => {
    logger.info('Check rounds')

    const rounds = await loadRounds();

    // get all rounds +
    // find rounds to reward 
    // check balance and users left
    // get users addresses and find top ones
    // transfer reward one by one and save progress
    // update lastUpdated

    /**
        distrubition is not atomic, so during sending the tokens number of people in the channel may change
        userReward is always calculated according config params amount / number of top users
     */
    const sendReward = async (round) => {
        const usersLeftToReward = round.topUserCount - round.rewardedUsersCount
        if (usersLeftToReward <= 0) {
            return
        }

        const balance = await getBalance(round.roundAddress, round.assetAddress)
        const amountPerUser = round.amount / round.topUserCount;
        const amountNeeded = usersLeftToReward * amountPerUser
        
        console.log({ balance, amountNeeded, amountPerUser })
        if (balance < amountPerUser) {
            logger.warn(`${round.roundAddress} holds ${balance} of ${round.assetAddress} token. ${amountNeeded} tokens needed to reward ${round.topUserCount} top users in ${round.channel}`)
            // todo
            // return
        }

        const usersInChannel = await getUsersInChannel(round.channel, round.topUserCount)
        const userFidsToReward = usersInChannel.slice(round.rewardedUsersCount) // skip already rewarded users

        console.log({ userFidsToReward })
        const usersAddresses = await getAddressByFids(userFidsToReward.map(e => e.fid))
        console.log({ usersAddresses })
    }

    for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i]

        // todo change roundInterval
        if (!+r.lastUpdated && r.roundInterval === '10m') {
            sendReward(r)
        }
    }

    setTimeout(loop, INTERVAL_MS)
}

module.exports = {
    init
}