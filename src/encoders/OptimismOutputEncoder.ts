import { bufferToHex, keccak, toBuffer } from "ethereumjs-util";

export class OptimismOutputEncoder {
    static generateOutputRoot(versionByte: string, stateRoot: string, withdarwalStorageRoot: string, latestBlockHash: string): string {
        const payload = Buffer.concat([toBuffer(stateRoot), toBuffer(withdarwalStorageRoot), toBuffer(latestBlockHash)])
        const outputRoot = keccak(Buffer.concat([toBuffer(versionByte), payload]));
        const outputRootHex = bufferToHex(outputRoot);
        return outputRootHex
    }
}