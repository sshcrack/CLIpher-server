import { RateLimiterMemory } from "rate-limiter-flexible";

export enum ConsumeType {
    EncryptionKey,
    Register,
    VerifyTFA,
}

export interface CostInterface<T> {
    type: T,
    retries: number,
    limiter?: RateLimiterMemory
}