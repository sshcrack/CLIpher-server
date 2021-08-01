//* Always import reflect-metadata when working with db stuff
import "reflect-metadata";


import debugConstr from "debug";
import { NextApiRequest, NextApiResponse } from 'next';
import { RSA } from "../../../tools/crypto/RSA";
import { Global } from '../../../tools/global';
import { APIError, EncryptionKeyResponse } from '../../../tools/interfaces/APIInterfaces';
import ErrorCodes, { GeneralError } from "../../../tools/interfaces/error-codes";
import { RateLimit } from "../../../tools/rate-limit";
import { ConsumeType } from "../../../tools/rate-limit/interface";
import { sendErrorResponse } from "../../../tools/responses";
import { getIP, getKeyExpirationDate } from "../../../tools/util";
import { runChecks } from "../../../tools/validators";


const debug = debugConstr("API - EncryptionKey")
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EncryptionKeyResponse | APIError>
) {
  const userIP = getIP(req)
  const { username } = req.body ?? {}
  const { EncryptionKey, User } = await Global.getDatabase() ?? {}

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
        maxLength: 32
      }
    ],
  }, req, res)

  debug("Valid request", validRequest)
  if (!validRequest || !userIP)
    return

  debug(`🕑 Checking if ${username} is available`)
  const usernameExists = await User.exists(username)

  if (usernameExists) {
    debug("👥 Username already exists.")

    sendErrorResponse(res, GeneralError.USER_EXISTS)
    return
  }


  debug("🕑 Checking for duplicates...")
  const exists = await EncryptionKey.getKey(username)

  if (exists) {
    if (exists.ip !== userIP)
      return sendErrorResponse(res, GeneralError.REQUESTED_FROM_OTHER_IP)

    debug("👥 Duplicate found. Sending...")
    res.send({
      publicKey: exists.key,
      expiresAt: exists.expiresAt
    })

    return
  }

  const { publicKey, privateKey } = await RSA.generateKeyPair().catch(() => { }) ?? {}
  const keyExpiration = getKeyExpirationDate()

  if (!publicKey || !privateKey) {
    debug("💥 Error generating key pair")
    sendErrorResponse(res, GeneralError.ERROR_GENERATING_KEY_PAIR)
    return
  }

  await EncryptionKey.addKey({
    username: username,
    key: publicKey,
    privateKey: privateKey,
    expiresAt: keyExpiration,
    ip: userIP
  })

  res.send({
    publicKey,
    expiresAt: keyExpiration
  })
}
