import debugConstr from "debug";
import { NextApiRequest, NextApiResponse } from "next";
import { Global } from "../global";
import { APIError, AvailableMethods, CheckInterface, MaxLengthInterface } from "../interfaces/APIInterfaces";
import ErrorCodes, { FormattedError, GeneralError } from "../interfaces/error-codes";
import { CheckArguments, IFunctionArgs, IFunctions, TypeCheckInterface } from "./interface";
import { sendErrorResponse } from "../responses";
import { getIP } from "../util";

const debug = debugConstr("Validators")

/**
 * Checks if the request body met the requirements
 * @param req The request object
 * @param toCheck What objects to check the length of
 * @returns if the check succeeded
 */
export function checkMaxLength<T>(toCheck: CheckInterface[], req: NextApiRequest, res: NextApiResponse<T | APIError>) {
    const body = req.body

    let invalidFields: MaxLengthInterface[] = []
    toCheck.forEach(curr => {
        const { name, maxLength } = curr
        const currValue = body[name]
        const length = currValue?.toString()

        if (!length)
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

        sendErrorResponse(res, {
            error: FormattedError.INVALID_BODY_LENGTH,
            invalidFields: formattedList
        })
    }

    return requirementsMet
}


/**
 * Sends a Bad Request Status code if the given method does not match the requested one
 * @param method The method that is allowed
 * @param req Request object from nextjs handler
 * @param res Response object from nextjs handler
 * @returns the check succeeded
 */
export function checkMethod<T, X extends string>(method: AvailableMethods<X>, req: NextApiRequest, res: NextApiResponse<T | APIError>) {
    if (req.method === method)
        return true

    sendErrorResponse(res, {
        error: FormattedError.METHOD_NOT_ALLOWED,
        method: req.method
    })

    return false
}

/**
 * Checks if the request body is valid
 * @param requiredFields Required Fields
 * @param req Request object from nextjs handler
 * @param res Response object from nextjs handler
 * @returns If the check succeeded
 */
export function checkBody<T>(requiredFields: string[], req: NextApiRequest, res: NextApiResponse<T | APIError>) {
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

    sendErrorResponse(res, {
        error: FormattedError.FIELDS_NOT_AVAILABLE,
        missing: notIncluded.join(", ")
    })

    return false
}

/**
 * Check if the socket hang up
 * @param req NextJS Request object
 * @param res NextJS Response object
 * @returns Weither the check succeeded
 */
export function checkIP<T>(req: NextApiRequest, res: NextApiResponse<T | APIError>) {
    const ip = getIP(req)
    if (!ip)
        sendErrorResponse(res, GeneralError.SOCKET_CLOSED)

    return ip !== undefined
}

/**
 * Checks if a db connection is available
 * @param _req NextJS request object
 * @param res NextJS response
 * @returns If the check succeeded
 */
export async function checkDBConnection<T>(_req: NextApiRequest, res: NextApiResponse<T | APIError>) {
    const currentConn = Global._database
    if (!currentConn)
        sendErrorResponse(res, GeneralError.DB_CONNECTION_NOT_AVAILABLE)

    return currentConn !== undefined
}

/**
 * Checks if given types are the same as in the body
 * @param _req NextJS request object
 * @param res NextJS response object
 * @returns If the check succeeded
 */
function checkTypes<T>(req: NextApiRequest, res: NextApiResponse<T | APIError>, typeCheck: TypeCheckInterface[]) {
    const body = req.body

    const invalidFields: string[] = []
    typeCheck.forEach(element => {
        const { name, type } = element
        const value = body[name]

        if (type !== value)
            invalidFields.push(name)
    })

    if (invalidFields.length !== 0)
        sendErrorResponse(res, {
            error: FormattedError.INVALID_TYPES,
            invalidTypeFields: invalidFields.join(", ")
        })

    return invalidFields.length === 0
}

export async function runChecks<T, X extends string>({ method, requiredFields, checks, ip, typeCheck }: CheckArguments<X>, req: NextApiRequest, res: NextApiResponse<T>) {
    const noIPLength = 5
    const withIPLength = 6 // Just noIPLength plus one, but cant do that bc typescript

    const funcLength = ip ? withIPLength : noIPLength
    const functions: IFunctions<typeof withIPLength> = [
        checkMethod,
        checkBody,
        checkTypes,
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
            typeCheck
        ],
        [],
        [
            checks
        ],
        []
    ]

    let valid = true
    for (let i = 0; i < funcLength; i++) {
        const func = functions[i]
        const args = functionArgs[i]

        valid = await func(...args, req, res)

        //Breaking because multiple responses could be sent
        if (!valid)
            break
    }

    return valid
}