//! Reflect Metadata must be kept at top
import "reflect-metadata";

import debugConstr from "debug";
import { Connection, createConnection, getConnection, getRepository } from "typeorm";
import { EncryptionKeyConstruct } from "./constructs/encryptionKeyConstruct";
import { EncryptionKeySQL } from "./entities/EncryptionToken";
import { UserSQL } from "./entities/User";
import { UserConstruct } from "./constructs/userConstruct"





const debug = debugConstr("Database")
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
    private connectionPromise: Promise<Connection | undefined>
    private connection: Connection | void

    public EncryptionKey: EncryptionKeyConstruct;
    public User: UserConstruct;

    /**
     * Establishes a connection to the database or returns the existing connection
     * @note This is just a wrapper of an internal function to prevent multiple instances connecting
     * @returns a connection to the database
     */
    async getConnection() {
        if (this.connectionPromise) {
            debug("⏰ There's already a connection in process. Waiting for it to finish")
            await this.connectionPromise
        }

        const prom = this.getConnectionPromise()
        this.connectionPromise = prom;

        const res = await prom;
        return res;
    }

    /**
     * 
     * @returns A promise of the conn
     */
    private async getConnectionPromise() {
        if (this.connection)
            return this.connection

        let oldConnection: Connection | undefined;
        try {
            oldConnection = getConnection()
        } catch (e) {
            //Swallowing error because we are just checking if the connection exists
        }

        if (oldConnection) {
            debug("👋 Closing connection")
            await oldConnection.close().catch(e => debug("💥 Couldn't close connection", e.message))
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
            entities: [UserSQL, EncryptionKeySQL]
        }).catch(e => debug("💥 Database connection failed", e.message))

        if (!this.connection)
            return undefined

        debug("💾 Established connection!")
        debug("⏱ Initializing repositories...")
        this.EncryptionKey = new EncryptionKeyConstruct(getRepository(EncryptionKeySQL))
        this.User = new UserConstruct(getRepository(UserSQL))

        debug("📕 Repositories initialized.")
        return this.connection
    }
}