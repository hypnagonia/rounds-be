const { ethers } = require("ethers");
const log4js = require("log4js");
const logger = log4js.getLogger();

const PROVIDER_URL = process.env.PROVIDER_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ROUND_FACTORY_ADDRESS = process.env.ROUND_FACTORY_ADDRESS;
const INITIAL_ADMIN = process.env.INITIAL_ADMIN;
const IS_FEE_ENABLED = process.env.IS_FEE_ENABLED === "true";
const IS_LEAF_VERIFICATION_ENABLED = process.env.IS_LEAF_VERIFICATION_ENABLED === "true";
const ASSET_IDENTIFIER = 0

const CLAIM_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes("Claim(uint256 fid,address to,uint256 amount)")
);

const ROUND_FACTORY_ABI = [
    "function deploySingleRoundV1(tuple(uint40 roundId, address initialAdmin, bool isFeeEnabled, bool isLeafVerificationEnabled, uint256 awardAmount, tuple(uint8 assetType, address token, uint256 identifier) award)) external returns (address)"
];

const ROUND_ABI = [
    "function claim(uint256 fid, address to, uint256 amount, bytes32[] calldata proof, bytes calldata sig) external",
    "function factory() external view returns (address)",
    "function admin() external view returns (address)",
    "function nonce() external view returns (uint40)",
    "function isLeafVerificationEnabled() external view returns (bool)",
    "function isFeeEnabled() external view returns (bool)",
    "function isFeeClaimed() external view returns (bool)",
    "function fee() external view returns (uint256)",
    "function award() external view returns (tuple(uint8 assetType, address token, uint256 identifier))",
    "function claimMerkleRoot() external view returns (bytes32)",
    "function hasFIDClaimed(uint256 fid) public view returns (bool)",
    "function setAdmin(address newAdmin) external",
    "event AdminSet(address newAdmin)"
];

// EIP-712 Domain and Claim Type Definition
const DOMAIN_NAME = "Rounds";
const DOMAIN_VERSION = "1";

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

const createRoundV1 = async ({ assetType, assetAddress, roundId, amount }) => {
    try {
        const ASSET_TYPE = assetType;
        const ASSET_ADDRESS = assetAddress
        const AWARD_AMOUNT = ethers.parseEther(amount)

        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        logger.info("Wallet loaded successfully.");

        const roundFactory = new ethers.Contract(ROUND_FACTORY_ADDRESS, ROUND_FACTORY_ABI, wallet);
        logger.info(`Contract loaded at address: ${ROUND_FACTORY_ADDRESS}`);

        const ROUND_CONFIG = [
            +roundId, // uint40 roundId
            INITIAL_ADMIN, // address initialAdmin
            IS_FEE_ENABLED, // bool isFeeEnabled
            IS_LEAF_VERIFICATION_ENABLED, // bool isLeafVerificationEnabled
            AWARD_AMOUNT, // uint256 awardAmount
            [
                +ASSET_TYPE, // uint8 assetType: 1 (ETH), 2 (ERC20), 3 (ERC721), etc.
                ASSET_ADDRESS, // address token: Token address (zero for ETH)
                +ASSET_IDENTIFIER, // uint256 identifier: Token ID (0 for ERC20/ETH)
            ],
        ];

        logger.info("Starting deployment of Single Round V1 with configuration:", ROUND_CONFIG);

        const tx = await roundFactory.deploySingleRoundV1(ROUND_CONFIG);
        logger.info("Transaction sent:", { hash: tx.hash });

        const receipt = await tx.wait();
        logger.info("Transaction confirmed:", { receipt });

        const newRoundAddress = receipt.logs[0].address;
        logger.info("New Round V1 deployed at address:", newRoundAddress);

        return newRoundAddress
    } catch (error) {
        logger.error("Error deploying Single Round V1:", error);

        throw error
    }
}

// todo for erc20
const sendReward = async ({ fid, roundAddress, recipientAddress, assetAddress, amount }) => {
    try {
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const roundContract = new ethers.Contract(roundAddress, ROUND_ABI, wallet);
        const chainId = await provider.getNetwork().then((network) => network.chainId)

        // EIP-712 Domain Separator
        const domain = {
            name: DOMAIN_NAME,
            version: DOMAIN_VERSION,
            chainId,
            verifyingContract: roundAddress,
        };

        amountNormalized = ethers.parseEther(amount);
        
        // todo proof?
        const proof = [] // ["0x0000000000000000000000000000000000000000000000000000000000000000"];

        // todo sig?
        // Generate the digest for EIP-712 signing
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();

        const structHash = ethers.keccak256(
            abiCoder.encode(
                ["bytes32", "uint256", "address", "uint256"],
                [CLAIM_TYPEHASH, fid, recipientAddress, amountNormalized]
            )
        );

        const digest = ethers.keccak256(
            ethers.solidityPacked(
                ["bytes1", "bytes1", "bytes32", "bytes32"],
                ["0x19", "0x01", ethers.TypedDataEncoder.hashDomain(domain), structHash]
            )
        );

        const sig = await wallet.signMessage(ethers.getBytes(digest));
        logger.debug("Generated Signature:", sig);

        const hasClaimed = await roundContract.hasFIDClaimed(fid);
        
        if (hasClaimed) {
            return
        }

        // Call the claim function with the generated signature
        logger.info(`Claiming for FID: ${fid}, Recipient: ${recipientAddress}, Amount: ${amount} ETH`);
        const tx = await roundContract.claim(fid, recipientAddress, amountNormalized, proof, sig);

        logger.info(`Transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        logger.info(`Reward sent to ${recipientAddress} ${amount}`);

        return tx.hash
    } catch (error) {
        logger.error("Error in claim process:", error);
    }
}

module.exports = {
    createRoundV1,
    sendReward
}