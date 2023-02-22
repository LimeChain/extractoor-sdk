import rlp from 'rlp'
import Account from 'ethereumjs-account'
import { SecureTrie as Trie } from 'merkle-patricia-tree'
import { stripHexPrefixIfNecessary } from '../utils/HexUtils';

export class MPTProofVerifier {
    static async verifyAccountProof(stateRoot: string, targetAccount: string, accountProof: string[]): Promise<Account> {

        const accountProofBuff = new Array();
        for (let p of accountProof) {
            accountProofBuff.push(Buffer.from(stripHexPrefixIfNecessary(p), "hex"));
        }

        const accountValue = await Trie.verifyProof(Buffer.from(stripHexPrefixIfNecessary(stateRoot), "hex"), Buffer.from(stripHexPrefixIfNecessary(targetAccount), "hex"), accountProofBuff);
        const account = new Account(accountValue);
        return account;
    }

    static async verifyStorageProof(storageRoot: string, storageSlot: string, storageProof: string[]): Promise<any[]> {

        const storageProofBuff = new Array()

        for (let p of storageProof) {
            storageProofBuff.push(Buffer.from(stripHexPrefixIfNecessary(p), "hex"));
        }

        const storageRlpValue = await Trie.verifyProof(Buffer.from(stripHexPrefixIfNecessary(storageRoot), "hex"), Buffer.from(stripHexPrefixIfNecessary(storageSlot), "hex"), storageProofBuff);
        const storageValue = [].slice.call(rlp.decode(storageRlpValue));
        return storageValue;
    }
}