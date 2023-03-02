import { EthereumProof } from "../../types/ethereum";
import { paramsToRequest } from "../../utils/JSONRPCUtils";

export class EthereumExtractoorClient {

    rpcUrl: string

    constructor(rpcUrl: string) {
        this.rpcUrl = rpcUrl;
    }

    async request(method: string, params: any[]): Promise<any> {
        const response = await fetch(this.rpcUrl, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            body: JSON.stringify(paramsToRequest(method, params)) // body data type must match "Content-Type" header
        });
        const r = await response.json();
        if (r.error) {
            throw new Error(r.error.message);
        }
        return r.result;
    }

    async getProof(targetAccount: string, targetSlot: string, block: string): Promise<EthereumProof> {
        return this.request("eth_getProof", [targetAccount, [targetSlot], block]);
    }

    async getBlockByNumber(block: string, hyderated: boolean = false): Promise<any> {
        return this.request("eth_getBlockByNumber", [block, hyderated]);
    }

    async ethCall(to: string, input: any, block: number | string): Promise<any> {
        return this.request("eth_call", [{
            to: to,
            data: input
        }, block])
    }

}