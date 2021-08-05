import { nanoid } from 'nanoid';
import prettyMS from 'pretty-ms';
import { FindConditions, ObjectID, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Logger } from '../../logger';
import { getTime } from '../../util';
import { AccessTokenSQL } from '../entities/AccessToken';
import { LoginTokenSQL } from '../entities/LoginToken';

const log = Logger.getLogger("Repository", "LoginToken")

export class AccessTokenConstruct {
    private repo: Repository<AccessTokenSQL>

    constructor(repo: Repository<AccessTokenSQL>) {
        this.repo = repo;
    }

    public get(token: string) {
        return this.repo.findOne({ token });
    }

    /**
     * Adds a new login token to the database
     * @param loginToken The sql to add to the database
     * @returns If the login token as added successfully
     */
    public async add(loginToken: AccessTokenSQL): Promise<boolean> {
        return new Promise(resolve => {
            const { username } = loginToken

            const currLog = log.scope(nanoid())
            const start = getTime()

            currLog.await("🕒 Adding access token for user", username, "...")
            this.repo.save(loginToken).then(() => {
                const diff = prettyMS(getTime() - start)

                currLog.success("👤 Added access token of user", loginToken.username, "after", diff)
                resolve(true)
            }).catch(err => {
                const diff = prettyMS(getTime() - start)

                currLog.error("💥 DB Error", err.message, "after", diff, "Code:", err.code)
                resolve(false)
            });
        });
    }

    public async update(criteria: UpdateCriteria, update: QueryDeepPartialEntity<LoginTokenSQL>): Promise<boolean> {
        return new Promise(resolve => {
            const currLog = log.scope(nanoid())
            const start = getTime()

            currLog.start("Updating Access token", criteria, "...")
            this.repo.update(criteria, update).then(res => {
                const success = res.affected !== 0
                const diff = prettyMS(getTime() - start)
                if (!success)
                    currLog.error("💥 No rows affected after", diff)

                currLog.success("Updated successfully after", diff)
                resolve(true)
            }).catch(e => {
                const diff = prettyMS(getTime() - start)
                currLog.error(`💥 An Error occurred after ${diff}: `, e.message)

                resolve(false)
            })
        });
    }

    public async exists(username: string) {
        const user = await this.get(username)

        return user !== null && user !== undefined;
    }

    public async remove(token: string, username: string) {
        const currLog = log.scope(nanoid())
        const start = getTime()

        currLog.await(`🕒 Deleting access token of user ${username}`)
        const deletionRes = await this.repo.delete({
            token: token,
            username: username
        })

        const successful = deletionRes.affected !== 0
        const diff = prettyMS(getTime() - start)

        successful ?
            currLog.success("🗑️ Removed access token after", diff) :
            currLog.error("💥 Failed to delete access token after", diff)

        return successful
    }

    public deleteExpired() {
        return this
            .repo
            .createQueryBuilder()
            .delete()
            .from(AccessTokenSQL)
            .where("expiresAt <= :expiresAt", { expiresAt: new Date() })
            .execute()
    }
}

export type UpdateCriteria = string | number | Date | ObjectID | string[] | number[] | Date[] | ObjectID[] | FindConditions<AccessTokenSQL>