const { ethers } = require("ethers");
const { isZeroAddress } = require('../utils')

const PROVIDER_URL = process.env.PROVIDER_URL;
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

const erc20ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function name() view returns (string)'
];

async function getBalance(address, assetAddress) {
    if (!ethers.isAddress(address)) {
        throw new Error('Invalid address');
    }

    if (isZeroAddress(assetAddress)) {
        const balance = await provider.getBalance(address);
        return balance //ethers.formatEther(balance.toString());
    } else {
        if (!ethers.isAddress(assetAddress)) {
            throw new Error('Invalid token address');
        }

        const contract = new ethers.Contract(assetAddress, erc20ABI, provider);
        const balance = await contract.balanceOf(address);

        return balance // ethers.formatUnits(balance, decimals);
    }
}

async function getERC20Decimals(assetAddress) {
    if (!ethers.isAddress(assetAddress)) {
        throw new Error('Invalid token address');
    }

    const contract = new ethers.Contract(assetAddress, erc20ABI, provider);
    return (await Number(contract.decimals()))
}

async function getERC20Name(assetAddress) {
    if (!ethers.isAddress(assetAddress)) {
        throw new Error('Invalid token address');
    }

    const contract = new ethers.Contract(assetAddress, erc20ABI, provider);
    return await contract.name();
}

module.exports = {
    getBalance,
    getERC20Decimals,
    getERC20Name
}