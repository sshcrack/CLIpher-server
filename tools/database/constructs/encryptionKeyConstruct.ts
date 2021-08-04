//* Always import reflect-metadata when working with db stuff
import "reflect-metadata";

import { nanoid } from 'nanoid';
import prettyMS from 'pretty-ms';
import { FindOperator, LessThanOrEqual, Repository } from "typeorm";
import { Logger } from '../../logger';
import { getKeyExpiration, getTime } from "../../util";
import { EncryptionKeySQL } from "../entities/EncryptionToken";


const log = Logger.getLogger("Repository", "EncryptionKey")
const tokenExpiration = getKeyExpiration()


export class EncryptionKeyConstruct {
    private repo: Repository<EncryptionKeySQL>

    constructor(repo: Repository<EncryptionKeySQL>) {
        this.repo = repo
    }

    public getKey(username: string) {
        log.info(`Finding token of user ${username}`)
        return this.repo.findOne({ username })
    }

    public addKey(toSave: EncryptionKeySQL): Promise<boolean> {
        return new Promise(resolve => {
            const { username } = toSave
            const currLog = log.scope(nanoid())
            const start = getTime()

            currLog.await("🕑 Adding token of user", username, "...")
            this.repo.save(toSave).then(() => {
                const diff = prettyMS(getTime() - start)
                currLog.success("🔑 Added token of user", username, "after", diff)
                resolve(true)
            }).catch(e => {
                const diff = prettyMS(getTime() - start)
                currLog.error("💥 Couldn't add key", e.message, "after", diff)

                resolve(false)
            })
        });
    }

    public async removeKey(username: string) {
        const currLog = log.scope(nanoid())
        const start = getTime()

        currLog.await(`🕒 Deleting key of user ${username}`)
        const deletionRes = await this.repo.delete({
            username: username
        })

        const successful = deletionRes.affected !== 0
        const diff = prettyMS(getTime() - start)

        successful ?
            currLog.success("🗑️ Removed key after", diff) :
            currLog.error("💥 Failed to delete key after", diff)

        return successful
    }

    public async exists(username: string) {
        const res = await this.repo.findOne({ username })
        return res ? true : false
    }

    public async getExpired() {
        console.log("time", new Date(getTime()))
        return this.repo.find({
            where: {
                expiresAt: LessThanOrEqual(new Date(getTime()))
            }
        })
    }
}