import { NextApiResponse } from "next";
import { ErrorResponse } from "../interfaces/APIInterfaces";
import ErrorCodes, { FormattedError, GeneralError } from "../interfaces/error-codes";
import HttpStatusCode from "../interfaces/status-codes";
import { ErrorResponseList } from "./responseList"

/**
 * Sends an error response to the client
 * @param res NextJS Response
 * @param inputType The error that should be sent
 */
export function sendErrorResponse<T>(res: NextApiResponse<T | ErrorResponse>, inputType: ErrorOptions | ErrorCodes) {
    const options = typeof inputType === "object" ? inputType : { error: inputType } as ErrorOptions
    const generalErrors = ErrorResponseList

    let response = generalErrors[options.error]

    // TODO I don't like how this is done at  all, but I don't know a better way :(
    switch (options.error) {
        case FormattedError.METHOD_NOT_ALLOWED:
            response = {
                error: options.error,
                status: HttpStatusCode.METHOD_NOT_ALLOWED,
                message: `${options.method} Method not allowed`
            }
            break;

        case FormattedError.INVALID_BODY_LENGTH:
            response = {
                error: FormattedError.INVALID_BODY_LENGTH,
                status: HttpStatusCode.BAD_REQUEST,
                message: `Invalid length of the following fields: ${options.invalidFields}`
            }
            break;

        case FormattedError.FIELDS_NOT_AVAILABLE:
            response = {
                error: FormattedError.FIELDS_NOT_AVAILABLE,
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
    error: FormattedError.FIELDS_NOT_AVAILABLE,
    missing: string
}

interface MethodNotAllowed {
    error: FormattedError.METHOD_NOT_ALLOWED,
    method: string | undefined
}

interface InvalidBodyLength {
    error: FormattedError.INVALID_BODY_LENGTH,
    invalidFields: string
}

interface JustError {
    error: GeneralError
}

type ErrorOptions = MethodNotAllowed | InvalidBodyLength |
    FieldsNotAvailable | JustError