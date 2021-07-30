import { NextApiRequest, NextApiResponse } from 'next'
import ErrorCodes from '../../../tools/interfaces/error-codes'
import HttpStatusCode from '../../../tools/interfaces/status-codes'



export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if(req.method !== "POST")
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      error: ErrorCodes.METHOD_NOT_ALLOWED,
      message: "GET Method not allowed"
    })

  const {password, username}: RequestBody = req.body
  if(!password || !username)
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      error: ErrorCodes.USERNAME_OR_PASSWORD_NOT_GIVEN,
      message: "Username or Password was not given"
    })
}
