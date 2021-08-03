import { nanoid } from "nanoid";
import { pki } from "node-forge";
import Parallel from "paralleljs";
import prettyMS from "pretty-ms";
import { Global } from '../global';
import { Logger } from '../logger';
import { getTime } from '../util';

const log = Logger.getLogger("Crypto", "RSA")
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

            const currLog = log.scope(nanoid())
            const start = getTime()

            currLog.await(`🕒 Decrypting...`)
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
                const diff = prettyMS(getTime() - start)

                Global.cache.set(`rsa-decrypted-${encrypted}`, decrypted)
                currLog.success(`🔑 Decrypted successfully after ${diff}`)
                resolve(decrypted)
            }, err => {
                const diff = prettyMS(getTime() - start)

                currLog.error(`💥 Decryption failed after ${diff} Error: ${err.message}`)
                resolve(undefined)
            })
        })
    }

    static encrypt(message: string, publicKeyPEM: string) {
        return new Promise(resolve => {
            const worker = new Parallel([message, publicKeyPEM])

            const currLog = log.scope(nanoid())
            const start = getTime()

            currLog.await(`🕒 Encrypting Key...`)
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
                const diff = prettyMS(getTime() - start)

                currLog.success(`🔑 Encryption successfully after ${diff}`)
                resolve(encrypted)
            }, err => {
                const diff = prettyMS(getTime() - start)

                currLog.error(`💥 Encryption failed after ${diff} Error: ${err.message}`)
                resolve(undefined)
            })
        })
    }

    /**
     * Generate a new RSA key pair
     * @returns A generated RSA key pair
     */
    static generateKeyPair(): Promise<PEMOutput | undefined> {
        return new Promise(resolve => {
            const currLog = log.scope(nanoid())
            const start = getTime()

            currLog.await(`🕒 Generating Key pair...`)
            rsa.generateKeyPair({
                bits: 2048,
                workers: 4,
            }, (err, keyPair) => {
                const { publicKey, privateKey } = keyPair ?? {}
                const diff = prettyMS(getTime() - start)
                if (err) {
                    currLog.error(`💥 Key pair generation failed after ${diff} Error: ${err.message}`)

                    return resolve(undefined)
                }


                currLog.success(`🔑 Key pair was generated successfully after ${diff}`)
                const pem = {
                    publicKey: pki.publicKeyToPem(publicKey),
                    privateKey: pki.privateKeyToPem(privateKey)
                }

                resolve(pem)
            })
        });
    }
}