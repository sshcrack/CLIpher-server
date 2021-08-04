import { NextApiRequest, NextApiResponse } from 'next'
import { authenticator } from 'otplib'
import { AES } from '../../../tools/crypto/AES'
import { BCrypt } from '../../../tools/crypto/BCrypt'
import { RSA } from '../../../tools/crypto/RSA'
import { UserRepoResult } from '../../../tools/database/constructs/userConstruct'
import { Global } from '../../../tools/global'
import { APIError, FieldLength } from '../../../tools/interfaces/APIInterfaces'
import { GeneralError } from '../../../tools/interfaces/error-codes'
import HttpStatusCode from '../../../tools/interfaces/status-codes'
import { Logger } from '../../../tools/logger'
import { RateLimit } from '../../../tools/rate-limit'
import { ConsumeType } from '../../../tools/rate-limit/interface'
import { sendErrorResponse } from '../../../tools/responses'
import { getIP } from '../../../tools/util'
import { runChecks } from '../../../tools/validators'

const log = Logger.getLogger("API", "Register", "Register")
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse | APIError>
) {
  const userIP = getIP(req)
  const { username, password } = req.body ?? {}
  const { User, EncryptionKey } = await Global.getDatabase() ?? {}
  if (!User || !EncryptionKey)
    return sendErrorResponse(res, GeneralError.DB_CONNECTION_NOT_AVAILABLE)

  const isRateLimited = await RateLimit.consume(ConsumeType.Register, req, res)
  if (isRateLimited)
    return


  //!
  //!
  //! Validation
  //!
  //!

  log.await("Running checks...")
  const responseValid = runChecks({
    method: "POST",
    requiredFields: ["username, password"],
    ip: true,
    checks: [
      {
        name: "username",
        maxLength: FieldLength.USERNAME
      },
      {
        name: "password",
        maxLength: FieldLength.USERNAME
      }
    ],
    typeCheck: [
      {
        name: "username",
        type: "string"
      },
      {
        name: "password",
        type: "string"
      }
    ]
  }, req, res)

  if (!responseValid || !userIP)
    return log.debug("Checks failed.")

  const token = await EncryptionKey.getKey(username)
  if (!token)
    return sendErrorResponse(res, GeneralError.TOKEN_NOT_FOUND)

  const user = await User.get(username)
  if (!user)
    return sendErrorResponse(res, GeneralError.USER_EXISTS)


  //!
  //!
  //! Profile generations
  //!
  //!

  log.info("🔑 Decrypting password...")
  const decryptedPassword = await decryptPassword(password, token.privateKey)
  if (!decryptedPassword)
    return


  const hashedPassword = await BCrypt.hash(decryptedPassword)
  if (!hashedPassword)
    return sendErrorResponse(res, GeneralError.CANT_HASH_PASSWORD)


  const { privateKey, publicKey } = await generateRSA(res) ?? {}
  if (!privateKey || !publicKey)
    return;

  const { TFASecret, EncryptedTFA, iv } = await generateTFA(res, decryptedPassword) ?? {}
  if (!TFASecret || !EncryptedTFA || !iv)
    return



  const creationResult = await User.add({
    privateKey: privateKey,
    hashedPassword: hashedPassword,
    publicKey: publicKey,
    TFASecret: EncryptedTFA,
    iv: iv,
    username: username,
    TFAVerified: false,
  })

  switch (creationResult) {
    case UserRepoResult.EXISTS:
      sendErrorResponse(res, GeneralError.USER_EXISTS)
      break;

    case UserRepoResult.ERROR:
      sendErrorResponse(res, GeneralError.USER_CREATION_ERROR)
      break;

    case UserRepoResult.SUCCESS:
      res
        .status(HttpStatusCode.OK)
        .json({
          encryptedTFASecret: EncryptedTFA,
          publicKey: publicKey
        })
  }

  async function generateTFA<T>(res: NextApiResponse<T | APIError>, pass: string) {
    const iv = await AES.generateIV()
    const TFASecret = authenticator.generateSecret()

    if (!iv || !TFASecret)
      return sendErrorResponse(res, GeneralError.CANT_GENERATE_TFA_SECRET)

    const encryptedSecret = await AES.encrypt({
      iv: iv,
      plain: TFASecret,
      password: pass
    })

    if (!encryptedSecret)
      return sendErrorResponse(res, GeneralError.CANT_ENCRYPT_TFA_SECRET)

    return {
      TFASecret: TFASecret,
      EncryptedTFA: encryptedSecret,
      iv: iv
    }
  }

  async function generateRSA(res: NextApiResponse<RegisterResponse | APIError>) {
    const { publicKey, privateKey } = await RSA.generateKeyPair() ?? {}
    if (!publicKey || !privateKey)
      return sendErrorResponse(res, GeneralError.CANT_GENERATE_RSA_KEYPAIR)

    return {
      privateKey: privateKey,
      publicKey: publicKey
    }
  }

  async function decryptPassword(password: string, privateKey: string) {
    const decryptedPassword = await RSA.decrypt(password, privateKey)

    if (!decryptedPassword)
      return sendErrorResponse(res, GeneralError.CANT_DECRYPT_PASSWORD)

    if (decryptedPassword.length > 128)
      return sendErrorResponse(res, GeneralError.PASSWORD_TOO_LONG)

    return decryptedPassword
  }
}

type RegisterResponse = {
  encryptedTFASecret: string,
  publicKey: string
}