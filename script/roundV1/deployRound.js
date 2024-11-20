require("dotenv").config();
const { ethers } = require("ethers");

const PROVIDER_URL = process.env.PROVIDER_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ROUND_FACTORY_ADDRESS = process.env.ROUND_FACTORY_ADDRESS;
const ROUND_ID = parseInt(process.env.ROUND_ID);
const INITIAL_ADMIN = process.env.INITIAL_ADMIN;
const IS_FEE_ENABLED = process.env.IS_FEE_ENABLED === "true";
const IS_LEAF_VERIFICATION_ENABLED = process.env.IS_LEAF_VERIFICATION_ENABLED === "true";
const AWARD_AMOUNT = ethers.parseEther(process.env.AWARD_AMOUNT);
const ASSET_TYPE = parseInt(process.env.ASSET_TYPE);
const ASSET_ADDRESS = process.env.ASSET_ADDRESS;
const ASSET_IDENTIFIER = parseInt(process.env.ASSET_IDENTIFIER);

// ABI for the RoundFactory contract
const ROUND_FACTORY_ABI = [
    "function deploySingleRoundV1(tuple(uint40 roundId, address initialAdmin, bool isFeeEnabled, bool isLeafVerificationEnabled, uint256 awardAmount, tuple(uint8 assetType, address token, uint256 identifier) award)) external returns (address)"
];

(async () => {
    try {
        // Set up the provider and wallet
        const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        const roundFactory = new ethers.Contract(ROUND_FACTORY_ADDRESS, ROUND_FACTORY_ABI, wallet);

        const ROUND_CONFIG = [
            ROUND_ID, // uint40 roundId
            INITIAL_ADMIN, // address initialAdmin
            IS_FEE_ENABLED, // bool isFeeEnabled
            IS_LEAF_VERIFICATION_ENABLED, // bool isLeafVerificationEnabled
            AWARD_AMOUNT, // uint256 awardAmount
            [
                ASSET_TYPE, // uint8 assetType: 1 (ETH), 2 (ERC20), 3 (ERC721), etc.
                ASSET_ADDRESS, // address token: Token address (zero for ETH)
                ASSET_IDENTIFIER, // uint256 identifier: Token ID (0 for ERC20/ETH)
            ],
        ];

        // const owner = await roundFactory.owner();
        // console.log("Contract owner:", owner);

        // console.log("Estimating gas...");
        console.log({a: roundFactory.functions})
        // const estimatedGas = await roundFactory.estimateGas.deploySingleRoundV1(ROUND_CONFIG);
        // console.log("Estimated Gas:", estimatedGas.toString());

        console.log("Deploying Single Round V1...");
        const tx = await roundFactory.deploySingleRoundV1(ROUND_CONFIG, {
            // gasLimit: estimatedGas.mul(2), // Double the estimated gas for safety
        });

        console.log("Transaction sent:", tx.hash);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt.transactionHash);

        // Extract the new round address from logs (if emitted)
        const newRoundAddress = receipt.logs[0].address;
        console.log("New Single Round V1 deployed at address:", newRoundAddress);
    } catch (error) {
        console.error("Error deploying Single Round V1:", error);
    }
})();
