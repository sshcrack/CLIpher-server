import { nanoid } from 'nanoid';
import { authenticator } from 'otplib';
import prettyMS from 'pretty-ms';
import { Logger } from '../logger';
import { getTime } from '../util';

const log = Logger.getLogger("Crypto", "TFA")
export class TFA {
    static generateSecret() {
        const currLog = log.scope(nanoid())
        const start = getTime()

        currLog.await("🕒 Generating secret...")

        const secret = authenticator.generateSecret()
        const diff = prettyMS(getTime() - start)

        currLog.success(`🔑 Secret generated after ${diff}`)
        return secret
    }
}