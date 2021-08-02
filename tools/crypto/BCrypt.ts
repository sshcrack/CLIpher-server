import Parallel from "paralleljs"
import debugConstr from "debug"

const debug = debugConstr("Crypto:BCrypt")
export class BCrypt {
    static hash(password: string): Promise<string | undefined> {
        return new Promise(resolve => {
            const worker = new Parallel(password)

            debug("🔑 Hashing password...")
            const start = new Date().getTime()
            worker.spawn((item: string) => {
                //* Can't require because webpack would convert it to __webpack__.require, which is not available in the worker
                const bcrypt = eval(`require("bcrypt")`)

                return bcrypt.hashSync(item, 10)
            }).then(result => {
                const end = new Date().getTime()
                debug(`🔑 Hashing took ${end - start}ms`)

                resolve(result[0])
            }, err => {
                const end = new Date().getTime()
                debug(`💥 Hashing failed after ${end - start}ms Error:`, err.message)

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