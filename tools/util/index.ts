import nerdamer from "nerdamer";
import { NextApiRequest, NextApiResponse } from "next";
import { RateLimiterRes } from "rate-limiter-flexible";
import { JSONObject } from "../interfaces/APIInterfaces";
import { Logger } from '../logger';


const log = Logger.getLogger("Util")

/**
 * Get encryption key expiration time
 * @returns Time in milliseconds
 */
export function getKeyExpiration() {
    const { GENERATE_KEY_EXPIRATION } = process.env
    if (!GENERATE_KEY_EXPIRATION) {
        log.fatal("🚫 No token expiration given. Exiting...")
        process.exit(-2)
    }

    const tokenExpiration = nerdamer(GENERATE_KEY_EXPIRATION).evaluate()

    const stringResult = tokenExpiration.toDecimal()
    return parseFloat(stringResult)
}

/**
 * Gets when the key expires from now
 */
export function getKeyExpirationDate() {
    const millis = getKeyExpiration()
    const now = getTime()

    console.log("Millis", millis)
    return new Date(now + millis).getTime()
}


/**
 * Get encryption key expiration time
 * @returns Time in milliseconds
 */
export function getLoginTokenExpiration() {
    const { GENERATE_LOGIN_TOKEN_EXPIRATION } = process.env
    if (!GENERATE_LOGIN_TOKEN_EXPIRATION) {
        log.fatal("🚫 No login token expiration given. Exiting...")
        process.exit(-2)
    }

    const tokenExpiration = nerdamer(GENERATE_LOGIN_TOKEN_EXPIRATION).evaluate()

    const stringResult = tokenExpiration.toDecimal()
    return parseFloat(stringResult)
}

/**
 * Gets when the key expires from now
 */
export function getLoginTokenExpirationDate() {
    const millis = getLoginTokenExpiration()
    const now = getTime()

    return new Date(now + millis).getTime()
}


/**
 * Get the time value in milliseconds
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