import debugConstr from "debug";
import { Connection } from 'typeorm';
import { Database } from "./database";

const debug = debugConstr("Global")
export class Global {
    static _database: Database | undefined

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

        await prom
        this._prom = undefined

        return database
    }
}

debug("Initializing database...")
Global.getDatabase()