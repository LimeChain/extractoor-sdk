export interface StorageProof {
    key: string,
    proof: string[],
    value: string
}

export interface EthereumProof {
    accountProof: string[],
    address: string,
    balance: string,
    codeHash: string,
    nonce: string,
    storageHash: string,
    storageProof: Array<StorageProof>
}