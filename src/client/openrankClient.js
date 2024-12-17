const axios = require('axios');
const log4js = require("log4js");
const logger = log4js.getLogger("client");

const OPENRANK_HOST = `https://graph.cast.k3l.io`;
const headers = {
    'API-Key': process.env.GRAPH_NGINX_API_KEY  || '',
    'Content-Type': 'application/json'
}

const getUsersWithSubscriptionsInChannel = async (channelName, limit = 0, orderUsersBy = 'total_points', stpContractAddress) => {
    const getSubcriptionDataToUsers = async (users, STPContractAddress) => {
        let subscriptions = {}
        const addresses = []
        const maxAddressesInQuery = 100
        let fids = []
      
        for (let i = 0; i < users.length; i++) {
          const fid = users[i].fid

          fids.push(fid)
      
          if (fids.length % maxAddressesInQuery === 0) {
            const fidsAndAddresses = await getAddressesByFidsNeyar(fids)
            addresses.push(...fidsAndAddresses)
            const res = await getSubscriptionsNeynar(fidsAndAddresses.map(a => a.address), STPContractAddress)
            fids = []
            subscriptions = { ...subscriptions, ...res }
          }
        }
        
        const fidsAndAddresses = await getAddressesByFidsNeyar(fids)
        addresses.push(...fidsAndAddresses)
        const res = await getSubscriptionsNeynar(fidsAndAddresses.map(a => a.address), STPContractAddress)

        subscriptions = { ...subscriptions, ...res }
      
        return {subscriptions, addresses}
      }

      const addSubcriptionDataToUsers = async (users, STPContractAddress) => {
        if (!STPContractAddress) {
          return users
        }
      
        const {addresses, subscriptions} = await getSubcriptionDataToUsers(users, STPContractAddress)
        const usersWithSubscriptions = addresses
          .map(user => {
            const address = user.address
            if (!address) {
              return undefined
            }
      
            const addressLowercase = address.toLowerCase()
      
            const isSubscribed = subscriptions[addressLowercase] ? subscriptions[addressLowercase].status : false
            return { ...user, isSubscribed }
          })
          .filter(r => !!r)
          .filter(r => r.isSubscribed)
      
        return usersWithSubscriptions
      }


      const users = await getUsersInChannel(channelName, 500, orderUsersBy)
      const usersWithSubscriptions = await addSubcriptionDataToUsers(users, stpContractAddress)
      // todo
      usersWithSubscriptions.length = limit

      return usersWithSubscriptions
}

//https://graph.cast.k3l.io/channels/points/founders2?offset=0&limit=100&lite=true'
const getUsersInChannelByPoints = async (channelName, limit = 0, orderUsersBy) => {
    const limitUrl = limit ? `limit=${limit}` : ''
    const orderBy = `orderby=${orderUsersBy}`
    const url = `${OPENRANK_HOST}/channels/points/${channelName}?rank_timeframe=60d&${orderBy}&${limitUrl}`
    const response = await axios.get(url, {headers});
    const usersInChannel = response.data.result

    return usersInChannel
}

//https://graph.cast.k3l.io/channels/rankings/founders?rank_timeframe=7d&limit=5
const getUsersInChannelByRankings = async (channelName, limit = 0) => {
    const limitUrl = limit ? `limit=${limit}` : ''
    const url = `${OPENRANK_HOST}/channels/followers/${channelName}?rank_timeframe=60d&${limitUrl}`
    const response = await axios.get(url, {headers});
    const usersInChannel = response.data.result

    return usersInChannel
}

//https://graph.cast.k3l.io/channels/rankings/founders?rank_timeframe=7d&limit=5
const getUsersInChannel = async (channelName, limit = 0, orderUsersBy = 'total_points') => {
    let usersInChannel = []
    
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
    if (!fids.length) {
        return []
    }

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


const getSubscriptionsNeynar = async (addresses, STPContractAddress) => {
    if (addresses.length === 0) {
      return {}
    }

    if (!STPContractAddress) {
        return {}
    }
  
    const chainId = 8453
    const url = `https://api.neynar.com/v2/stp/subscription_check?addresses=${addresses.join(',')}&contract_address=${STPContractAddress}&chain_id=${chainId}`;
    const headers = {
      'accept': 'application/json',
      'api_key': process.env.NEYNAR_API_KEY || ''
    };
    // console.log(`Fetching data from: ${url}`);
  
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      if (!response.ok) {
        const errorMessage = await response.text(); // Get the response text for detailed error
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorMessage}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

const getAddressesByFidsNeyar = async (fids) => {
    if (!fids.length) {
        return []
    }

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
    getAddressesByFidsNeyar,
    getSubscriptionsNeynar,
    getUsersWithSubscriptionsInChannel
}