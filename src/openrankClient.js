const axios = require('axios');
const log4js = require("log4js");
const logger = log4js.getLogger();

const OPENRANK_HOST = `https://graph.cast.k3l.io`;

const getUsersInChannel = async (channelName) => {
    const url = `${OPENRANK_HOST}/channels/rankings/${channelName}`
    const response = await axios.get(url);
    const usersInChannel = response.data.result

    return usersInChannel
}

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

        return addresses
    } catch (error) {
        console.error('Error fetching addresses by FIDs:', error.message);
        throw error;
    }
};

module.exports = {
    getUsersInChannel,
    getAddressByFids
}