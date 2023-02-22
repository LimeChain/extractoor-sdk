import { intToHex } from 'ethereumjs-util';
import web3ABI from 'web3-eth-abi';

export class OutputOracleABICoder {
  static latestBlockNumber(): string {
    return web3ABI.encodeFunctionCall(OutputOracleABI.latestBlockNumber, [])
  }

  static getL2OutputIndexAfter(block: number): string {
    return web3ABI.encodeFunctionCall(OutputOracleABI.getL2OutputIndexAfter, [intToHex(block)])
  }

  static getL2Output(index: number): string {
    return web3ABI.encodeFunctionCall(OutputOracleABI.getL2Output, [intToHex(index)])
  }

  static decodeL2Output(encodedData: string): any {
    return web3ABI.decodeParameters(OutputOracleABI.getL2Output["outputs"][0]["components"], encodedData);
  }
}

const OutputOracleABI = {
  latestBlockNumber: JSON.parse(`{
      "inputs": [],
      "name": "latestBlockNumber",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }`),
  getL2OutputIndexAfter: JSON.parse(`{
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_l2BlockNumber",
          "type": "uint256"
        }
      ],
      "name": "getL2OutputIndexAfter",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }`),
  getL2Output: JSON.parse(`{
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_l2OutputIndex",
          "type": "uint256"
        }
      ],
      "name": "getL2Output",
      "outputs": [
        {
          "components": [
            {
              "internalType": "bytes32",
              "name": "outputRoot",
              "type": "bytes32"
            },
            {
              "internalType": "uint128",
              "name": "timestamp",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "l2BlockNumber",
              "type": "uint128"
            }
          ],
          "internalType": "struct Types.OutputProposal",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }`)
}