require("dotenv").config();
const { ethers } = require("ethers");

const PROVIDER_URL = process.env.PROVIDER_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ROUND_CONTRACT_ADDRESS = '0xb882FCedc1B1dd7261A732261faF627880528C63';

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

const CLAIM_TYPEHASH = ethers.keccak256(
  ethers.toUtf8Bytes("Claim(uint256 fid,address to,uint256 amount)")
);

(async () => {
  try {
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const roundContract = new ethers.Contract(ROUND_CONTRACT_ADDRESS, ROUND_ABI, wallet);
    const chainId = await provider.getNetwork().then((network) => network.chainId)
    
    // EIP-712 Domain Separator
    const domain = {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      chainId,
      verifyingContract: ROUND_CONTRACT_ADDRESS,
    };

    const fid = 2;
    const recipient = "0x41c7104Ca78815A0c2Be11BdE14a964547E3ce2b";
    const amount = ethers.parseEther("0.010");
    const proof = [] // ["0x0000000000000000000000000000000000000000000000000000000000000000"];

    // Generate the digest for EIP-712 signing
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    const structHash = ethers.keccak256(
      abiCoder.encode(
        ["bytes32", "uint256", "address", "uint256"],
        [CLAIM_TYPEHASH, fid, recipient, amount]
      )
    );

    const digest = ethers.keccak256(
      ethers.solidityPacked(
        ["bytes1", "bytes1", "bytes32", "bytes32"],
        ["0x19", "0x01", ethers.TypedDataEncoder.hashDomain(domain), structHash]
      )
    );

    // todo probably broken, currently disabled signature verification
    const sig = await wallet.signMessage(ethers.getBytes(digest));

    console.log("Generated Signature:", sig);

    const admin = await roundContract.admin();
    console.log("Admin Address:", admin);

    const hasClaimed = await roundContract.hasFIDClaimed(fid);
    console.log(`FID ${fid} has claimed:`, hasClaimed);

    // Call the claim function with the generated signature
    console.log(`Claiming for FID: ${fid}, Recipient: ${recipient}, Amount: ${ethers.formatEther(amount)} ETH`);
    const tx = await roundContract.claim(fid, recipient, amount, proof, sig);

    console.log(`Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Transaction confirmed: ${receipt.transactionHash}`);
  } catch (error) {
    console.error("Error in claim process:", error);
  }
})();
