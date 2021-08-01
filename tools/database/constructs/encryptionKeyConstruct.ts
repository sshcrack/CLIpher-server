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

    //Ids of scheduled key removal functions
    private TimeoutIDs: { [key: string]: NodeJS.Timeout } = {}

    constructor(repo: Repository<EncryptionKeySQL>) {
        this.repo = repo
    }

    public getKey(username: string) {
        debug(`Finding token of user ${username}`)
        return this.repo.findOne({ username })
    }

    public async addKey(toSave: EncryptionKeySQL) {
        const { username } = toSave
        const exists = await this.exists(username)

        if (exists)
            return EncryptionResult.TOKEN_ALREADY_GENERATED

        debug(`🔑 Adding token of user ${username}`)
        await this.repo.save(toSave)
        
        const currSchedule = this.TimeoutIDs[username]
        if(currSchedule)
            clearTimeout(currSchedule)

        this.TimeoutIDs[username] = setTimeout(async () => {
            const removeRes = await this.removeKey(username)

            if(!removeRes)
                debug("🥴 Failed to remove key")
        }, tokenExpiration)
        
        return EncryptionResult.SUCCESS
    }

    public async removeKey(username: string) {
        debug(`🗑️ Deleting key of user ${username}`)
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