const { loadRounds, saveRound, updateRound, saveRoundRewardDetails } = require('../db/db');
const { getBalance } = require('../client/ethClient')
const { sendReward } = require('./roundV1Service')
const { getUsersInChannel, getAddressByFids, getAddressesByFidsNeyar, getUsersWithSubscriptionsInChannel } = require('../client/openrankClient')
const log4js = require("log4js");
const logger = log4js.getLogger('scheduler');
const { ethers } = require("ethers");

const INTERVAL_MS = 1000 * 60

const init = () => {
    loop()
}

const defaultDecimals = 18

const loop = async () => {
    logger.info('Distributing reward')
    const rounds = await loadRounds();

    const processRound = async (round) => {
        round.excludedUsersFID = round.excludedUsersFID || []
        const usersLeftToReward = round.topUserCount - round.rewardedUsersCount
        if (usersLeftToReward <= 0) {
            return
        }

        const balanceRaw = await getBalance(round.roundAddress, round.assetAddress)

        const decimals = +round.decimals || defaultDecimals

        const balance = ethers.formatUnits(balanceRaw, decimals);

        const amountPerUser = round.amount / round.topUserCount;

        const fee = (+process.env.FEE_PERCENT || 2) / 100
        const amountNeeded = usersLeftToReward * amountPerUser * fee

        console.log({ round })
        if (balance < amountPerUser) {
            logger.warn(`${round.roundAddress} holds ${balance} of ${round.assetAddress} token. ${amountNeeded} tokens needed to reward ${round.topUserCount} top users in ${round.channelId} channel`)
            // return
        }

        let usersInChannel = []

        if (!round.stpContract) {
            usersInChannel = await getUsersInChannel(
                round.channelId,
                round.topUserCount + round.excludedUsersFID.length,
                round.orderUsersBy
            )
        } else {
            usersInChannel = await getUsersWithSubscriptionsInChannel(
                round.channelId,
                round.topUserCount,
                round.orderUsersBy,
                round.stpContract
            )
        }

        const userFidsToReward = usersInChannel

        logger.info("users in channel", userFidsToReward)
        // const usersData = await getAddressByFids(userFidsToReward.map(e => e.fid))

        if (!round.stpContract) {
            usersData = await getAddressesByFidsNeyar(userFidsToReward.map(e => e.fid))
        } else {
            usersData = usersInChannel
        }

        logger.info("users to reward", usersData)

        return

        const usersDataWithValidAddresses = usersData.filter(a => ethers.isAddress(a.address))

        for (let i = 0; i < usersDataWithValidAddresses.length; i++) {
            const fid = usersDataWithValidAddresses[i].fid
            if (round.excludedUsersFID.includes(fid)) {
                continue
            }

            const recipientAddress = usersDataWithValidAddresses[i].address
            const roundAddress = round.roundAddress
            const assetAddress = round.assetAddress
            const decimals = +round.decimals || defaultDecimals

            // it maybe less users than channel has but portions will be equal
            const amount = amountPerUser.toFixed(defaultDecimals) //(round.amount / usersDataWithValidAddresses.length).toFixed(decimals)
            console.log({ decimals, amountPerUser })
            const normalizedAmount = ethers.parseUnits(amount, decimals) + ''
            logger.info('amount', { amount, normalizedAmount })
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