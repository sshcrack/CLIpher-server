import "reflect-metadata";

import debugConstr from "debug";
import nerdamer from "nerdamer";
import { NextApiRequest } from "next";
import { Connection, createConnection, getConnection, Repository } from "typeorm";
import { EncryptionTokenConstruct } from "./database/constructs/encryptionTokenConstruct";
import { AccountSQL } from "./database/entities/Account";
import { EncryptionTokenSQL } from "./database/entities/EncryptionToken";

const debug = debugConstr("Util")

//Getting environment variables
const {
    DATABASE_TYPE,
    DATABASE_HOST, DATABASE_PORT,
    DATABASE_USERNAME, DATABASE_PASSWORD,
    DATABASE_DATABASE
} = process.env;

/**
 * @description Datbase class to interact with the database
 */
export class Database {
    private connection: Connection
    private encryptionTokenRepo: Repository<EncryptionTokenSQL>

    public encryptionToken: EncryptionTokenConstruct;
    /**
     * Establishes a connection to the database or returns the existing connection
     * @returns a connection to the database
     */
    async getConnection() {

        if (this.connection)
            return this.connection

        let oldConnection: Connection | undefined;
        try {
            oldConnection = getConnection()
        } catch (e) {
            debug("😵 Could not get connection")
        }

        if (oldConnection) {
            debug("🔌 Closing connection")
            await oldConnection.close()
        }

        debug("⏱ Establishing connection...")
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
        debug("💾 Established connection!")


        //* Initialize repositories
        this.encryptionTokenRepo = this.connection.getRepository(EncryptionTokenSQL)
        this.encryptionToken = new EncryptionTokenConstruct(this.encryptionTokenRepo)

        return this.connection
    }
}

/**
 * Get encryption token expiration time
 * @returns Time in milliseconds
 */
export function getTokenExpiration() {
    const { GENERATE_TOKEN_EXPIRATION } = process.env
    if (!GENERATE_TOKEN_EXPIRATION) {
        console.log("No token expiration given.")
        process.exit(-2)
    }

    const tokenExpiration = nerdamer(GENERATE_TOKEN_EXPIRATION).evaluate()

    const stringResult = tokenExpiration.toDecimal()
    return parseFloat(stringResult)
}
/**
 * Get the current time
 * @returns Current time
 */
export function getTime() {
    return new Date().getTime()
}

export function getIP(req: NextApiRequest) {
    return req.socket.remoteAddress
}