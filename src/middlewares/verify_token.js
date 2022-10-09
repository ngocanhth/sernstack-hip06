import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { notAuth } from './handle_errors'

const verifyToken = (req, res, next) => {

    const token = req.headers.authorization
    if (!token) return notAuth('Require authorization', res)
    const accessToken = token.split(' ')[1]
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
        const isTokenExpired = err instanceof TokenExpiredError

        console.log(isTokenExpired);
        if ( err) {
            if (isTokenExpired) return notAuth('Access token may be expired', res, isTokenExpired)
            if (!isTokenExpired) return notAuth('Access token invalid', res, isTokenExpired)
        }
        req.user = user
        next()
    })

}

export default verifyToken