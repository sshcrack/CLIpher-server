import { NextApiRequest, NextApiResponse } from 'next'
import { BCrypt } from '../../../tools/crypto/BCrypt'
import { RSA } from '../../../tools/crypto/RSA'
import { Token } from '../../../tools/crypto/Token'
import { Global } from "../../../tools/global"
import { APIError, FieldLength } from '../../../tools/interfaces/APIInterfaces'
import { GeneralError } from '../../../tools/interfaces/error-codes'
import { RateLimit } from "../../../tools/rate-limit"
import { ConsumeType } from '../../../tools/rate-limit/interface'
import { sendErrorResponse } from '../../../tools/responses'
import { getKeyExpirationDate } from '../../../tools/util'
import { runChecks } from '../../../tools/validators'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<LoginResponse | APIError>
) {
    const { username, password: passwordHex } = req.body ?? {}
    const { User, LoginToken } = await Global.getDatabase() ?? {}
    if(!User || !LoginToken)
        return sendErrorResponse(res, GeneralError.DB_CONNECTION_NOT_AVAILABLE)

    const isRateLimited = await RateLimit.consume(ConsumeType.Login, req, res)
    if (isRateLimited)
        return

    const validRequest = await runChecks({
        method: "POST",
        requiredFields: [
            "username",
            "password"
        ],
        checks: [
            {
                name: "username",
                maxLength: FieldLength.USERNAME
            },
            {
                name: "password",
                maxLength: FieldLength.PASSWORD
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

    if (!validRequest)
        return

    const user = await User.get(username)
    if (!user)
        return sendErrorResponse(res, GeneralError.INVALID_CREDENTIALS)

    const password = Buffer.from(passwordHex, 'hex')
    const decryptedPassword = await RSA.decrypt(password, user.privateKey)
    if (!decryptedPassword)
        return sendErrorResponse(res, GeneralError.CANT_DECRYPT_PASSWORD)

    const hashedPassword = user.hashedPassword
    const rightPassword = BCrypt.verify(hashedPassword, decryptedPassword)

    if (!rightPassword)
        return sendErrorResponse(res, GeneralError.INVALID_CREDENTIALS)

    const loginToken = await Token.generate()
    const expiration = getKeyExpirationDate()

    const addResult = await LoginToken.add({
        username: username,
        token: loginToken,
        encryptedPasswordHex: passwordHex,
        expiresAt: new Date(expiration)
    })

    if (!addResult)
        return sendErrorResponse(res, GeneralError.CANT_ADD_LOGIN_TOKEN)

    res.send({
        loginToken,
        expires: expiration
    })
}

export interface LoginResponse {
    loginToken: string,
    expires: number
}