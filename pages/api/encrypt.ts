import { NextApiRequest, NextApiResponse } from 'next';
import { AES } from '../../tools/crypto/AES';
import { Logger } from '../../tools/logger';

const log = Logger.getLogger("API", "Encrypt")
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    const { plain, password } = req.query ?? {}
    if(typeof plain !== "string" || typeof password !== "string")
        return res.status(400).send("Missing parameter: encrypted")

    log.info("plain", plain, "password", password)
    const encrypted = await AES.encrypt({ plain: plain, password: password })

    res.json({encrypted: encrypted})
}