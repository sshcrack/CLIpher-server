import { pki } from "node-forge"
import debugConstr from "debug"
import { getTime } from "../util";

const debug = debugConstr("Crypto:RSA")
const rsa = pki.rsa

type PEMOutput = {
    publicKey: string,
    privateKey: string
}

export function generateRSAKeypair(): Promise<PEMOutput> {
    return new Promise((resolve, reject) => {
        debug("🕐 Generating keypair...")
        const start = getTime()
        rsa.generateKeyPair({
            bits: 2048,
            workers: 4
        }, (err, keypair) => {
            const end = getTime()
            const ms = end - start

            if (err) {
                debug("🥴 RSA Keypair generation failed after", ms, "ms")
                return reject(err)
            }

            debug("🔑 RSA Keypair generated after", ms, "ms")

            const { publicKey, privateKey } = keypair

            const pem = {
                publicKey: pki.publicKeyToPem(publicKey),
                privateKey: pki.privateKeyToPem(privateKey)
            }
            resolve(pem)
        })
    });
}