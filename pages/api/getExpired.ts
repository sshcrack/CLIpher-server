import { NextApiRequest, NextApiResponse } from 'next'
import { Global } from '../../tools/global'
import { GeneralError } from '../../tools/interfaces/error-codes'
import { sendErrorResponse } from '../../tools/responses'


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    const { EncryptionKey } = await Global.getDatabase() ?? {}
    if (!EncryptionKey)
        return sendErrorResponse(res, GeneralError.DB_CONNECTION_NOT_AVAILABLE)

    const expired = EncryptionKey.getExpired()

    res.json(expired)
}
