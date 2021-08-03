import { nanoid } from 'nanoid';
import Parallel from "paralleljs";
import prettyMS from 'pretty-ms';
import { Global } from '../global';
import { getTime } from '../util';

const log = Global.getLogger("Crypto", "AES");
export class AES {
    static keySize = 32

    static generateIV(): Promise<string | undefined> {
        return new Promise(resolve => {
            const start = getTime()
            const currLog = log.scope(nanoid())
            currLog.await("🕒 Generating IV...")

            const worker = new Parallel(JSON.stringify(AES.keySize))
            worker.spawn(item => {
                const { random } = eval(`require("node-forge")`)

                const iv = random.getBytesSync(JSON.parse(item))
                return iv
            }).then(result => {
                const diff = prettyMS(getTime() - start)
                currLog.success(`🚕 IV Generated after ${diff}`)

                resolve(result)
            }, err => {
                const diff = prettyMS(getTime() - start)
                currLog.error(`💥 Failed to generate IV after ${diff}. Error:`, err.message)

                resolve(undefined)
            })

        });
    }

    static async encrypt(options: EncryptOptions): Promise<string | undefined> {
        return new Promise(resolve => {
            const currLog = log.scope(nanoid())
            const start = getTime()

            const worker = new Parallel([
                options.plain,
                options.password,
                options.iv,
            ])

            currLog.await("🕒 Encrypting key using AES...")
            worker.spawn(item => {
                const { cipher, util } = eval(`require("node-forge")`)
                const [plain, password, iv] = item

                const created = cipher.createCipher('AES-CBC', password)

                created.start({ iv: iv })
                created.update(util.createBuffer(plain))
                created.finish()

                const output = created.output.toString()
                return [output]
            }).then(result => {
                const diff = prettyMS(getTime() - start)
                currLog.success(`🔑 Encryption took ${diff}5`)

                resolve(result[0])
            }, err => {
                const diff = prettyMS(getTime() - start)
                currLog.error(`💥 Encryption failed after ${diff} Error:`, err.message)

                resolve(undefined)
            })
        });
    }

    static async decrypt(options: DecryptOptions) {
        return new Promise(resolve => {
            const currLog = log.scope(nanoid())
            const worker = new Parallel([
                options.encrypted,
                options.password,
                options.iv,
            ])

            currLog.await("🔑 Encrypting key...")
            const start = getTime()
            worker.spawn(item => {
                const { cipher, util } = eval(`require("node-forge")`)
                const [encrypted, key, iv] = item

                const created = cipher.createCipher('AES-CBC', key)

                created.start({ iv: iv })
                created.update(util.createBuffer(encrypted))
                created.finish()

                const output = created.output.toString()
                return [output]
            }).then(result => {
                const end = new Date().getTime()
                currLog.success(`🔑 Encryption took ${end - start}ms`)

                resolve(result[0])
            }, err => {
                const end = new Date().getTime()
                currLog.error(`💥 Encryption failed after ${end - start}ms Error:`, err.message)

                resolve(undefined)
            })
        });
    }
}

export interface EncryptOptions {
    plain: string,
    password: string,
    iv: string
}

export interface DecryptOptions {
    encrypted: string,
    password: string,
    iv: string
}