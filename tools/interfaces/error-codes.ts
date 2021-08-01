export enum FormattedError {
    FIELDS_NOT_AVAILABLE,
    INVALID_BODY_LENGTH,
    METHOD_NOT_ALLOWED,
    RATE_LIMITED,
    USER_EXISTS,
}

export enum GeneralError {
    DB_CONNECTION_NOT_AVAILABLE,
    ERROR_GENERATING_KEY_PAIR,
    LIMITER_NOT_AVAILABLE,
    REQUESTED_FROM_OTHER_IP,
    SOCKET_CLOSED,
    TOKEN_NOT_FOUND,
    TYPE_NOT_FOUND,
    USERNAME_OR_PASSWORD_NOT_GIVEN,
    USER_EXISTS
}

type ErrorCodes = FormattedError | GeneralError
export default ErrorCodes