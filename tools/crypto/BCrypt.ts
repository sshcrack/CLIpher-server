import { nanoid } from 'nanoid';
import Parallel from "paralleljs";
import prettyMS from 'pretty-ms';
import { Logger } from '../logger';
import { getTime } from '../util';

const log = Logger.getLogger("Crypto", "Bcrypt")
export class BCrypt {
    static hash(password: string): Promise<string | undefined> {
        return new Promise(resolve => {
            const worker = new Parallel(password)
            const currLog = log.scope(nanoid())
            const start = new Date().getTime()

            currLog.await("🔑 Hashing password...")
            worker.spawn((item: string) => {
                //* Can't require because webpack would convert it to __webpack__.require, which is not available in the worker
                const bcrypt = eval(`require("bcrypt")`)

                return bcrypt.hashSync(item, 10)
            }).then(result => {
                const diff = prettyMS(getTime() - start)

                currLog.success(`🔑 Hashing took ${diff}`)
                resolve(result[0])
            }, err => {
                const diff = prettyMS(getTime() - start)

                currLog.error(`💥 Hashing failed after ${diff}ms Error:`, err.message)
                resolve(undefined)
            })
        });

    }

    static async verify(hash: string, password: string) {
        const worker = new Parallel([hash, password])
        const res = await worker.spawn(item => {
            //* Can't require because webpack would convert it to __webpack__.require, which is not available in the worker
            const bcrypt = eval(`require("bcrypt")`)

            const [hash, password] = item
            const res = bcrypt.compareSync(password, hash)
            return [JSON.stringify(res)]
        })
        return JSON.parse(res[0])
    }
}