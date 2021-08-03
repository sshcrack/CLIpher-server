import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes";
import { nanoid } from 'nanoid';
import prettyMS from 'pretty-ms';
import { Repository } from 'typeorm';
import { Logger } from '../../logger';
import { getTime } from '../../util';
import { UserSQL } from '../entities/User';

const log = Logger.getLogger("Repository", "User")
export class UserConstruct {
    private repo: Repository<UserSQL>


    constructor(repo: Repository<UserSQL>) {
        this.repo = repo;
    }

    public getByUsername(username: string) {
        return this.repo.findOne({ username });
    }

    public async add(userSQL: UserSQL): Promise<UserRepoResult> {
        return new Promise(resolve => {
            const currLog = log.scope(nanoid())
            const start = getTime()

            currLog.await("🕒 Adding User", userSQL.username, "...")
            this.repo.save(userSQL).then(() => {
                const diff = prettyMS(getTime() - start)

                currLog.success("👤 Added User", userSQL.username, "after", diff)
                resolve(UserRepoResult.SUCCESS)
            }).catch(err => {
                const diff = prettyMS(getTime() - start)

                if (err.code === PG_UNIQUE_VIOLATION) {
                    currLog.warn(`⚠ User`, userSQL.username, "already exists. Result after", diff)

                    resolve(UserRepoResult.EXISTS)
                    return
                }

                currLog.error("💥 DB Error", err.message, "after", diff, "Code:", err.code)
                resolve(UserRepoResult.ERROR)
            });
        });
    }

    public async exists(username: string) {
        const user = await this.getByUsername(username)

        return user !== null && user !== undefined;
    }
}

export enum UserRepoResult {
    SUCCESS,
    ERROR,
    EXISTS
}