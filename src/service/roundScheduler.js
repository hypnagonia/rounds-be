const { loadRounds, saveRound, updateRound, saveRoundRewardDetails } = require('../db/db');
const { getBalance } = require('../client/ethClient')
const { sendReward } = require('./roundV1Service')
const { getUsersInChannel, getAddressByFids, getAddressesByFidsNeyar } = require('../client/openrankClient')
const log4js = require("log4js");
const logger = log4js.getLogger('scheduler');
const { ethers } = require("ethers");

const INTERVAL_MS = 1000 * 60

const init = () => {
    loop()
}

// todo get rid
const defaultDecimals = 6

const loop = async () => {
    logger.info('Distributing reward')
    const rounds = await loadRounds();

    const processRound = async (round) => {
        const usersLeftToReward = round.topUserCount - round.rewardedUsersCount
        if (usersLeftToReward <= 0) {
            return
        }

        const balanceRaw = await getBalance(round.roundAddress, round.assetAddress)

        const decimals = +round.decimals || defaultDecimals

        const balance = ethers.formatUnits(balanceRaw, decimals);

        const amountPerUser = round.amount / round.topUserCount;
        const amountNeeded = usersLeftToReward * amountPerUser

        if (balance < amountPerUser) {
            logger.warn(`${round.roundAddress} holds ${balance} of ${round.assetAddress} token. ${amountNeeded} tokens needed to reward ${round.topUserCount} top users in ${round.channelId} channel`)
            // return
        }

        const usersInChannel = await getUsersInChannel(round.channelId, round.topUserCount)
        const userFidsToReward = usersInChannel

        logger.info("users in channel", userFidsToReward)
        // const usersData = await getAddressByFids(userFidsToReward.map(e => e.fid))
        const usersData = await getAddressesByFidsNeyar(userFidsToReward.map(e => e.fid))
        logger.info("users to reward", usersData)

        const usersDataWithValidAddresses = usersData.filter(a => ethers.isAddress(a.address))

        for (let i = 0; i < usersDataWithValidAddresses.length; i++) {
            const recipientAddress = usersDataWithValidAddresses[i].address
            const roundAddress = round.roundAddress
            const assetAddress = round.assetAddress

            const decimals = +round.decimals || defaultDecimals

            const amount = (round.amount / usersDataWithValidAddresses.length).toFixed(decimals)
            const fid = usersDataWithValidAddresses[i].fid

            const normalizedAmount = ethers.parseUnits(amount, decimals) + ''
            console.log({ amount, normalizedAmount })
            logger.info('Sending reward', { fid, roundAddress, recipientAddress, assetAddress, normalizedAmount })
            const txHash = await sendReward({ fid, roundAddress, recipientAddress, assetAddress, normalizedAmount })

            await saveRoundRewardDetails(round, { fid, roundAddress, recipientAddress, assetAddress, amountSent: amount, txHash })
        }

        const lastUpdated = Date.now()

        await updateRound(round.roundAddress, { lastUpdated })
        logger.info(`Round ${round.roundId} reward has been sent`)

    }

    for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i]

        // todo remove
        if (!+r.lastUpdated) {
            try {
                await processRound(r)
            } catch (e) {
                logger.error(e)
                setTimeout(loop, INTERVAL_MS)
            }
        }
    }

    setTimeout(loop, INTERVAL_MS)
}

module.exports = {
    init
}