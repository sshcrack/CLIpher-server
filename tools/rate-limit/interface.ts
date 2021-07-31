
export enum ConsumeType {
    EncryptionKey = "EncryptionKey",
    Register = "Register",
    TFA = "TFA"
}

export interface CostInterface {
    cost: number,
    retries: number
}