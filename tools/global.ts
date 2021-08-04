import { Connection } from 'typeorm';
import { Database } from "./database";
import { Logger } from './logger';
import NodeCache from "node-cache"

export class Global {
    static _database: Database | undefined

    //Cache passwords for max one minute
    static cache = new NodeCache({ stdTTL: 60 })

    //* This promise to prevent from not initializing the database
    static _prom: Promise<Connection | undefined> | undefined

    static async getDatabase() {
        if (this._prom)
            await this._prom

        if (this._database)
            return this._database

        const database = new Database()
        this._database = database

        const prom = database.getConnection()
        this._prom = prom

        const promRes = await prom
        if (promRes === undefined) {
            this._database = undefined
            return undefined
        }
        this._prom = undefined

        return database
    }
}

const log = Logger.getLogger("Global")

log.await("Initializing database...")
Global.getDatabase()