import { NextApiRequest, NextApiResponse } from 'next'
import { RSA } from '../../../tools/crypto/RSA'
import { Global } from '../../../tools/global'
import { APIError } from '../../../tools/interfaces/APIInterfaces'
import { GeneralError } from '../../../tools/interfaces/error-codes'
import { RateLimit } from '../../../tools/rate-limit'
import { ConsumeType } from '../../../tools/rate-limit/interface'
import { sendErrorResponse } from '../../../tools/responses'
import { getIP } from '../../../tools/util'
import { runChecks } from '../../../tools/validators'

type RegisterResponse = {
  encryptedTFASecret: string,
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse | APIError>
) {
  const userIP = getIP(req)
  const { username, password, publicKey, encryptedPrivateKey } = req.body ?? {}
  const { User, EncryptionKey } = await Global.getDatabase()

  const isRateLimited = await RateLimit.consume(ConsumeType.Register, req, res)
  if (isRateLimited)
    return

  const responseValid = runChecks({
    method: "POST",
    requiredFields: ["username, password", "publicKey", "encryptedPrivateKey"],
    ip: true,
    checks: [{
      name: "username",
      maxLength: 32
    }],
  }, req, res)

  if (!responseValid || !userIP)
    return;

  const token = await EncryptionKey.getKey(username)
  if (!token)
    return sendErrorResponse(res, GeneralError.TOKEN_NOT_FOUND)

  const user = await User.getByUsername(username)
  if (!user)
    return sendErrorResponse(res, GeneralError.USER_EXISTS)

  const decryptedPassword = await RSA.decrypt(password, token.privateKey)
}
