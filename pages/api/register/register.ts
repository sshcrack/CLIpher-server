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
import debugConstr from "debug"

const debug = debugConstr('API:Register')
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse | APIError>
) {
  const userIP = getIP(req)
  const { username, password } = req.body ?? {}
  const { User, EncryptionKey } = await Global.getDatabase()

  const isRateLimited = await RateLimit.consume(ConsumeType.Register, req, res)
  if (isRateLimited)
    return

  const responseValid = runChecks({
    method: "POST",
    requiredFields: ["username, password"],
    ip: true,
    checks: [
      {
        name: "username",
        maxLength: 32
      },
      {
        name: "password",
        maxLength: 128
      }
    ],
  }, req, res)

  if (!responseValid || !userIP)
    return;

  const token = await EncryptionKey.getKey(username)
  if (!token)
    return sendErrorResponse(res, GeneralError.TOKEN_NOT_FOUND)

  const user = await User.getByUsername(username)
  if (!user)
    return sendErrorResponse(res, GeneralError.USER_EXISTS)

  debug("🔑 Decrypting password...")
  const decryptedPassword = await RSA.decrypt(password, token.privateKey)

  if (decryptedPassword.length > 128)
    return sendErrorResponse(res, GeneralError.PASSWORD_TOO_LONG)

  const { publicKey, privateKey } = await RSA.generateKeyPair()

  const creationResult = await User.add({
    username,

  })
}

type RegisterResponse = {
  encryptedTFASecret: string,
}