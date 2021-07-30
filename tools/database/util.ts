console.log("Reflect imported")
import "reflect-metadata";
import { eval as mathEval } from "math-expression-evaluator";
import { NextApiRequest, NextApiResponse } from "next";
import { Connection, createConnection, Repository } from "typeorm";
import { AvailableMethods, ErrorResponse } from "../interfaces/APIInterfaces";
import ErrorCodes from "../interfaces/error-codes";
import HttpStatusCode from "../interfaces/status-codes";
import { EncryptionTokenConstruct } from "./constructs/encryptionTokenConstruct";
console.log("Import from Util")
import { AccountSQL } from "./entities/Account";
import { EncryptionTokenSQL } from "./entities/EncryptionToken";

const {
    DATABASE_TYPE,
    DATABASE_HOST, DATABASE_PORT,
    DATABASE_USERNAME, DATABASE_PASSWORD,
    DATABASE_DATABASE
} = process.env;

export class Database {
    private connection: Connection
    private encryptionTokenRepo: Repository<EncryptionTokenSQL>

    public encryptionToken: EncryptionTokenConstruct;
    async getConnection() {

        if (this.connection)
            return this.connection

        this.connection = await createConnection({
            type: DATABASE_TYPE ?? "postgres" as any,
            host: DATABASE_HOST ?? "localhost",
            port: parseInt(DATABASE_PORT ?? "5432"),
            username: DATABASE_USERNAME ?? "postgres",
            password: DATABASE_PASSWORD ?? "admin",
            database: DATABASE_DATABASE ?? "website",
            synchronize: true,
            logging: ["error", "warn", "info"],
            logger: "debug",
            entities: [AccountSQL, EncryptionTokenSQL]
        })

        this.encryptionTokenRepo = this.connection.getRepository(EncryptionTokenSQL)
        this.encryptionToken = new EncryptionTokenConstruct(this.encryptionTokenRepo)

        return this.connection
    }
}

export function getTokenExpiration() {
    const { GENERATE_TOKEN_EXPIRATION } = process.env
    if (!GENERATE_TOKEN_EXPIRATION) {
        console.log("No token expiration given.")
        process.exit(-2)
    }
    // Typings are wrong, converting string to number
    const tokenExpiration = mathEval(GENERATE_TOKEN_EXPIRATION) as any as number

    return tokenExpiration
}

/**
 * Sends a Bad Request Status code if the given method does not match the requested one
 * @param method The method that is allowed
 * @param req Request object from nextjs handler
 * @param res Response object from nextjs handler
 * @returns If the given method matches the request method
 */
export function checkMethod<T>(method: AvailableMethods, req: NextApiRequest, res: NextApiResponse<T | ErrorResponse>) {
    if(req.method === method)
        return true
    
    const status = res.status(HttpStatusCode.BAD_REQUEST)
    status.json({
        error: ErrorCodes.METHOD_NOT_ALLOWED,
        message: `${method} Method not allowed`
    })

    return false
}

export function checkBody<T>(requiredFields: string[], req: NextApiRequest, res: NextApiResponse<T | ErrorResponse>) {
    const body = req.body
    const keys = Object.keys(body)

    const notIncluded: string[] = []
    requiredFields.forEach(field => {
        const includesField = keys.includes(field)
        if(!includesField)
            notIncluded.push(field)
    })

    const matches = notIncluded.length === 0
    if(matches)
        return true

    const status = res.status(HttpStatusCode.BAD_REQUEST)
    status.json({
        error: ErrorCodes.METHOD_NOT_ALLOWED,
        message: `Required field not available: ${notIncluded.join(", ")}`
    })

    return false
}

export function getTime() {
    return new Date().getTime()
}