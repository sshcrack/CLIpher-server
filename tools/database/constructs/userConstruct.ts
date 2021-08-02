import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes";
import debugConstr from "debug";
import { Repository } from 'typeorm';
import { UserSQL } from '../entities/User';
import chalk from "chalk"

const debug = debugConstr("Repository:User")
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
            debug("👤 Adding User", userSQL.username, "...")
            this.repo.save(userSQL).then(() => {
                debug("👤 Added User", userSQL.username, "!")

                resolve(UserRepoResult.SUCCESS)
            }).catch(err => {
                if (err.code === PG_UNIQUE_VIOLATION) {
                    debug(`💥 User`, userSQL.username, "already exists.")

                    resolve(UserRepoResult.EXISTS)
                    return
                }

                debug("💥 DB Error", err.message, "Code:", err.code)
                resolve(UserRepoResult.ERROR)
            });
        });
    }

    public async exists(username: string) {
        const user = await this.getByUsername(username)

        debug("User is", user)
        return user !== null && user !== undefined;
    }
}

export enum UserRepoResult {
    SUCCESS,
    ERROR,
    EXISTS
}