const { loadRounds, saveRound, updateRound } = require('./db');
const { getBalance } = require('./ethClient')
const { sendReward } = require('./roundV1Service')
const { getUsersInChannel, getAddressByFids } = require('./openrankClient')
const log4js = require("log4js");
const logger = log4js.getLogger('scheduler');
const { ethers } = require("ethers");

const INTERVAL_MS = 1000 * 60

const init = () => {
    loop()
}

const loop = async () => {
    logger.info('Check rounds')
    const rounds = await loadRounds();

    /**
        distrubition is not atomic, so during sending the tokens number of people in the channel may change
        userReward is always calculated according config params amount / number of top users
     */
    const processRound = async (round) => {
        const usersLeftToReward = round.topUserCount - round.rewardedUsersCount
        if (usersLeftToReward <= 0) {
            return
        }

        const balance = await getBalance(round.roundAddress, round.assetAddress)
        const amountPerUser = round.amount / round.topUserCount;
        const amountNeeded = usersLeftToReward * amountPerUser

        if (balance < amountPerUser) {
            logger.warn(`${round.roundAddress} holds ${balance} of ${round.assetAddress} token. ${amountNeeded} tokens needed to reward ${round.topUserCount} top users in ${round.channel} channel`)
            return
        }

        const usersInChannel = await getUsersInChannel(round.channel, round.topUserCount)
        const userFidsToReward = usersInChannel.slice(round.rewardedUsersCount)

        const usersData = await getAddressByFids(userFidsToReward.map(e => e.fid))

        const usersDataWithValidAddresses = usersData.filter(a => ethers.isAddress(a.address))

        for (let i = 0; i < usersDataWithValidAddresses.length; i++) {
            const recipientAddress = usersDataWithValidAddresses[i].address
            const roundAddress = round.roundAddress
            const assetAddress = round.assetAddress
            
            // todo decimals
            const amount = (round.amount / usersDataWithValidAddresses.length).toFixed(18)
            const fid = usersDataWithValidAddresses[i].fid
            logger.info('Sending reward', { fid, roundAddress, recipientAddress, assetAddress, amount })
            await sendReward({ fid, roundAddress, recipientAddress, assetAddress, amount })
        }

        const lastUpdated = Date.now()

        await updateRound(round.roundId, { lastUpdated })
        logger.info(`Round ${round.roundId} reward has been sent`)

    }

    for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i]

        if (!+r.lastUpdated && r.roundInterval === '10m') {
            await processRound(r)
        }
    }

    setTimeout(loop, INTERVAL_MS)
}

module.exports = {
    init
}