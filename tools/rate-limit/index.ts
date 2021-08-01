import debugConstr from "debug"
import { NextApiRequest, NextApiResponse } from "next"
import { RateLimiterMemory } from "rate-limiter-flexible"
import { APIError } from "../interfaces/APIInterfaces"
import ErrorCodes from "../interfaces/error-codes"
import HttpStatusCode from "../interfaces/status-codes"
import { sendErrorResponse } from "../responses/errorResponse"
import { getIP, getRateLimitHeaders, setHeaders } from "../util"
import { ConsumeType, CostInterface } from "./interface"

const debug = debugConstr("RateLimiter")
export class RateLimit {
    static instance: RateLimit = new RateLimit()

    private limiterDuration = 60 * 1000
    private limiters: CostInterface<ConsumeType>[] = [
        {
            type: ConsumeType.EncryptionKey,
            retries: 2
        },
        {
            type: ConsumeType.Register,
            retries: 1
        },
        {
            type: ConsumeType.TFA,
            retries: 5
        }
    ].map(e => {
        const obj: CostInterface<ConsumeType> = {
            ...e,
            limiter: new RateLimiterMemory({
                points: e.retries,
                duration: this.limiterDuration
            })
        }

        return obj
    })

    /**
     * Consumes points from the rate limiter
     * @param type The type of consume
     * @param req NextJS request object
     * @param res NextJS response object
     * @returns Weither the client is rate limited or not
     */
    static async consume<T>(type: ConsumeType, req: NextApiRequest, res: NextApiResponse<T | APIError>) {
        const instance = RateLimit.instance;
        const ip = getIP(req)
        const { limiters } = instance

        const limiterInformation = limiters.find(e => e.type === type)
        if (!limiterInformation) {
            debug("🌵 Type", type, "not found")
            sendErrorResponse(res, ErrorCodes.TYPE_NOT_FOUND)
            return true
        }

        const { limiter, retries } = limiterInformation
        if (!limiter)
            sendErrorResponse(res, ErrorCodes.LIMITER_NOT_AVAILABLE)
        if (!ip)
            sendErrorResponse(res, ErrorCodes.SOCKET_CLOSED)

        if (!limiter || !ip)
            return true


        const result = await limiter.consume(ip, 1)
            .catch(result => {
                const headers = getRateLimitHeaders(result, retries)

                setHeaders(headers, res)
                res
                    .status(HttpStatusCode.TOO_MANY_REQUESTS)
                    .json({
                        error: ErrorCodes.RATE_LIMITED,
                        message: "Too many requests. Try again later.",
                        limit: headers["X-RateLimit-Limit"],
                        reset: headers["X-RateLimit-Reset"],
                        retryAfter: headers["Retry-After"],
                    })
            })

        return typeof result === "undefined"
    }
}



