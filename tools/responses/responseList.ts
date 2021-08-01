import ErrorCodes, { GeneralError } from '../interfaces/error-codes';
import HttpStatusCode from '../interfaces/status-codes';

export const ErrorResponseList: APIErrorExtended[] = [
    {
        error: GeneralError.DB_CONNECTION_NOT_AVAILABLE,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Could not connect to the database."
    },
    {
        error: GeneralError.ERROR_GENERATING_KEY_PAIR,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Error generating your rsa key pair"
    },
    {
        error: GeneralError.LIMITER_NOT_AVAILABLE,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Limiter is not available. Please inform the developers of this tool under https://github.com/sshcrack/CLIpher-server"
    },
    {
        error: GeneralError.REQUESTED_FROM_OTHER_IP,
        status: HttpStatusCode.FORBIDDEN,
        message: "A Encryption key has already been requested from another ip"
    },
    {
        error: GeneralError.SOCKET_CLOSED,
        status: HttpStatusCode.BAD_REQUEST,
        message: "Socket hang up"
    },
    {
        error: GeneralError.TOKEN_NOT_FOUND,
        status: HttpStatusCode.UNAUTHORIZED,
        message: "An encryption token could not be found for your account."
    },
    {
        error: GeneralError.TYPE_NOT_FOUND,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "The consumation type for the rate limiter has not been found."
    },
    {
        error: GeneralError.USERNAME_OR_PASSWORD_NOT_GIVEN,
        status: HttpStatusCode.BAD_REQUEST,
        message: "Username and password are required to register/login."
    },
    {
        error: GeneralError.USER_EXISTS,
        status: HttpStatusCode.CONFLICT,
        message: "The user already exists."
    }
]

interface APIErrorExtended {
    error: ErrorCodes,
    status: HttpStatusCode,
    message: string
}