//! Reflect Metadata must be kept at top
import "reflect-metadata";

import debugConstr from "debug";
import { promises as fs } from "fs";
import { Connection, createConnection, getConnection, Repository } from "typeorm";
import { EncryptionKeyConstruct } from "./constructs/encryptionKeyConstruct";
import { AccountSQL } from "./entities/Account";
import { EncryptionKeySQL } from "./entities/EncryptionToken";



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
    private connection: Connection | void
    private encryptionKeyRepo: Repository<EncryptionKeySQL>

    public encryptionKey: EncryptionKeyConstruct;
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
            entities: [AccountSQL, EncryptionKeySQL]
        }).catch(e => debug("🥴 Database connection failed", e))

        if (!this.connection)
            return undefined

        debug("💾 Established connection!")
        debug("⏱ Initializing repositories...")
        this.encryptionKeyRepo = this.connection.getRepository(EncryptionKeySQL)
        this.encryptionKey = new EncryptionKeyConstruct(this.encryptionKeyRepo)

        debug("📕 Repositories initialized.")
        return this.connection
    }
}