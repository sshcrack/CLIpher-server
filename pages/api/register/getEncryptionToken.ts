//* Always import reflect-metadata when working with db stuff
import "reflect-metadata";

import debugConstr from "debug"
import { NextApiRequest, NextApiResponse } from 'next'
import { Global } from '../../../tools/global'
import { EncryptionTokenResponse, ErrorResponse } from '../../../tools/interfaces/APIInterfaces'
import { generateToken } from "../../../tools/tokenGenerator"
import { checkBody, checkMaxLength, checkMethod } from "../../../tools/validators";
import { getIP } from "../../../tools/util";
import ErrorCodes from "../../../tools/interfaces/error-codes";
import HttpStatusCode from "../../../tools/interfaces/status-codes";

const debug = debugConstr("API - EncryptionToken")
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EncryptionTokenResponse | ErrorResponse>
) {
  const { encryptionToken } = await Global.getDatabase()
  const userIP = getIP(req)
  const { username } = req.body

  const rightRequest = checkMethod("POST", req, res)
    ??
    checkBody(["username"], req, res)
    ??
    checkMaxLength(req, [
      {
        name: "username",
        maxLength: 32
      }
    ])

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
  const exists = await encryptionToken.getToken(username)
  if (exists) {
    if (exists.ip !== userIP)
      return res
        .status(HttpStatusCode.FORBIDDEN)
        .json({
          message: "Already requested from other ip.",
          error: ErrorCodes.REQUESTED_FROM_OTHER_IP
        })

    debug("👨🏼‍🤝‍👨🏻 Duplication found. Removing...")
    await encryptionToken.removeToken(username)

    debug("❌ Duplication removed.")
  }

  const token = generateToken()
  await encryptionToken.addToken({ username, token, ip: userIP })
  res.send({
    token
  })
}
