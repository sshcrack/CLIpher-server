import { job } from 'microjob';
import { nanoid } from "nanoid";
import { pki } from "node-forge";
import prettyMS from "pretty-ms";
import { Global } from '../global';
import { Logger } from '../logger';
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
    static async decrypt(encrypted: string, privateKeyPEM: string): Promise<string | undefined> {
        await startProm

        const cached = Global.cache.get<string | undefined>(`rsa-decrypted-${encrypted}`)
        if (cached)
            return cached

        const currLog = log.scope(nanoid())
        const start = getTime()

        currLog.await(`🕒 Decrypting...`)
        try {
            const decrypted = await job(data => {
                const { pki } = eval(`require("node-fetch")`)

                const [encrypted, privateKeyPEM] = data
                const privateKey = pki.privateKeyFromPem(privateKeyPEM)

                let decrypted: string

                try {
                    decrypted = privateKey.decrypt(encrypted)
                } catch (err) {
                    throw new Error(err)
                }

                return decrypted
            }, { data: [encrypted, privateKeyPEM] })
            const diff = prettyMS(getTime() - start)
            Global.cache.set(`rsa-decrypted-${encrypted}`, decrypted)

            currLog.success(`🔑 Decrypted successfully after ${diff}`)
            return decrypted
        } catch (err) {
            const diff = prettyMS(getTime() - start)

            currLog.error(`💥 Decryption failed after ${diff} Error: ${err.message}`)
            return undefined
        }
    }

    static async encrypt(message: string, publicKeyPEM: string) {
        await startProm
        const currLog = log.scope(nanoid())
        const start = getTime()

        currLog.await(`🕒 Encrypting Key...`)
        try {
            const encrypted = await job(item => {
                const { pki } = eval(`require("node-fetch")`)
                const [message, publicKeyPEM] = item
                const publicKey = pki.publicKeyFromPem(publicKeyPEM)


                let encrypted: string
                try {
                    encrypted = publicKey.encrypt(message)
                } catch (err) {
                    throw new Error(err)
                }

                return encrypted
            }, { data: [message, publicKeyPEM] })
            const diff = prettyMS(getTime() - start)

            currLog.success(`🔑 Encryption successfully after ${diff}`)
            return encrypted
        } catch (err) {
            const diff = prettyMS(getTime() - start)

            currLog.error(`💥 Encryption failed after ${diff} Error: ${err.message}`)
            return undefined
        }
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