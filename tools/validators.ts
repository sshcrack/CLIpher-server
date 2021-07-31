import debugConstr from "debug";
import { NextApiRequest, NextApiResponse } from "next";
import { Global } from "./global";
import { AvailableMethods, CheckInterface, ErrorResponse, MaxLengthInterface } from "./interfaces/APIInterfaces";
import ErrorCodes from "./interfaces/error-codes";
import HttpStatusCode from "./interfaces/status-codes";
import { CheckArguments, IFunctionArgs, IFunctions } from "./interfaces/validatorInterfaces";
import { getIP } from "./util";

const debug = debugConstr("Validators")

/**
 * Checks if the request body met the requirements
 * @param req The request object
 * @param toCheck What objects to check the length of
 * @returns Weither the requirements met or not
 */
export function checkMaxLength<T>(toCheck: CheckInterface[], req: NextApiRequest, res: NextApiResponse<T | ErrorResponse>) {
    const body = req.body

    let invalidFields: MaxLengthInterface[] = []
    toCheck.forEach(curr => {
        const { name, maxLength } = curr
        const currValue = body[name]

        if (!currValue.length)
            return debug("📌 Couldn't check field", name, ": length property not found ")

        if (currValue.length <= maxLength)
            return

        invalidFields.push({
            name: name,
            value: currValue,
            maxLength: maxLength
        })
    })

    const requirementsMet = invalidFields.length === 0
    if (!requirementsMet) {
        const formattedList = invalidFields
            .map(e => `Name: ${e.name} MaxLength: ${e.maxLength}`)
            .join(", ")
        res
            .status(HttpStatusCode.BAD_REQUEST)
            .json({
                error: ErrorCodes.INVALID_BODY_LENGTH,
                message: `Invalid length of following fields: ${formattedList}`
            })
    }

    return requirementsMet
}


/**
 * Sends a Bad Request Status code if the given method does not match the requested one
 * @param method The method that is allowed
 * @param req Request object from nextjs handler
 * @param res Response object from nextjs handler
 * @returns If the given method matches the request method
 */
export function checkMethod<T, X extends string>(method: AvailableMethods<X>, req: NextApiRequest, res: NextApiResponse<T | ErrorResponse>) {
    if (req.method === method)
        return true

    const status = res.status(HttpStatusCode.METHOD_NOT_ALLOWED)
    status.json({
        error: ErrorCodes.METHOD_NOT_ALLOWED,
        message: `${method} Method not allowed`
    })

    return false
}

/**
 * Checks if the request body is valid
 * @param requiredFields Required Fields
 * @param req Request object from nextjs handler
 * @param res Response object from nextjs handler
 * @returns Weither the body contains all required fields
 */
export function checkBody<T>(requiredFields: string[], req: NextApiRequest, res: NextApiResponse<T | ErrorResponse>) {
    const body = req.body
    const keys = Object.keys(body)

    const notIncluded: string[] = []
    requiredFields.forEach(field => {
        const includesField = keys.includes(field)
        if (!includesField)
            notIncluded.push(field)
    })

    const matches = notIncluded.length === 0
    if (matches)
        return true

    const status = res.status(HttpStatusCode.BAD_REQUEST)
    status.json({
        error: ErrorCodes.METHOD_NOT_ALLOWED,
        message: `Required field not available: ${notIncluded.join(", ")}`
    })

    return false
}

/**
 * Check if the socket hang up
 * @param req NextJS Request object
 * @param res NextJS Response object
 * @returns Weither the socket hang up
 */
export function checkIP<T>(req: NextApiRequest, res: NextApiResponse<T | ErrorResponse>) {
    const ip = getIP(req)
    if (!ip)
        res
            .status(HttpStatusCode.FORBIDDEN)
            .json({
                message: "Socket hang up",
                error: ErrorCodes.SOCKET_CLOSED
            })

    return ip === undefined
}

export async function checkDBConnection<T>(_req: NextApiRequest, res: NextApiResponse<T | ErrorResponse>) {
    const currentConn = Global._database
    if(!currentConn)
        res
            .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
            .json({
                message: "Database connection not available",
                error: ErrorCodes.DB_CONNECTION_NOT_AVAILABLE
            })

    return currentConn === undefined
}
export async function runChecks<T, X extends string>({ method, requiredFields, checks, ip }: CheckArguments<X>, req: NextApiRequest, res: NextApiResponse<T>) {
    const noIPLength = 4
    const withIPLength = 5 // Just noIPLength plus one, but cant do that bc typescript

    const funcLength = ip ? withIPLength : noIPLength
    const functions: IFunctions<typeof withIPLength> = [
        checkMethod,
        checkBody,
        checkDBConnection,
        checkMaxLength,
        checkIP
    ]

    const functionArgs: IFunctionArgs<typeof withIPLength, X> = [
        [
            method
        ],
        [
            requiredFields
        ],
        [
            checks
        ],
        [],
        []
    ]

    let invalid = false
    for (let i = 0; i < funcLength; i++) {
        const func = functions[i]
        const args = functionArgs[i]

        invalid = await func(...args, req, res)

        //Breaking because multiple responses could be sent
        if (invalid)
            break
    }

    return invalid
}