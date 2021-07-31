import { NextApiRequest, NextApiResponse } from "next"
import { RateLimiterMemory } from "rate-limiter-flexible"
import { APIError, ErrorResponse, JSONObject, RateLimitResponse } from "../interfaces/APIInterfaces"
import { ConsumeType, CostInterface } from "./interface"
import debugConstr from "debug"
import { getIP, getRateLimitHeaders, setHeaders } from "../util"
import HttpStatusCode from "../interfaces/status-codes"
import ErrorCodes from "../interfaces/error-codes"
import { diff } from "nerdamer"

const debug = debugConstr("RateLimiter")
export class RateLimit {
    static instance: RateLimit = new RateLimit()

    private costs: JSONObject<ConsumeType, CostInterface> = {
        EncryptionKey: {
            cost: 2,
            retries: 2
        },
        Register: {
            cost: 2,
            retries: 2
        },
        TFA: {
            cost: 1,
            retries: 5
        }
    }

    private points = Object.values(this.costs)
        .reduce((a, b) => a + b.cost * b.retries, 0)

    private generationLimiter = new RateLimiterMemory({
        points: this.points,
        duration: 60 * 1000,
    })

    /**
     * Consumes points from the rate limiter
     * @param type The type of consume
     * @param req NextJS request object
     * @param res NextJS response object
     * @returns Weither the client is rate limited or not
     */
    static async consume<T>(type: ConsumeType, req: NextApiRequest, res: NextApiResponse<T | APIError>) {
        debug("🖊 Consuming", type, "...")
        const instance = RateLimit.instance;

        const { generationLimiter, costs, points } = instance

        const cost = costs[type]
        const ip = getIP(req)

        if (!ip) {
            debug("🔌 IP not found")
            res.status(HttpStatusCode.BAD_REQUEST).json({
                message: "Socket Hang Up.",
                error: ErrorCodes.SOCKET_CLOSED
            })
            return true
        }

        if (!cost) {
            debug("🌵 Type", type, "not found")
            res
                .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                .json({
                    message: "The consumation type for the rate limiter could not be found.",
                    error: ErrorCodes.TYPE_NOT_FOUND,
                })
            return true
        }


        const result = await generationLimiter.consume(ip, cost.cost)
            .catch(result => {
                const headers = getRateLimitHeaders(result, points)

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



