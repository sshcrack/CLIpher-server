import { Database } from "../database"
import cron from "node-cron"
import { Logger } from '../logger';
import { AccessTokenSQL } from '../database/entities/AccessToken';

const log = Logger.getLogger("Scheduler");
export class Scheduler {
    static _instance = new Scheduler();
    private alreadyScheduled = false
    private taskRunning = false;

    static schedule(db: Database) {
        Scheduler._instance.schedulesDeletions(db);
    }

    public schedulesDeletions({ EncryptionKey, LoginToken, AccessToken }: Database) {
        if (this.alreadyScheduled)
            return

        this.alreadyScheduled = true

        log.info("⏱ Started scheduler!")
        cron.schedule("*/30 * * * * *", async () => {
            if (this.taskRunning)
                return

            this.taskRunning = true
            const proms = [
                EncryptionKey.deleteExpired(),
                AccessToken.deleteExpired(),
                LoginToken.deleteExpired()
            ]

            Promise.all(proms)
                .then(e => {
                    const total = e.reduce((a, b) => a + (b?.affected ?? 0), 0)
                    if (total === 0)
                        return

                    log.success("🚧 Deleted", total, "expired tokens!")
                })
                .catch(e => log.warn("💥 Couldn't delete expired tokens. Error:", e))

            this.taskRunning = false
        })
    }
}