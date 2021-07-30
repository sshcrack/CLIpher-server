import { Database } from "./util";

export class Global {
    static _database: Database | undefined;
    static async getDatabase() {
        if(this._database)
            return this._database

        const database = new Database()
        await database.getConnection()

        this._database = database
        return database
    }
}