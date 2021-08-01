enum ErrorCodes {
    METHOD_NOT_ALLOWED,
    USERNAME_OR_PASSWORD_NOT_GIVEN,
    SOCKET_CLOSED,
    REQUESTED_FROM_OTHER_IP,
    INVALID_BODY_LENGTH,
    DB_CONNECTION_NOT_AVAILABLE,
    TYPE_NOT_FOUND,
    RATE_LIMITED,
    FIELDS_NOT_AVAILABLE,
    LIMITER_NOT_AVAILABLE
}

export type GeneralErrorList = ErrorCodes.DB_CONNECTION_NOT_AVAILABLE | ErrorCodes.REQUESTED_FROM_OTHER_IP 
                               ErrorCodes.SOCKET_CLOSED | ErrorCodes.TYPE_NOT_FOUND |
                               ErrorCodes.USERNAME_OR_PASSWORD_NOT_GIVEN |
                               ErrorCodes.LIMITER_NOT_AVAILABLE

export default ErrorCodes