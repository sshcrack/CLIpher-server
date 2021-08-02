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
    },
    {
        error: GeneralError.PASSWORD_TOO_LONG,
        status: HttpStatusCode.BAD_REQUEST,
        message: "Password must be less than or equal to 128 characters."
    },
    {
        error: GeneralError.CANT_DECRYPT_PASSWORD,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Could not decrypt the password."
    },
    {
        error: GeneralError.CANT_GENERATE_RSA_KEYPAIR,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Could not generate the rsa key pair."
    },
    {
        error: GeneralError.CANT_HASH_PASSWORD,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Could not hash password"
    },
    {
        error: GeneralError.CANT_ENCRYPT_PRIVATE_KEY,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Cant encrypt private key"
    },
    {
        error: GeneralError.CANT_GENERATE_IV,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Could not generate the IV"
    },
    {
        error: GeneralError.USER_CREATION_ERROR,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Could not create user."
    },
    {
        error: GeneralError.CANT_GENERATE_TFA_SECRET,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Could not generate the TFA secret."
    },
    {
        error: GeneralError.CANT_ENCRYPT_TFA_SECRET,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Could not encrypt the TFA secret."
    },
    {
        error: GeneralError.ERROR_ADDING_ENCRYPTION_KEY,
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: "Could not add the encryption key"
    }
]

interface APIErrorExtended {
    error: ErrorCodes,
    status: HttpStatusCode,
    message: string
}