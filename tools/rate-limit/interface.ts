import { RateLimiterMemory } from "rate-limiter-flexible";

export enum ConsumeType {
    EncryptionKey,
    Register,
    VerifyTFA,
    Login,
    CheckTFA
}

export interface CostInterface<T> {
    type: T,
    retries: number,
    limiter?: RateLimiterMemory
}