import { pki } from "node-forge"
import debugConstr from "debug"
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
    static decrypt(encrypted: string, privateKeyPEM: string): Promise<string> {
        return new Promise((resolve, reject) => {
            debug("🕐 Decrypting message...")
            const privateKey = pki.privateKeyFromPem(privateKeyPEM)

            const start = getTime()
            let decrypted: string

            try {
                decrypted = privateKey.decrypt(encrypted)
            } catch (err) {
                const end = getTime()
                const ms = end - start

                debug("💥 RSA Decryption failed after", ms, "ms")
                return reject(err)
            }

            const end = getTime()
            const ms = end - start

            debug("🔑 RSA Decryption successful after", ms, "ms")

            resolve(decrypted)
        })
    }

    static encrypt(message: string, publicKeyPEM: string) {
        return new Promise((resolve, reject) => {
            debug("🕐 Encrypting message...")
            const publicKey = pki.publicKeyFromPem(publicKeyPEM)

            const start = getTime()
            let decrypted: string

            try {
                decrypted = publicKey.encrypt(message)
            } catch (err) {
                const end = getTime()
                const ms = end - start

                debug("💥 RSA Encryption failed after", ms, "ms")
                return reject(err)
            }

            const end = getTime()
            const ms = end - start

            debug("🔑 RSA Encryption successful after", ms, "ms")
            resolve(decrypted)
        })
    }

    /**
     * Generate a new RSA key pair
     * @returns A generated RSA key pair
     */
    static generateKeyPair(): Promise<PEMOutput> {
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
                    return reject(err)
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