# extractoor
The `extractoor` package is designed to help the interaction with the [Extractoor smart contracts library](https://github.com/LimeChain/extractoor-contracts) in order to verify information about the state of certain rollup inside its anchored L1.
It is part of the ongoing effort of [LimeLabs](https://limelabs.tech) and [LimeChain](https://limechain.tech) to give back and contribute to the blockchain community in the form of open source tooling and public goods infrastructure.
# Instalation
```
npm install extractoor
```
# Using the SDK
See the `example` directory for examples of various use cases.
## EthereumExtractoorClient
Extractor Client for ethereum. Uses the fetch API in order to trigger RPC requests for Ethereum networks. Mainly used for getting blocks by number and getting proofs for given storage slot.

## OptimismExtractoorClient
Extractoor Client for Optimism Bedrock. Exposes method for generating the output root data for a given L1 block by number - `generateLatestOutputData`. 
**IMPORTANT: Optimism Bedrock is still only on goerli and the `OptimismExtractoorClient` uses the currently available addresses based on goerli. When Bedrock goes mainnet these will be changed and moved into config.**

# Contributing
Pull requests welcome. The project is built via `tsdx`. In order to run the compilation in watch mode use 
```
yarn start
```

To build a distribution version use
```
yarn build
```

The tests can be run via
```
yarn test
```
# Examples
Various runnable examples can be found in the `example` directory. Refer to its README for their usage and how to run them.

## Getting the necessary data for OptimismInbox message receive
```
import { BN, bufferToHex, keccak, setLengthLeft, toBuffer, unpadBuffer } from 'ethereumjs-util'
import { MPTProofsEncoder, OptimismExtractoorClient } from 'extractoor'
const dotenv = require('dotenv');
dotenv.config()

// Inputs
const blockNum = 8529353; // The L1 block number we will be proving contains the Optimism state
const targetAccount = "0xcA7B05255F52C700AE25C278DdB03C02459F7AE8"; // The account inside Optimism we are proving for
const arrayDefinitionPosition = 0; // Definition position of the array inside the solidity contract
const indexInTheArray = 1; // The index of the element you are looking for

// Step 1 - Derive the storage slot from the array definition and index of the array
const arrayDefinitionHash = keccak(setLengthLeft(toBuffer(arrayDefinitionPosition), 32));
const arrayDefinitionBN = new BN(arrayDefinitionHash);
const indexBN = new BN(indexInTheArray);
const slotBN = arrayDefinitionBN.add(indexBN);
const slot = `0x${slotBN.toString("hex")}`

const fetcher = new OptimismExtractoorClient(process.env.OPTIMISM_GOERLI_RPC_URL || "", process.env.GOERLI_RPC_URL || "");

// Step 2 - Get all the information needed for the Optimism Output Root inclusion inside L1 proof
const output = await fetcher.generateLatestOutputData(`0x${blockNum.toString(16)}`);

// Step 3 - Get all the information needed for the Merkle inclusion proof inside Optimism
const getProofRes = await fetcher.optimism.getProof(targetAccount, slot, bufferToHex(unpadBuffer(toBuffer(output.blockNum))));

// Step 4 - RLP encode the Proof from Step 3
const inclusionProof = MPTProofsEncoder.rlpEncodeProofs([getProofRes.accountProof, getProofRes.storageProof[0].proof]);

// Use the below as parameters to L2OptimismBedrockStateProver
console.log(blockNum, output.outputIndex, output.optimismStateRoot, output.optimismStateRoot, output.withdrawalStorageRoot, output.blockHash, output.outputRootRLPProof, slot, inclusionProof);
```

## Local verification of eth_getProof return data
```
import { bufferToHex } from 'ethereumjs-util'
import { MPTProofVerifier } from 'extractoor'


async function run() {
    const stateRoot = '0xf70f7bf933416dd187fc95de784e4535fa5547db1b0b9446191945bfc457bca7';
    const target = '0x058A39bEFBBA6a41e1CcBE97C3457dcc894B0fF2';
    const accountProof = [...];
    const storageSlot = '0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563';
    const storageProof = [...];

    const account = await MPTProofVerifier.verifyAccountProof(stateRoot, target, accountProof);
    console.log("Account:\n", bufferToHex(account.nonce), bufferToHex(account.balance), bufferToHex(account.stateRoot), bufferToHex(account.codeHash));

    const storageValue = await MPTProofVerifier.verifyStorageProof(bufferToHex(account.stateRoot), storageSlot, storageProof);
    console.log("Storage Value:\n", bufferToHex(Buffer.from(storageValue)))
}

run()
```