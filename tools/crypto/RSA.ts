import { job } from 'microjob';
import { nanoid } from "nanoid";
import { pki } from "node-forge";
import prettyMS from "pretty-ms";
import { Global } from '../global';
import { Logger } from '../logger';
import NodeRSA from "node-rsa"
import { getTime, startWorkers } from '../util';

const log = Logger.getLogger("Crypto", "RSA")
const rsa = pki.rsa

type PEMOutput = {
    publicKey: string,
    privateKey: string
}

const startProm = startWorkers()
export class RSA {
    /**
     * Decrypt a string using a private key
     * @param encrypted The string to decrypt
     * @param privateKeyPEM PEM formatted private key
     * @returns The decrypted string
     */
    static async decrypt(encrypted: Buffer, privateKeyPEM: string): Promise<string | undefined> {
        await startProm

        const cached = Global.cache.get<string | undefined>(`rsa-decrypted-${encrypted}`)
        if (cached)
            return cached

        const currLog = log.scope(nanoid())
        const start = getTime()

        currLog.await(`🕒 Decrypting...`)
        const privateKey = new NodeRSA(privateKeyPEM)

        let decrypted: Buffer

        try {
            decrypted = privateKey.decrypt(Buffer.from(encrypted))
        } catch (err) {
            const diff = prettyMS(getTime() - start)

            currLog.error(`💥 Decryption failed after ${diff} Error: ${err.message}`)
            return undefined
        }

        const diff = prettyMS(getTime() - start)
        Global.cache.set(`rsa-decrypted-${encrypted}`, decrypted)

        currLog.success(`🔑 Decrypted successfully after ${diff}`)
        return decrypted.toString()
    }

    static async encrypt(message: string, publicKeyPEM: string): Promise<Buffer | undefined> {
        await startProm
        const currLog = log.scope(nanoid())
        const start = getTime()

        currLog.await(`🕒 Encrypting Key...`)
        const publicKey = new NodeRSA(publicKeyPEM)

        let encrypted: Buffer
        try {
            encrypted = publicKey.encrypt(Buffer.from(message))
        } catch (err) {
            const diff = prettyMS(getTime() - start)

            currLog.error(`💥 Encryption failed after ${diff} Error: ${err.message}`)
            return undefined
        }

        const diff = prettyMS(getTime() - start)

        currLog.success(`🔑 Encryption successfully after ${diff}`)
        return encrypted

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