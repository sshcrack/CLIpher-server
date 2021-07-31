//* Always import reflect-metadata when working with db stuff
import "reflect-metadata";

import { Repository } from "typeorm";
import { EncryptionKeySQL } from "../entities/EncryptionToken";
import debugConstr from "debug"
import { getKeyExpiration } from "../../util";

const debug = debugConstr("Encryption Key Repo")
const tokenExpiration = getKeyExpiration()


export class EncryptionKeyConstruct {
    private repo: Repository<EncryptionKeySQL>

    constructor(repo: Repository<EncryptionKeySQL>) {
        this.repo = repo
    }

    public getKey(username: string) {
        debug(`Finding token of user ${username}`)
        return this.repo.findOne({ username })
    }

    public async addKey({ username, ip, key, priv }: EncryptionKeySQL) {
        const exists = await this.exists(username)
        if (exists)
            return EncryptionResult.TOKEN_ALREADY_GENERATED

        debug(`Adding token of user ${username}`)
        const toSave = {
            username,
            ip,
            key,
            priv
        }

        await this.repo.save(toSave)

        setTimeout(() => {
            this.removeKey(username)
        }, tokenExpiration)
        return EncryptionResult.SUCCESS
    }

    public async removeKey(username: string) {
        debug(`Deleting key of user ${username}`)
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