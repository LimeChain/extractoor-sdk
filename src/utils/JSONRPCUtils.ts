export function paramsToRequest(method: string, params: Array<any>): Object {
    return {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "id": 0
    }
}