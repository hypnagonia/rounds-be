const fetchChannelInfo = async (channelId) => {
    const baseUrl = 'https://api.warpcast.com/v1/channel';

    const url = new URL(baseUrl);
    url.searchParams.append('channel_id', channelId);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'accept': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const channel = data.result && data.result.channel && data.result.channel;

    return channel
}

module.exports = {
    fetchChannelInfo
}