require("dotenv").config();
const { ethers } = require("ethers");

const PROVIDER_URL = process.env.PROVIDER_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ROUND_CONTRACT_ADDRESS = process.env.ROUND_FACTORY_ADDRESS;
console.log({ROUND_CONTRACT_ADDRESS})

const ROUND_ABI = [
  "function setFeeBPS(uint16 newFeeBPS) external"
];

(async () => {
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const roundContract = new ethers.Contract(ROUND_CONTRACT_ADDRESS, ROUND_ABI, wallet);

    const tx = await roundContract.setFeeBPS(200);

    console.log(`Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Transaction confirmed: ${receipt.transactionHash}`);

})();
