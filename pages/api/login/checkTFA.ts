import { NextApiRequest, NextApiResponse } from 'next'
import { AES } from '../../../tools/crypto/AES'
import { BCrypt } from '../../../tools/crypto/BCrypt'
import { RSA } from '../../../tools/crypto/RSA'
import { TFA } from '../../../tools/crypto/TFA'
import { Token } from '../../../tools/crypto/Token'
import { Global } from '../../../tools/global'
import { APIError, FieldLength } from '../../../tools/interfaces/APIInterfaces'
import { GeneralError } from '../../../tools/interfaces/error-codes'
import { RateLimit } from '../../../tools/rate-limit'
import { ConsumeType } from '../../../tools/rate-limit/interface'
import { sendErrorResponse } from '../../../tools/responses'
import { runChecks } from '../../../tools/validators'

type CheckTFAResponse = {
  accessToken: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckTFAResponse | APIError>
) {
  const { loginToken: givenToken, otp } = req.body ?? {}
  const { User, LoginToken } = await Global.getDatabase() ?? {}
  if(!User || !LoginToken)
    return sendErrorResponse(res, GeneralError.DB_CONNECTION_NOT_AVAILABLE)

  const isRateLimited = await RateLimit.consume(ConsumeType.CheckTFA, req, res)
  if (isRateLimited)
    return

  const validRequest = await runChecks({
    method: "POST",
    requiredFields: [
      "loginToken",
      "otp"
    ],
    checks: [
      {
        name: "loginToken",
        maxLength: FieldLength.USERNAME
      },
      {
        name: "otp",
        maxLength: FieldLength.PASSWORD
      }
    ],
    typeCheck: [
      {
        name: "loginToken",
        type: "string"
      },
      {
        name: "otp",
        type: "string"
      }
    ]
  }, req, res)

  if (!validRequest)
    return

  const { encryptedPassword, token, username } = await LoginToken.get(givenToken) ?? {}
  if (!token || !encryptedPassword || !username)
    return sendErrorResponse(res, GeneralError.INVALID_LOGIN_TOKEN)

  const user = await User.get(username)
  if (!user)
    return sendErrorResponse(res, GeneralError.LOGIN_TOKEN_USER_NOT_FOUND)

  const decryptedPassword = await RSA.decrypt(encryptedPassword, user.privateKey)
  if (!decryptedPassword)
    return sendErrorResponse(res, GeneralError.CANT_DECRYPT_PASSWORD)

  const hashedPassword = user.hashedPassword
  const rightPassword = BCrypt.verify(hashedPassword, decryptedPassword)

  if (!rightPassword)
    return sendErrorResponse(res, GeneralError.ENCRYPTION_CONFLICT_CHECK_TFA)


  const encryptedTFA = user.TFASecret
  const TFASecret = await AES.decrypt({ encrypted: encryptedTFA, password: decryptedPassword })
  if (!TFASecret)
    return sendErrorResponse(res, GeneralError.CANT_DECRYPT_TFA_SECRET)

  const generatedOTP = TFA.getOTP(TFASecret)
  if (generatedOTP !== otp)
    return sendErrorResponse(res, GeneralError.WRONG_TFA_CODE)


  const accessToken = Token.generate()
  
}
