import { NextApiRequest, NextApiResponse } from 'next';
import { RSA } from '../../tools/crypto/RSA';
import { Global } from '../../tools/global';
import { GeneralError } from "../../tools/interfaces/error-codes";
import { Logger } from '../../tools/logger';
import { sendErrorResponse } from "../../tools/responses";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    const { hex, username } = req.query ?? {}
    const { EncryptionKey } = await Global.getDatabase() ?? {};

    if(typeof hex !== "string" || typeof username !== "string")
        return res.status(400).send("Missing parameter: encrypted")
    if(!EncryptionKey)
        return sendErrorResponse(res, GeneralError.DB_CONNECTION_NOT_AVAILABLE)

    const token = await EncryptionKey.getKey(username);
    if(!token)
        return sendErrorResponse(res, GeneralError.TOKEN_NOT_FOUND);

    const encrypted = await RSA.decrypt(Buffer.from(hex, "hex").toString(), token.privateKey)

    res.json({encrypted: encrypted})
}