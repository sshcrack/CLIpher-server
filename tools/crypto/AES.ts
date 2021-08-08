import { job } from "microjob";
import { nanoid } from 'nanoid';
import prettyMS from 'pretty-ms';
import { Global } from '../global';
import { Logger } from '../logger';
import { getTime, startWorkers } from '../util';

const log = Logger.getLogger("Crypto", "AES");
const startProm = startWorkers()
export class AES {
    static async encrypt(options: EncryptOptions): Promise<string | undefined> {
        await startProm
        const currLog = log.scope(nanoid())
        const start = getTime()


        currLog.await("🕒 Encrypting key using AES...")
        try {
            const res = await job(data => {
                const { AESEncryption } = eval(`require("aes-password")`)
                const { plain, password } = data

                const output = AESEncryption.encrypt(plain, password)
                return output
            }, { data: options })
            const diff = prettyMS(getTime() - start)

            currLog.success(`🔑 Encryption took ${diff}`)
            return res
        } catch (err) {
            const diff = prettyMS(getTime() - start)
            currLog.error(`💥 Encryption failed after ${diff} Error:`, err.message)

            return undefined
        }
    }

    static async decrypt(options: DecryptOptions): Promise<string | undefined> {
        await startProm;
        const cached = Global.cache.get<string | undefined>(`aes-decrypted-${options.encrypted}`)
        if (cached)
            return cached

        const currLog = log.scope(nanoid())

        currLog.await("🔑 Decrypting key...")
        const start = getTime()

        try {
            const res = await job(data => {
                const { AESEncryption } = eval(`require("aes-password")`)
                const { encrypted, password } = data

                const text = AESEncryption.decrypt(encrypted, password);
                return text
            }, { data: options })
            const diff = prettyMS(getTime() - start)

            currLog.success(`🔑 Decryption took ${diff}ms`)

            Global.cache.set(`aes-decrypted-${options.encrypted}`, res)
            return res
        } catch (err) {
            const diff = prettyMS(getTime() - start)
            currLog.error(`💥 Encryption failed after ${diff}ms Error:`, err.message)

            return undefined
        }
    }
}

export interface EncryptOptions {
    plain: string,
    password: string
}

export interface DecryptOptions {
    encrypted: string,
    password: string
}