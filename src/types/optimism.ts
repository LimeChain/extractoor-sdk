export interface OutputData {
    l1BlockNumber: string,
    l1OutputOracleAddress: string,
    version: string,
    optimismStateRoot: string,
    withdrawalStorageRoot: string,
    blockHash: string,
    blockNum: string,
    outputIndex: string,
    outputStorageSlot: string,
    outputRoot: string,
    accountProof: string[],
    storageProof: string[],
    outputRootRLPProof: string
}