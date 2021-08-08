import { nanoid } from 'nanoid';
import { job } from "microjob"
import prettyMS from 'pretty-ms';
import { Logger } from '../logger';
import { getTime, startWorkers } from '../util';

const log = Logger.getLogger("Crypto", "Bcrypt")
const startProm = startWorkers()
export class BCrypt {
    static async hash(password: string): Promise<string | undefined> {
        await startProm

        const currLog = log.scope(nanoid())
        const start = new Date().getTime()

        currLog.await("🔑 Hashing password...")
        try {
            const res = await job(password => {
                //* Can't require because webpack would convert it to __webpack__.require, which is not available in the worker
                const bcrypt = eval(`require("bcrypt")`)

                return bcrypt.hashSync(password, 10)
            }, { data: password })
            const diff = prettyMS(getTime() - start)

            currLog.success(`🔑 Hashing took ${diff}`)
            return res
        } catch (err) {
            const diff = prettyMS(getTime() - start)

            currLog.error(`💥 Hashing failed after ${diff}ms Error:`, err.message)
            return undefined
        }

    }

    static async verify(hash: string, password: string) {
        await startProm

        try {
            const res = await job((data: string[]) => {
                //* Can't require because webpack would convert it to __webpack__.require, which is not available in the worker
                const bcrypt = eval(`require("bcrypt")`)

                const [hash, password] = data
                return bcrypt.compareSync(password, hash)
            }, { data: [hash, password] })

            return res
        } catch (err) {
            log.error(`💥 Verification failed. Error:`, err.message)

            return false
        }
    }
}