import { NextApiRequest, NextApiResponse } from 'next'
import { BCrypt } from "../../tools/crypto/BCrypt"
import HttpStatusCode from '../../tools/interfaces/status-codes'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { password } = req.query
  if(typeof password !== "string")
    return res.status(HttpStatusCode.BAD_REQUEST).send("Bruh")

  const hash = await BCrypt.hash(password)
  const verified = await BCrypt.verify(hash, password)

  res.status(200).json({hash, verified})
  return;
  res.status(200).json({ name: 'John Doe' })
}
