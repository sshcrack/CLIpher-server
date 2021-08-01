import { Database } from "./database";
import debugConstr from "debug"

const debug = debugConstr("Global")
export class Global {
    static _database: Database | undefined

    static async getDatabase() {
        if(this._database)
            return this._database

        const database = new Database()
        this._database = database
        await database.getConnection()

        return database
    }
}

debug("Initializing database...")
Global.getDatabase()