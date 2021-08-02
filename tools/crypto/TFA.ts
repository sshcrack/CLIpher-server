import { authenticator } from 'otplib';
import debugConstr from 'debug';

const debug = debugConstr("Crypto:TFA")
export class TFA {
    static generateSecret() {
        debug("🕒 Generating secret...")
        const secret = authenticator.generateSecret()

        debug("🔑 Secret generated")
        return secret
    }
}