import debugConstr from "debug";
import nerdamer from "nerdamer";
import { NextApiRequest, NextApiResponse } from "next";
import { RateLimiterRes } from "rate-limiter-flexible";
import { JSONObject } from "./interfaces/APIInterfaces";


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

/**
 * Get clients IP address
 * @param req NextJS request
 * @returns Clients IP
 */
export function getIP(req: NextApiRequest) {
    return req.socket.remoteAddress
}

/**
 * Get Headers to return to the client of a Rate Limiter Result
 * @param result Rate limiter consume result
 * @param points Total points of the rate limiter
 * @returns Headers to return to the client indicating rate limiter status
 */
export function getRateLimitHeaders(result: RateLimiterRes, points: number) {
    const { msBeforeNext, remainingPoints } = result

    return {
        "Retry-After": msBeforeNext / 1000,
        "X-RateLimit-Limit": points,
        "X-RateLimit-Remaining": remainingPoints,
        "X-RateLimit-Reset": new Date(Date.now() + msBeforeNext).getTime()
    }
}

export function setHeaders<T extends string, K extends string | number, X>(headers: JSONObject<T, K>, res: NextApiResponse<X>) {
    const entries = Object.entries<K>(headers)

    let currentRes = res
    for (const [header, value] of entries) {
        currentRes = currentRes.setHeader(header, value)
    }

    return currentRes
}