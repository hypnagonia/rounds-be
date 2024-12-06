const axios = require('axios');
const log4js = require("log4js");
const logger = log4js.getLogger("client");

const OPENRANK_HOST = `https://graph.cast.k3l.io`;


//https://graph.cast.k3l.io/channels/points/founders2?offset=0&limit=100&lite=true'
const getUsersInChannelByPoints = async (channelName, limit = 0, orderUsersBy) => {
    const limitUrl = limit ? `limit=${limit}` : ''
    const orderBy = `orderby=${orderUsersBy}`
    const url = `${OPENRANK_HOST}/channels/points/${channelName}?rank_timeframe=60d&${orderBy}&${limitUrl}`
    const response = await axios.get(url);
    const usersInChannel = response.data.result

    return usersInChannel
}

//https://graph.cast.k3l.io/channels/rankings/founders?rank_timeframe=7d&limit=5
const getUsersInChannelByRankings = async (channelName, limit = 0) => {
    const limitUrl = limit ? `limit=${limit}` : ''
    const url = `${OPENRANK_HOST}/channels/rankings/${channelName}?rank_timeframe=60d&${limitUrl}`
    const response = await axios.get(url);
    const usersInChannel = response.data.result

    return usersInChannel
}

//https://graph.cast.k3l.io/channels/rankings/founders?rank_timeframe=7d&limit=5
const getUsersInChannel = async (channelName, limit = 0, orderUsersBy = 'total_points') => {
    let usersInChannel
    if (orderUsersBy === 'total_points' || orderUsersBy === 'daily_points') {
        usersInChannel = await getUsersInChannelByPoints(channelName, limit, orderUsersBy)
    }
    if (usersInChannel.length === 0) {
        usersInChannel = await getUsersInChannelByRankings(channelName, limit)
    }

    return usersInChannel
}

// move to neynar api fetch user info by fids
const getAddressByFids = async (fids = []) => {
    const url = `${OPENRANK_HOST}/metadata/addresses/fids?verified_only=true`;
    try {
        const response = await axios.post(url, fids, {
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        const result = response.data.result;
        const addresses = fids.map(fid => {
            const item = result.find(entry => entry.fid === fid);
            if (!item) {
                logger.error(`
                    address for ${fid} not found in 
                    ${OPENRANK_HOST}/metadata/addresses/fids?verified_only=true  
                    [${fids.join(',')}]`
                )
            }
            return item ? item.address : null;
        });

        return addresses.map((a, i) => ({ address: addresses[i], fid: fids[i] }))
    } catch (error) {
        console.error('Error fetching addresses by FIDs:', error.message);
        throw error;
    }
};

const getAddressesByFidsNeyar = async (fids) => {
    const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${encodeURIComponent(fids.join(','))}`;
    const headers = {
        'accept': 'application/json',
        'x-api-key': process.env.NEYNAR_API_KEY,
        'x-neynar-experimental': 'false',
    };

    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data.users.map(user => {
            const address = user.verified_addresses.eth_addresses[0] || user.custody_address
            const fid = user.fid
            return { address, fid }
        }).filter(r => r.address)
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

module.exports = {
    getUsersInChannel,
    getAddressByFids,
    getAddressesByFidsNeyar
}