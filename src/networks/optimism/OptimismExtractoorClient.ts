import { BN, bufferToHex, bufferToInt, keccak, setLengthLeft, toBuffer } from "ethereumjs-util";
import { MPTProofsEncoder } from "../../encoders/MPTProofsEncoder";
import { OptimismOutputEncoder } from "../../encoders/OptimismOutputEncoder";
import { OutputData } from "../../types/optimism";
import { OutputOracleABICoder } from "../../utils/optimism/OutputOracleABICoder";
import { MPTProofVerifier } from "../../verifier/MPTProofVerifier";
import { EthereumExtractoorClient } from "../ethereum/EthereumExtractoorClient";

export const OPTIMISM_GOERLI_CONFIG: OptimismNetworkConfig = {
    L2WithdrawalContractAddress: "0x4200000000000000000000000000000000000016",
    OutputOracleAddress: "0xE6Dfba0953616Bacab0c9A8ecb3a9BBa77FC15c0",
    OutputOracleL2OutputPosition: 3
}

export const BASE_GOERLI_CONFIG: OptimismNetworkConfig = {
    L2WithdrawalContractAddress: "0x4200000000000000000000000000000000000016",
    OutputOracleAddress: "0xE6Dfba0953616Bacab0c9A8ecb3a9BBa77FC15c0",
    OutputOracleL2OutputPosition: 3
}

export interface OptimismNetworkConfig {
    L2WithdrawalContractAddress: string,
    OutputOracleAddress: string,
    OutputOracleL2OutputPosition: number
}

export class OptimismExtractoorClient {

    optimism: EthereumExtractoorClient
    ethereum: EthereumExtractoorClient
    networkConfig: OptimismNetworkConfig

    constructor(optimismRpcUrl: string, ethereumRpcUrl: string, networkConfig: OptimismNetworkConfig) {
        this.optimism = new EthereumExtractoorClient(optimismRpcUrl);
        this.ethereum = new EthereumExtractoorClient(ethereumRpcUrl)
        this.networkConfig = networkConfig;
    }

    async requestEthereum(method: string, params: any[]): Promise<any> {
        return this.ethereum.request(method, params);
    }

    async requestOptimism(method: string, params: any[]): Promise<any> {
        return this.optimism.request(method, params);
    }

    // See spec: https://github.com/ethereum-optimism/optimism/blob/develop/specs/proposals.md#l2-output-root-proposals-specification
    async generateLatestOutputData(l1BlockNum: string): Promise<OutputData> {

        const L1Block = await this.ethereum.getBlockByNumber(l1BlockNum);

        // STEP 1 Get from the L1 Bedrock OutputOracle latest block number via latestBlockNumber view function - B.
        const latestBlockNumberCalldata = OutputOracleABICoder.latestBlockNumber();
        const BHex = await this.ethereum.ethCall(L1Block.number, this.networkConfig.OutputOracleAddress, latestBlockNumberCalldata)
        const B = bufferToInt(toBuffer(BHex));

        // STEP 2 Get from the L1 Bedrock OutputOracle the L2 Output index for B via getL2OutputIndexAfter - I
        const getL2OutputIndexAfterCalldata = OutputOracleABICoder.getL2OutputIndexAfter(B);
        const IHex = await this.ethereum.ethCall(L1Block.number, this.networkConfig.OutputOracleAddress, getL2OutputIndexAfterCalldata);
        const I = bufferToInt(toBuffer(IHex));

        // STEP 3 Get from the L1 Bedrock OutputOracle the L2 Output for block I
        const getL2OutputCalldata = OutputOracleABICoder.getL2Output(I);
        const l2OutputDataHex = await this.ethereum.ethCall(L1Block.number, this.networkConfig.OutputOracleAddress, getL2OutputCalldata);
        const contractL2OutputData = OutputOracleABICoder.decodeL2Output(l2OutputDataHex);

        if (Number(contractL2OutputData.l2BlockNumber) != B) {
            throw new Error("Invalid L2 block requested!")
        }

        // STEP 4 Get from Optimism the block information for block B.
        const block = await this.optimism.getBlockByNumber(`0x${B.toString(16)}`);

        // STEP 5 Get proof from Optimism Rollup node about the withdrawal contract address
        const withdrawalContractProof = await this.optimism.getProof(this.networkConfig.L2WithdrawalContractAddress, "0x0", `0x${B.toString(16)}`); // Slot does not matter

        // STEP 6 Verify the proof against the state root and get account data. Will need it for the storage proof
        const account = await MPTProofVerifier.verifyAccountProof(block.stateRoot, this.networkConfig.L2WithdrawalContractAddress, withdrawalContractProof.accountProof);

        // STEP 7 Calculate locally output root and verify against the one taken in Step 3
        const versionByte = bufferToHex(setLengthLeft(toBuffer(0), 32));
        const outputRootHex = OptimismOutputEncoder.generateOutputRoot(versionByte, block.stateRoot, bufferToHex(account.stateRoot), block.hash);

        if (outputRootHex != contractL2OutputData.outputRoot) {
            throw new Error("Could not generate correctly locally the output root");
        }

        // STEP 8 Generate the storage slot for the output root contained in the l2Outputs array inside the L1 Bedrock OutputOracle on index I. 
        // Formula is S = ArrayStart+(2*I)
        const AS = keccak(setLengthLeft(toBuffer(this.networkConfig.OutputOracleL2OutputPosition), 32));
        const ASBN = new BN(AS);
        const slotOffset = new BN(2 * I);
        const SBN = ASBN.add(slotOffset);
        const S = `0x${SBN.toString("hex")}`

        // STEP 9 Get Proof for the storage S from Ethereum.
        const optimismOutputRootProof = await this.ethereum.getProof(this.networkConfig.OutputOracleAddress, S, L1Block.number);
        const combinedProof = MPTProofsEncoder.rlpEncodeProofs([optimismOutputRootProof.accountProof, optimismOutputRootProof.storageProof[0].proof]);

        const result: OutputData = {
            l1BlockNumber: L1Block.number,
            l1OutputOracleAddress: this.networkConfig.OutputOracleAddress,
            version: versionByte,
            optimismStateRoot: bufferToHex(block.stateRoot),
            withdrawalStorageRoot: bufferToHex(account.stateRoot),
            blockHash: block.hash,
            blockNum: BHex,
            outputIndex: IHex,
            outputStorageSlot: S,
            outputRoot: outputRootHex,
            accountProof: optimismOutputRootProof.accountProof,
            storageProof: optimismOutputRootProof.storageProof[0].proof,
            outputRootRLPProof: combinedProof
        }

        return result;

    }

}

