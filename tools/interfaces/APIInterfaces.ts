import { ScreamingSnakeCase } from "type-fest"
import { Merge } from "type-fest"
import ErrorCodes from "./error-codes"

export interface ErrorResponse {
    error: ErrorCodes,
    message: string
}

export interface EncryptionKeyResponse {
    publicKey: string
}

export interface EncryptionTokenBody {
    username: string
}

export interface CheckInterface {
    name: string,
    maxLength: number
}

/**
 * Make sure that Method name is in SCREAMING CASE
 */
export type AvailableMethods<T extends string> = "GET" | "HEAD" | "POST"
    | "PUT" | "DELETE" | "CONNECT"
    | "OPTIONS" | "TRACE" | ScreamingSnakeCase<T>

export interface ValueInterface<T> {
    name: string,
    value: T
}

export type MaxLengthInterface = Merge<ValueInterface<string>, { maxLength: number }>