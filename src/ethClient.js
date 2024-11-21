const { ethers } = require("ethers");
const { isZeroAddress } = require('./utils')

const PROVIDER_URL = process.env.PROVIDER_URL;
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

const erc20ABI = [
    'function balanceOf(address owner) view returns (uint256)',
];

async function getBalance(address, tokenAddress) {
    if (!ethers.isAddress(address)) {
        throw new Error('Invalid address');
    }

    if (isZeroAddress(tokenAddress)) {
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance.toString());
    } else {
        if (!ethers.isAddress(tokenAddress)) {
            throw new Error('Invalid token address');
        }

        const contract = new ethers.Contract(tokenAddress, erc20ABI, provider);
        const balance = await contract.balanceOf(address);
        return ethers.formatUnits(balance, 18); 
    }
}

module.exports = {
    getBalance
}