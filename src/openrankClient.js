const axios = require('axios');

const OPENRANK_HOST = `https://graph.cast.k3l.io`;

const getUsersInChannel = async (channelName) => {
    const url = `${OPENRANK_HOST}/channels/rankings/${channelName}`
    const response = await axios.get(url);
    const usersInChannel = response.data.result

    return usersInChannel
}

module.exports = {
    getUsersInChannel
}