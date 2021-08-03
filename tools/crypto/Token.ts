import { nanoid } from 'nanoid'
import prettyMilliseconds from 'pretty-ms'
import CryptoRandomString from "../commonjs-libs/crypto-random-string"
import { Logger } from '../logger'
import { getTime } from "../util"

const log = Logger.getLogger("Crypto", "Token")
export function generateToken() {
    const currLog = log.scope(nanoid())
    const start = getTime()

    currLog.await(`🕑 Requesting to generate token...`)
    const token = CryptoRandomString.generate({
        type: "ascii-printable",
        length: 64
    })

    const diff = prettyMilliseconds(getTime() - start)
    currLog.success(`🔑 Token generation took ${diff}`)

    return token
}