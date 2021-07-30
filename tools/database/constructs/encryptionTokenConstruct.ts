//* Always import reflect-metadata when working with db stuff
import "reflect-metadata";

import { Repository } from "typeorm";
import { EncryptionTokenSQL } from "../entities/EncryptionToken";
import debugConstr from "debug"
import { getTokenExpiration } from "../../util";

const debug = debugConstr("Encryption Repo")
const tokenExpiration = getTokenExpiration()


export class EncryptionTokenConstruct {
    private repo: Repository<EncryptionTokenSQL>

    constructor(repo: Repository<EncryptionTokenSQL>) {
        this.repo = repo
    }

    public getToken(username: string) {
        debug(`Finding token of user ${username}`)
        return this.repo.findOne({ username })
    }

    public async addToken({username, ip, token}: EncryptionTokenSQL) {
        const exists = await this.exists(username)
        if (exists)
            return EncryptionResult.TOKEN_ALREADY_GENERATED

        debug(`Adding token of user ${username}`)
        const sql = new EncryptionTokenSQL();
        sql.token = token
        sql.username = username
        sql.ip = ip

        await this.repo.save(sql)

        setTimeout(() => {
            this.removeToken(username)
        }, tokenExpiration)
        return EncryptionResult.SUCCESS
    }

    public async removeToken(username: string) {
        debug(`Deleting token of user ${username}`)
        const deletionRes = await this.repo.delete({
            username: username
        })

        return deletionRes.affected !== 0
    }

    public async exists(username: string) {
        const res = await this.repo.findOne({ username })
        return res ? true : false
    }
}

export enum EncryptionResult {
    SUCCESS = 0,
    USERNAME_EXISTS = 1,
    TOKEN_ALREADY_GENERATED = 2
}