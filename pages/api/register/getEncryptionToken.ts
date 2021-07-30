//* Always import reflect-metadata when working with db stuff
console.log("Reflect imported")
import "reflect-metadata";

import debugConstr from "debug"
import { NextApiRequest, NextApiResponse } from 'next'
import { Global } from '../../../tools/database/global'
import { checkBody, checkMethod } from '../../../tools/database/util'
import { EncryptionTokenResponse, ErrorResponse } from '../../../tools/interfaces/APIInterfaces'
import { generateToken } from "../../../tools/tokenGenerator"

const debug = debugConstr("API - EncryptionToken")
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EncryptionTokenResponse | ErrorResponse>
) {
  const { encryptionToken } = await Global.getDatabase()
  const { username } = req.body

  const rightRequest = checkMethod("POST", req, res)
    ??
    checkBody(["username"], req, res)

  if (!rightRequest)
    return

  //TODO Check if username is available from account sql

  debug("👥 Checking for duplicates...")
  const exists = await encryptionToken.exists(username)
  if (exists) {
    debug("👨🏼‍🤝‍👨🏻 Duplication found. Removing...")
    await encryptionToken.removeToken(username)

    debug("❌ Duplication removed.")
  }

  const token = generateToken()
  await encryptionToken.addToken(username, token)
  res.send({
    token
  })
}
