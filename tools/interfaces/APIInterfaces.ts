import ErrorCodes from "./error-codes"

export interface ErrorResponse {
    error: ErrorCodes,
    message: string
}

export interface EncryptionTokenResponse {
    token: string
}

export interface EncryptionTokenBody {
    username: string
}

export interface CheckInterface<T> {
    name: keyof T,
    maxLength: number
}

export type AvailableMethods = "GET"     | "HEAD"   | "POST"
                             | "PUT"     | "DELETE" | "CONNECT"
                             | "OPTIONS" | "TRACE"  | string