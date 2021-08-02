import Parallel from "paralleljs"


export class BCrypt {
    static hash(password: string) {
        const worker = new Parallel(password)
        return worker.spawn((item: string) => {
            //* Can't require because webpack would convert it to __webpack__.require, which is not available in the worker
            const bcrypt = eval(`require("bcrypt")`)
            return bcrypt.hashSync(item, 10)
        })
    }

    static async verify(hash: string, password: string) {
        const worker = new Parallel([hash, password])
        const res = await  worker.spawn(item => {
            //* Can't require because webpack would convert it to __webpack__.require, which is not available in the worker
            const bcrypt = eval(`require("bcrypt")`)

            const [hash, password] = item
            const res = bcrypt.compareSync(password, hash)
            return [JSON.stringify(res)]
        })
        return JSON.parse(res[0])
    }
}