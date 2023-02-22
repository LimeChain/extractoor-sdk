import rlp from 'rlp'
import { bufferToHex } from 'ethereumjs-util'

export class MPTProofsEncoder {
    static rlpEncodeProof(accountProof: string[]): string {
        const decodedProof = accountProof.map(node => rlp.decode(node))

        return bufferToHex(Buffer.from(rlp.encode(decodedProof)))
    }

    static rlpEncodeProofs(proofs: string[][]): string {
        const decodedProofs = proofs.map(proof => {
            return proof.map(node => rlp.decode(node))
        })

        return bufferToHex(Buffer.from(rlp.encode(decodedProofs)))
    }
}