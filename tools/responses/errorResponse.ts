import { NextApiResponse } from "next";
import { ErrorResponse } from "../interfaces/APIInterfaces";
import ErrorCodes, { GeneralErrorList } from "../interfaces/error-codes";
import HttpStatusCode from "../interfaces/status-codes";

/**
 * Sends an error response to the client
 * @param res NextJS Response
 * @param inputType The error that should be sent
 */
export function sendErrorResponse<T>(res: NextApiResponse<T | ErrorResponse>, inputType: ErrorOptions | ErrorCodes) {
    const options = typeof inputType === "object" ? inputType : { error: inputType } as ErrorOptions
    const generalErrors: APIErrorExtended[] = [
        {
            error: ErrorCodes.SOCKET_CLOSED,
            status: HttpStatusCode.BAD_REQUEST,
            message: "Socket hang up"
        },
        {
            error: ErrorCodes.REQUESTED_FROM_OTHER_IP,
            status: HttpStatusCode.FORBIDDEN,
            message: "A Encryption key has already been requested from another ip"
        },
        {
            error: ErrorCodes.TYPE_NOT_FOUND,
            status: HttpStatusCode.INTERNAL_SERVER_ERROR,
            message: "The consumation type for the rate limiter has not been found."
        },
        {
            error: ErrorCodes.LIMITER_NOT_AVAILABLE,
            status: HttpStatusCode.INTERNAL_SERVER_ERROR,
            message: "Limiter is not available. Please inform the developers of this tool under https://github.com/sshcrack/CLIpher-server"
        }
    ]

    let response = generalErrors[options.error]

    // TODO I don't like how this is done at  all, but I don't know a better way :(
    switch (options.error) {
        case ErrorCodes.METHOD_NOT_ALLOWED:
            response = {
                error: options.error,
                status: HttpStatusCode.METHOD_NOT_ALLOWED,
                message: `${options.method} Method not allowed`
            }
            break;

        case ErrorCodes.INVALID_BODY_LENGTH:
            response = {
                error: ErrorCodes.INVALID_BODY_LENGTH,
                status: HttpStatusCode.BAD_REQUEST,
                message: `Invalid length of the following fields: ${options.invalidFields}`
            }
            break;
        
        case ErrorCodes.FIELDS_NOT_AVAILABLE:
            response = {
                error: ErrorCodes.FIELDS_NOT_AVAILABLE,
                status: HttpStatusCode.BAD_REQUEST,
                message: `Required fields not available: ${options.missing}`
            }
            break;

        
        default:
            break;
    }

    res.status(response.status).json({
        error: response.error,
        message: response.message
    })
}

interface FieldsNotAvailable {
    error: ErrorCodes.FIELDS_NOT_AVAILABLE,
    missing: string
}

interface MethodNotAllowed {
    error: ErrorCodes.METHOD_NOT_ALLOWED,
    method: string | undefined
}

interface InvalidBodyLength {
    error: ErrorCodes.INVALID_BODY_LENGTH,
    invalidFields: string
}

interface GeneralError {
    error: GeneralErrorList
}

interface APIErrorExtended {
    error: ErrorCodes,
    status: HttpStatusCode,
    message: string
}

type ErrorOptions = MethodNotAllowed  | InvalidBodyLength|
                    FieldsNotAvailable| GeneralError