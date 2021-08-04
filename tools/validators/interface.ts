import { FixedLengthArray, ValueOf } from "type-fest";
import { AvailableMethods, CheckInterface } from "../interfaces/APIInterfaces";

export interface CheckArguments<X extends string> {
    method: AvailableMethods<X>,
    requiredFields: string[],
    checks: CheckInterface[],
    typeCheck: TypeCheckInterface[]
    ip?: boolean
}

export type CheckArgumentType<X extends string> = ValueOf<CheckArguments<X>>
export type TypeCheckInterface = {
    name: string,
    type: TypeOfResults
}

export type TypeOfResults = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"
export type IFunctionArgs<T extends number, X extends string> = FixedLengthArray<CheckArgumentType<X>[], T>
export type IFunctions<T extends number> = FixedLengthArray<Function, T>
