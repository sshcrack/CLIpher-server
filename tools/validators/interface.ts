import { FixedLengthArray, ValueOf } from "type-fest";
import { AvailableMethods, CheckInterface } from "../interfaces/APIInterfaces";

export interface CheckArguments<X extends string> {
    method: AvailableMethods<X>,
    requiredFields: string[],
    checks: CheckInterface[],
    ip?: boolean
}

export type CheckArgumentType<X extends string> = ValueOf<CheckArguments<X>>



export type IFunctionArgs<T extends number, X extends string> = FixedLengthArray<CheckArgumentType<X>[], T>
export type IFunctions<T extends number> = FixedLengthArray<Function, T>
