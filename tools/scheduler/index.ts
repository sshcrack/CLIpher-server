import { Database } from "../database"
import cron from "node-cron"

export class Scheduler {
    static _instance = new Scheduler();
    private alreadyScheduled = false
    private taskRunning = false;

    static schedule(db: Database) {
        Scheduler._instance.schedulesDeletions(db);
    }

    public schedulesDeletions({ EncryptionKey, LoginToken, AccessToken }: Database) {
        if(this.alreadyScheduled)
            return

        this.alreadyScheduled = true
        cron.schedule("*/30 * * * * *", () => {
            if(this.taskRunning)
                return

            this.taskRunning = true
        })
    }
}