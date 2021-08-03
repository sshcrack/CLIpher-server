import { NextApiRequest, NextApiResponse } from 'next';
import { AES } from '../../../tools/crypto/AES';
import { BCrypt } from '../../../tools/crypto/BCrypt';
import { RSA } from '../../../tools/crypto/RSA';
import { TFA } from '../../../tools/crypto/TFA';
import { Global } from '../../../tools/global';
import { APIError } from '../../../tools/interfaces/APIInterfaces';
import { GeneralError } from '../../../tools/interfaces/error-codes';
import { Logger } from '../../../tools/logger';
import { RateLimit } from '../../../tools/rate-limit';
import { ConsumeType } from '../../../tools/rate-limit/interface';
import { sendErrorResponse } from '../../../tools/responses';
import { runChecks } from '../../../tools/validators';

const log = Logger.getLogger("API", "Register", "verifyTFA")
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<VerifyTAResponse | APIError>
) {
    const { username, encryptedPassword, code } = req.body ?? {}
    const { User } = await Global.getDatabase() ?? {}
    const { cache } = Global

    const isRateLimited = await RateLimit.consume(ConsumeType.VerifyTFA, req, res)
    if (isRateLimited)
        return

    const validRequest = await runChecks({
        method: "POST",
        requiredFields: ["username", "password", "code"],
        checks: [
            {
                name: "userrname",
                maxLength: 32,
            },
            {
                name: "password",
                maxLength: 128
            },
            {
                name: "code",
                maxLength: 6
            }
        ],
        typeCheck: [
            { name: "username", type: "string" },
            { name: "password", type: "string" },
            { name: "code", type: "string" }
        ]
    }, req, res)

    if (!validRequest)
        return

    const user = await User.get(username)
    if (!user)
        return sendErrorResponse(res, GeneralError.INVALID_LOGIN)

    if (user.TFAVerified)
        return sendErrorResponse(res, GeneralError.TFA_ALREADY_VERIFIED)

    const hashedPassword = user.hashedPassword

    const decryptedPassword = cache.get<CacheResult>(`rsa-decrypted-${encryptedPassword}`) ?? await RSA.decrypt(encryptedPassword, user.privateKey)
    if (!decryptedPassword)
        return sendErrorResponse(res, GeneralError.CANT_DECRYPT_PASSWORD)


    const passwordMatches = BCrypt.verify(hashedPassword, decryptedPassword)
    if (!passwordMatches)
        return sendErrorResponse(res, GeneralError.INVALID_LOGIN)

    const tfaSecret =
        cache.get<CacheResult>(`aes-decrypted-${user.TFASecret}`)
        ??
        await AES.decrypt({
            encrypted: user.TFASecret,
            iv: user.iv,
            password: decryptedPassword
        })

    if(!tfaSecret)
        return sendErrorResponse(res, GeneralError.CANT_DECRYPT_TFA_SECRET)
    const currCode = TFA.getOTP(tfaSecret)

    if(currCode !== code)
        return sendErrorResponse(res, GeneralError.WRONG_TFA_CODE)

    await User.update(user.username, {
        TFAVerified: true
    })

    res.send({
        message: "Verified 2FA successfully."
    })
}

export interface VerifyTAResponse {

}

type CacheResult = string | undefined