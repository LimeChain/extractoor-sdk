import { bufferToHex } from 'ethereumjs-util'
import { MPTProofVerifier, OptimismExtractoorClient, OPTIMISM_GOERLI_CONFIG } from './../src'
const dotenv = require('dotenv');
dotenv.config()

async function run() {
    const blockNum = 8525295;
    const fetcher = new OptimismExtractoorClient(process.env.OPTIMISM_GOERLI_RPC_URL || "", process.env.GOERLI_RPC_URL || "", OPTIMISM_GOERLI_CONFIG);

    const output = await fetcher.generateLatestOutputData(`0x${blockNum.toString(16)}`);

    const l1Block = await fetcher.ethereum.getBlockByNumber(output.l1BlockNumber);

    const account = await MPTProofVerifier.verifyAccountProof(l1Block.stateRoot, output.l1OutputOracleAddress, output.accountProof);
    console.log("Account", bufferToHex(account.nonce), bufferToHex(account.balance), bufferToHex(account.stateRoot), bufferToHex(account.codeHash));

    const storageValue = await MPTProofVerifier.verifyStorageProof(bufferToHex(account.stateRoot), output.outputStorageSlot, output.storageProof);
    console.log("Storage Value", bufferToHex(Buffer.from(storageValue)))
}

run()