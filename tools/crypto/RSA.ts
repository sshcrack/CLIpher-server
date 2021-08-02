import debugConstr from "debug";
import { pki } from "node-forge";
import Parallel from "paralleljs";
import { getTime } from "../util";

const debug = debugConstr("Crypto:RSA")
const rsa = pki.rsa

type PEMOutput = {
    publicKey: string,
    privateKey: string
}

export class RSA {
    /**
     * Decrypt a string using a private key
     * @param encrypted The string to decrypt
     * @param privateKeyPEM PEM formatted private key
     * @returns The decrypted string
     */
    static decrypt(encrypted: string, privateKeyPEM: string): Promise<string | undefined> {
        return new Promise(resolve => {
            const worker = new Parallel([encrypted, privateKeyPEM]);
            const start = getTime()


            debug("🕐 Decrypting message...")
            worker.spawn(item => {
                const { pki } = eval(`require("node-fetch")`)

                const [encrypted, privateKeyPEM] = item
                const privateKey = pki.privateKeyFromPem(privateKeyPEM)

                let decrypted: string

                try {
                    decrypted = privateKey.decrypt(encrypted)
                } catch (err) {
                    throw new Error(err)
                }

                return [decrypted]
            }).then(result => {
                let [decrypted] = result

                const end = getTime()
                const ms = end - start

                debug("🔑 RSA Decryption successful after", ms, "ms")
                resolve(decrypted)
            }, err => {
                const end = getTime()
                const ms = end - start

                debug("💥 RSA Decryption failed after", ms, "ms. Error: ", err.message)
                resolve(undefined)
            })
        })
    }

    static encrypt(message: string, publicKeyPEM: string) {
        return new Promise(resolve => {
            const worker = new Parallel([message, publicKeyPEM])
            const start = getTime()

            debug("🕐 Encrypting message...")
            worker.spawn(item => {
                const { pki } = eval(`require("node-fetch")`)
                const [message, publicKeyPEM] = item

                const publicKey = pki.publicKeyFromPem(publicKeyPEM)
                let encrypted: string

                try {
                    encrypted = publicKey.encrypt(message)
                } catch (err) {
                    throw new Error(err)
                }

                return [encrypted]
            }).then(result => {
                const [encrypted] = result

                const end = getTime()
                const ms = end - start

                debug("🔑 RSA Encryption successful after", ms, "ms")
                resolve(encrypted)
            }, err => {
                const end = getTime()
                const ms = end - start

                debug("💥 RSA Encryption failed after", ms, "ms. Error: ", err.message)
                resolve(undefined)
            })
        })
    }

    /**
     * Generate a new RSA key pair
     * @returns A generated RSA key pair
     */
    static generateKeyPair(): Promise<PEMOutput | undefined> {
        return new Promise((resolve, reject) => {
            debug("🕐 Generating keypair...")
            const start = getTime()
            rsa.generateKeyPair({
                bits: 2048,
                workers: 4,
            }, (err, keyPair) => {
                const end = getTime()
                const ms = end - start

                if (err) {
                    debug("💥 RSA Keypair generation failed after", ms, "ms")
                    return resolve(undefined)
                }

                debug("🔑 RSA Keypair generated after", ms, "ms")

                const { publicKey, privateKey } = keyPair

                const pem = {
                    publicKey: pki.publicKeyToPem(publicKey),
                    privateKey: pki.privateKeyToPem(privateKey)
                }
                resolve(pem)
            })
        });
    }
}