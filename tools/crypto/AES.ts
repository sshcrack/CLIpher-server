import Parallel from "paralleljs";
import debugConstr from "debug"
import { getTime } from '../util';

const debug = debugConstr('Crypto:AES');
export class AES {
    static keySize = 32

    static generateIV(): Promise<string | undefined> {
        return new Promise(resolve => {
            debug("🕒 Generating IV...")
            const worker = new Parallel(JSON.stringify(AES.keySize))
            worker.spawn(item => {
                const { random } = eval(`require("node-forge")`)

                const iv = random.getBytesSync(JSON.parse(item))
                return iv
            }).then(result => {
                resolve(result)
                debug("🚕 IV Generated")
            }, err => {
                debug("💥 An Error occurred generating the IV:", err.message)

                resolve(undefined)
            })

        });
    }

    static async encrypt(options: EncryptOptions): Promise<string | undefined> {
        return new Promise(resolve => {
            const worker = new Parallel([
                options.plain,
                options.password,
                options.iv,
            ])

            debug("🔑 Encrypting key...")
            const start = getTime()
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
                const end = getTime()
                debug(`🔑 Encryption took ${end - start}ms`)

                resolve(result[0])
            }, err => {
                const end = getTime()
                debug(`💥 Encryption failed after ${end - start}ms Error:`, err.message)

                resolve(undefined)
            })
        });
    }

    static async decrypt(options: DecryptOptions) {
        return new Promise((resolve, reject) => {
            const worker = new Parallel([
                options.encrypted,
                options.password,
                options.iv,
            ])

            debug("🔑 Encrypting key...")
            const start = new Date().getTime()
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
                debug(`🔑 Encryption took ${end - start}ms`)

                resolve(result[0])
            }, err => {
                const end = new Date().getTime()
                debug(`💥 Encryption failed after ${end - start}ms Error:`, err.message)

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