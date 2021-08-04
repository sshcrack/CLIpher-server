//* Always import reflect-metadata when working with db stuff
import "reflect-metadata";

import { NextApiRequest, NextApiResponse } from 'next';
import { RSA } from "../../../tools/crypto/RSA";
import { Global } from '../../../tools/global';
import { APIError, EncryptionKeyResponse, FieldLength } from '../../../tools/interfaces/APIInterfaces';
import { GeneralError } from "../../../tools/interfaces/error-codes";
import { Logger } from '../../../tools/logger';
import { RateLimit } from "../../../tools/rate-limit";
import { ConsumeType } from "../../../tools/rate-limit/interface";
import { sendErrorResponse } from "../../../tools/responses";
import { getIP, getKeyExpirationDate } from "../../../tools/util";
import { runChecks } from "../../../tools/validators";





const log = Logger.getLogger("API", "Register", "EncryptionKey")

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EncryptionKeyResponse | APIError>
) {
  const userIP = getIP(req)
  const { username } = req.body ?? {}
  const { EncryptionKey, User } = await Global.getDatabase() ?? {}
  if (!EncryptionKey || !User)
    return sendErrorResponse(res, GeneralError.DB_CONNECTION_NOT_AVAILABLE)

  const isRateLimited = await RateLimit.consume(ConsumeType.EncryptionKey, req, res)
  if (isRateLimited)
    return

  const validRequest = await runChecks({
    method: "POST",
    requiredFields: ["username"],
    ip: true,
    checks: [
      {
        name: "username",
        maxLength: FieldLength.USERNAME
      }
    ],
    typeCheck: [
      {
        name: "username",
        type: "string"
      }
    ]
  }, req, res)

  if (!validRequest || !userIP)
    return

  const usernameExists = await User.exists(username)

  if (usernameExists)
    return sendErrorResponse(res, GeneralError.USER_EXISTS)


  const exists = await EncryptionKey.getKey(username)

  if (exists) {
    if (exists.ip !== userIP) {
      log.info("Requested from other IP")

      sendErrorResponse(res, GeneralError.REQUESTED_FROM_OTHER_IP)
      return
    }

    res.send({
      publicKey: exists.key,
      expiresAt: exists.expiresAt.getTime()
    })
    log.info("Sent cache results")

    return
  }

  const { publicKey, privateKey } = await RSA.generateKeyPair().catch(() => { }) ?? {}
  const keyExpiration = getKeyExpirationDate()

  if (!publicKey || !privateKey)
    return sendErrorResponse(res, GeneralError.ERROR_GENERATING_KEY_PAIR)


  console.log("Expiration in", keyExpiration, "date is", new Date(keyExpiration))
  const result = await EncryptionKey.addKey({
    username: username,
    key: publicKey,
    privateKey: privateKey,
    expiresAt: new Date(keyExpiration),
    ip: userIP
  })

  if (!result)
    return sendErrorResponse(res, GeneralError.ERROR_ADDING_ENCRYPTION_KEY)

  res.send({
    publicKey,
    expiresAt: keyExpiration
  })
}
