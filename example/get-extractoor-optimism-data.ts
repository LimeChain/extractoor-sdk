import { BN, bufferToHex, keccak, setLengthLeft, toBuffer, unpadBuffer } from 'ethereumjs-util'
import { MPTProofsEncoder, OptimismExtractoorClient, OPTIMISM_GOERLI_CONFIG } from './../src'
const dotenv = require('dotenv');
dotenv.config()

async function run() {

    // Inputs
    const targetAccount = "0xcA7B05255F52C700AE25C278DdB03C02459F7AE8"; // The account inside Optimism we are proving for
    const arrayDefinitionPosition = 0; // Definition position of the array inside the solidity contract
    const blockNum = 8529353; // The L1 block number we will be proving contains the Optimism state
    const indexInTheArray = 1; // The index of the element you are looking for

    // Step 1 - Derive the storage slot from the array definition and index of the array
    const arrayDefinitionHash = keccak(setLengthLeft(toBuffer(arrayDefinitionPosition), 32));
    const arrayDefinitionBN = new BN(arrayDefinitionHash);
    const indexBN = new BN(indexInTheArray);
    const slotBN = arrayDefinitionBN.add(indexBN);
    const slot = `0x${slotBN.toString("hex")}`

    const fetcher = new OptimismExtractoorClient(process.env.OPTIMISM_GOERLI_RPC_URL || "", process.env.GOERLI_RPC_URL || "", OPTIMISM_GOERLI_CONFIG);

    // For informational purposes
    const l1Block = await fetcher.ethereum.getBlockByNumber(`0x${blockNum.toString(16)}`);

    // Step 2 - Get all the information needed for the Optimism Output Root inclusion inside L1 proof
    const output = await fetcher.generateLatestOutputData(`0x${blockNum.toString(16)}`);

    // Step 3 - Get all the information needed for the Merkle inclusion proof inside Optimism
    const getProofRes = await fetcher.optimism.getProof(targetAccount, slot, bufferToHex(unpadBuffer(toBuffer(output.blockNum))));

    // Step 4 - RLP encode the Proof from Step 3
    const inclusionProof = MPTProofsEncoder.rlpEncodeProofs([getProofRes.accountProof, getProofRes.storageProof[0].proof]);

    // Use the below as parameters to L2OptimismBedrockStateProver

    console.log("L1 BlockNumber:");
    console.log(blockNum);

    console.log("L1 State Root for this block:");
    console.log(l1Block.stateRoot);

    console.log("Output index:");
    console.log(output.outputIndex);

    console.log("Optimism State Root:");
    console.log(output.optimismStateRoot);

    console.log("Optimism Withdrawal Storage Root:");
    console.log(output.withdrawalStorageRoot);

    console.log("Optimism Latest Block Hash:");
    console.log(output.blockHash);

    console.log("Combined Optimism Output Root Proof RLP:");
    console.log(output.outputRootRLPProof);

    console.log("Targeted Storage Slot:");
    console.log(slot);

    console.log("Combined Inclusion Proof RLP:");
    console.log(inclusionProof);
}

run()