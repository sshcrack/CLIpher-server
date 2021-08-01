import debugConstr from "debug"
import CryptoRandomString from "../commonjs-libs/crypto-random-string"
import { getTime } from "../util"

const debug = debugConstr("TokenGenerator")
export function generateToken() {
    debug(`🕑 Requesting to generate token...`)
    const measureStart = getTime()
    const token = CryptoRandomString.generate({
        type: "ascii-printable",
        length: 64
    })

    const now = getTime()
    const difference = now - measureStart
    debug(`🔑 Token generation took ${difference}ms`)

    return token
}