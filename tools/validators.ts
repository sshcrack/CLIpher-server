import debugConstr from "debug";
import { NextApiRequest, NextApiResponse } from "next";
import { AvailableMethods, CheckInterface, ErrorResponse } from "./interfaces/APIInterfaces";
import ErrorCodes from "./interfaces/error-codes";
import HttpStatusCode from "./interfaces/status-codes";

const debug = debugConstr("Validators")

/**
 * Checks if the request body met the requirements
 * @param req The request object
 * @param toCheck What objects to check the length of
 * @returns Weither the requirements met or not
 */
export function checkMaxLength<T>(req: NextApiRequest, toCheck: CheckInterface<T>[]) {
    const body = req.body

    let requirementsMet = true
    toCheck.forEach(curr => {
        const { name, maxLength } = curr
        const currValue = body[name]

        if (!currValue.length)
            return debug("Couldn't check field", name, ": length property not found ")

        if (currValue.length <= maxLength)
            return

        requirementsMet = false
    })

    return requirementsMet
}


/**
 * Sends a Bad Request Status code if the given method does not match the requested one
 * @param method The method that is allowed
 * @param req Request object from nextjs handler
 * @param res Response object from nextjs handler
 * @returns If the given method matches the request method
 */
export function checkMethod<T>(method: AvailableMethods, req: NextApiRequest, res: NextApiResponse<T | ErrorResponse>) {
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