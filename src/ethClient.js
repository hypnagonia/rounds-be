const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

const erc20ABI = [
    'function balanceOf(address owner) view returns (uint256)',
];

async function getBalance(address, tokenAddress) {
    if (!ethers.utils.isAddress(address)) {
        throw new Error('Invalid address');
    }

    if (tokenAddress === ethers.constants.AddressZero) {
        const balance = await provider.getBalance(address);
        return balance // ethers.formatEther(balance);
    } else {
        if (!ethers.utils.isAddress(tokenAddress)) {
            throw new Error('Invalid token address');
        }

        const contract = new ethers.Contract(tokenAddress, erc20ABI, provider);
        const balance = await contract.balanceOf(address);
        return balance // ethers.utils.formatUnits(balance, 18); 
    }
}

module.exports = {
    getBalance
}