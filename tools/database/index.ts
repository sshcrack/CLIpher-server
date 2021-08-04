//! Reflect Metadata must be kept at top
import "reflect-metadata";

import prettyMS from 'pretty-ms';
import { Connection, createConnection, getConnection, getRepository } from "typeorm";
import { Logger } from '../logger';
import { getTime } from '../util';
import { EncryptionKeyConstruct } from "./constructs/encryptionKeyConstruct";
import { AccessTokenConstruct } from "./constructs/accessTokenConstruct";
import { UserConstruct } from "./constructs/userConstruct";
import { LoginTokenConstruct } from "./constructs/loginTokenConstruct";
import { EncryptionKeySQL } from "./entities/EncryptionToken";
import { UserSQL } from "./entities/User";
import { LoginTokenSQL } from "./entities/LoginToken";
import { AccessTokenSQL } from './entities/AccessToken';
import { resolveHref } from 'next/dist/next-server/lib/router/router';



const log = Logger.getLogger("Database")
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
    public LoginToken: LoginTokenConstruct;
    public AccessToken: AccessTokenConstruct;
    public User: UserConstruct;

    /**
     * Establishes a connection to the database or returns the existing connection
     * @note This is just a wrapper of an internal function to prevent multiple instances connecting
     * @returns a connection to the database
     */
    async getConnection() {
        if (this.connectionPromise) {
            log.await("⏰ There's already a connection in process. Waiting for it to finish")
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
            log.star("👋 Closing connection")
            await oldConnection.close().catch(e => log.error("💥 Couldn't close connection", e.message))
        }

        const start = getTime()

        log.await("⏱ Establishing connection...")
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
            entities: [UserSQL, EncryptionKeySQL, LoginTokenSQL, AccessTokenSQL]
        }).catch(e => log.fatal("💥 Database connection failed", e.message))

        if (!this.connection)
            return undefined

        const diff = prettyMS(getTime() - start)
        log.success(`💾 Established connection after ${diff}!`)

        log.await("⏱ Initializing repositories...")
        const startRepo = getTime()

        try {
            this.EncryptionKey = new EncryptionKeyConstruct(getRepository(EncryptionKeySQL))
            this.User = new UserConstruct(getRepository(UserSQL))
            this.LoginToken = new LoginTokenConstruct(getRepository(LoginTokenSQL))
            this.AccessToken = new AccessTokenConstruct(getRepository(AccessTokenSQL))
        } catch (e) {
            const diffRepo = prettyMS(getTime() - startRepo)
            log.fatal("💥 Couldn't initialize repositories after", diffRepo, "Error: ", e.message)

            return undefined;
        }


        const diffRepo = prettyMS(getTime() - startRepo)
        log.success(`📕 Repositories initialized after ${diffRepo}`)
        return this.connection
    }
}