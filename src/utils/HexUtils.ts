export function stripHexPrefixIfNecessary(hexString: string): string {
    return hexString.startsWith("0x") ? hexString.substring(2) : hexString;
}