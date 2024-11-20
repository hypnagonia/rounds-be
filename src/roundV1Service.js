const { ethers } = require("ethers");
const log4js = require("log4js");
const logger = log4js.getLogger();

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

const ROUND_FACTORY_ABI = [
    "function deploySingleRoundV1(tuple(uint40 roundId, address initialAdmin, bool isFeeEnabled, bool isLeafVerificationEnabled, uint256 awardAmount, tuple(uint8 assetType, address token, uint256 identifier) award)) external returns (address)"
];

const createRound = async () => {
    try {
        const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
        logger.info("Initialized JSON RPC Provider.");

        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        logger.info("Wallet loaded successfully.");

        const roundFactory = new ethers.Contract(ROUND_FACTORY_ADDRESS, ROUND_FACTORY_ABI, wallet);
        logger.info(`Contract loaded at address: ${ROUND_FACTORY_ADDRESS}`);

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

        logger.info("Starting deployment of Single Round V1 with configuration:", ROUND_CONFIG);

        const tx = await roundFactory.deploySingleRoundV1(ROUND_CONFIG);
        logger.info("Transaction sent:", { hash: tx.hash });

        const receipt = await tx.wait();
        logger.info("Transaction confirmed:", { receipt });

        const newRoundAddress = receipt.logs[0].address;
        logger.info("New Single Round V1 deployed at address:", newRoundAddress);

        return newRoundAddress
    } catch (error) {
        logger.error("Error deploying Single Round V1:", error);
    }
}


module.exports = {
    createRound
}