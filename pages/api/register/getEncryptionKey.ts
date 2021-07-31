//* Always import reflect-metadata when working with db stuff
import debugConstr from "debug";
import { NextApiRequest, NextApiResponse } from 'next';
import "reflect-metadata";
import { generateRSAKeypair } from "../../../tools/crypto/RSA";
import { Global } from '../../../tools/global';
import { APIError, EncryptionKeyResponse, ErrorResponse } from '../../../tools/interfaces/APIInterfaces';
import ErrorCodes from "../../../tools/interfaces/error-codes";
import HttpStatusCode from "../../../tools/interfaces/status-codes";
import { RateLimit } from "../../../tools/rate-limit";
import { ConsumeType } from "../../../tools/rate-limit/interface";
import { getIP } from "../../../tools/util";
import { runChecks } from "../../../tools/validators";


const debug = debugConstr("API - EncryptionKey")
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EncryptionKeyResponse | APIError>
) {
  const userIP = getIP(req)

  const { username } = req.body
  const { encryptionKey } = await Global.getDatabase() ?? {}

  const isRatelimited = await RateLimit.consume(ConsumeType.EncryptionKey, req, res)
  if(isRatelimited)
    return

  const rightRequest = runChecks({
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

  if (!rightRequest)
    return

  if (!userIP)
    return res
      .status(HttpStatusCode.FORBIDDEN)
      .json({
        message: "Socket hang up",
        error: ErrorCodes.SOCKET_CLOSED
      })

  //TODO Check if username is available from account sql

  debug("👥 Checking for duplicates...")
  const exists = await encryptionKey.getKey(username)
  if (exists) {
    if (exists.ip !== userIP)
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json({
          message: "Already requested from other ip.",
          error: ErrorCodes.REQUESTED_FROM_OTHER_IP
        })

    debug("👨🏼‍🤝‍👨🏻 Duplicate found. Removing...")
    await encryptionKey.removeKey(username)

    debug("❌ Duplicate removed.")
  }

  const { publicKey, privateKey } = await generateRSAKeypair()
  await encryptionKey.addKey({ username, key: publicKey, priv: privateKey, ip: userIP })
  res.send({
    publicKey
  })
}
