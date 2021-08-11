export enum FormattedError {
    FIELDS_NOT_AVAILABLE = -1,
    INVALID_BODY_LENGTH = -2,
    METHOD_NOT_ALLOWED = -3,
    RATE_LIMITED = -4,
    INVALID_TYPES = -5
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
    USER_EXISTS,
    PASSWORD_TOO_LONG,
    CANT_DECRYPT_PASSWORD,
    CANT_GENERATE_RSA_KEYPAIR,
    CANT_HASH_PASSWORD,
    CANT_ENCRYPT_PRIVATE_KEY,
    CANT_GENERATE_IV,
    USER_CREATION_ERROR,
    CANT_GENERATE_TFA_SECRET,
    CANT_ENCRYPT_TFA_SECRET,
    ERROR_ADDING_ENCRYPTION_KEY,
    OTP_NO_USER,
    TFA_ALREADY_VERIFIED,
    INVALID_CREDENTIALS,
    CANT_DECRYPT_TFA_SECRET,
    WRONG_TFA_CODE,
    CANT_ADD_LOGIN_TOKEN,
    INVALID_LOGIN_TOKEN,
    LOGIN_TOKEN_USER_NOT_FOUND,
    ENCRYPTION_CONFLICT_CHECK_TFA,
    UNKNOWN_ERROR
}

type ErrorCodes = FormattedError | GeneralError
export default ErrorCodes