import debugConstr from "debug";
import nerdamer from "nerdamer";
import { NextApiRequest } from "next";


const debug = debugConstr("Util")

/**
 * Get encryption key expiration time
 * @returns Time in milliseconds
 */
export function getKeyExpiration() {
    const { GENERATE_KEY_EXPIRATION } = process.env
    if (!GENERATE_KEY_EXPIRATION) {
        debug("🚫 No token expiration given. Exiting...")
        process.exit(-2)
    }

    const tokenExpiration = nerdamer(GENERATE_KEY_EXPIRATION).evaluate()

    const stringResult = tokenExpiration.toDecimal()
    return parseFloat(stringResult)
}
/**
 * Get the current time
 * @returns Current time
 */
export function getTime() {
    return new Date().getTime()
}

export function getIP(req: NextApiRequest) {
    return req.socket.remoteAddress
}