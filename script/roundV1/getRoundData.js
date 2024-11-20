require("dotenv").config();
const { ethers } = require("ethers");

// Environment variables
const PROVIDER_URL = process.env.PROVIDER_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract address
const CONTRACT_ADDRESS = "0xc0f9929de2823600EDa407d99bA3f0966bdc70D4";

// Contract ABI
const CONTRACT_ABI = [
  "function factory() external view returns (address)",
  "function admin() external view returns (address)",
  "function nonce() external view returns (uint40)",
  "function isLeafVerificationEnabled() external view returns (bool)",
  "function isFeeEnabled() external view returns (bool)",
  "function isFeeClaimed() external view returns (bool)",
  "function fee() external view returns (uint256)",
  "function award() external view returns (tuple(uint8 assetType, address token, uint256 identifier))",
  "function claimMerkleRoot() external view returns (bytes32)",
];

// Main function to fetch data
(async () => {
  try {
    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Connect to the contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    // Fetch data from contract getters
    const factory = await contract.factory();
    const admin = await contract.admin();
    const nonce = await contract.nonce();
    const isLeafVerificationEnabled = await contract.isLeafVerificationEnabled();
    const isFeeEnabled = await contract.isFeeEnabled();
    const isFeeClaimed = await contract.isFeeClaimed();
    const fee = ethers.formatEther(await contract.fee());
    const award = await contract.award();
    const claimMerkleRoot = await contract.claimMerkleRoot();

    // Format the award structure
    const awardDetails = {
      assetType: award.assetType,
      token: award.token,
      identifier: award.identifier.toString(),
    };

    // Display the retrieved data
    console.log("Factory Address:", factory);
    console.log("Admin Address:", admin);
    console.log("Nonce:", nonce.toString());
    console.log("Leaf Verification Enabled:", isLeafVerificationEnabled);
    console.log("Fee Enabled:", isFeeEnabled);
    console.log("Fee Claimed:", isFeeClaimed);
    console.log("Fee (in ETH):", fee);
    console.log("Award Details:", awardDetails);
    console.log("Claim Merkle Root:", claimMerkleRoot);
  } catch (error) {
    console.error("Error fetching data from contract:", error);
  }
})();
