import db from '../models'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { notAuth } from '../middlewares/handle_errors'


const hashPassword = password => bcrypt.hashSync(password, bcrypt.genSaltSync(8))

export const register = ({ email, password }) => new Promise(async (resolve, reject) => {
    try {
        const response = await db.User.findOrCreate({
            where: { email },
            defaults: {
                email,
                password: hashPassword(password)
            }
        })

        console.log('response: ', response)

        const accessToken = response[1] ? jwt.sign({ id: response[0].id, email: response[0].email, role_code: response[0].role_code }, process.env.JWT_SECRET, { expiresIn: '30s' }) : null
        const refreshToken = response[1] ? jwt.sign({ id: response[0].id }, process.env.JWT_SECRET_REFRESH_TOKEN, { expiresIn: '2h' }) : null
        
        resolve({
            err: response[1] ? 0 : 1,
            mes: response[1] ? 'Register is successfully' : 'Email is used',
            'access_token': accessToken ? `Bearer ${accessToken}` : accessToken,
            'refresh_token': refreshToken
        })

        if(refreshToken) {
            await db.User.update({
                refresh_token: refreshToken
            }, {
                where: {id: response[0].id}
            })
        }
    } catch (error) {
        reject(error)
    }
})

export const login = ({ email, password }) => new Promise(async (resolve, reject) => {
    try {
        const response = await db.User.findOne({
            where: { email },
            raw: true // de khong tra ve instant cua sequlize chi tra ve object thuan
        })
        const isChecked = response && bcrypt.compareSync(password, response.password)
        const accessToken = isChecked ? jwt.sign({ id: response.id, email: response.email, role_code: response.role_code }, process.env.JWT_SECRET, { expiresIn: '30s' }) : null
        const refreshToken = isChecked ? jwt.sign({ id: response.id }, process.env.JWT_SECRET_REFRESH_TOKEN, { expiresIn: '1m' }) : null

        resolve({
            err: accessToken ? 0 : 1,
            mes: accessToken ? 'Login is successfully' : response ? 'Password is wrong' : 'Email has not been registered',
            'access_token': accessToken ? `Bearer ${accessToken}` : accessToken,
            'refresh_token': refreshToken
        })

        if(refreshToken) {
            await db.User.update({
                refresh_token: refreshToken
            }, {
                where: {id: response.id}
            })
        }

    } catch (error) {
        reject(error)
    }
})

export const refreshToken = (refresh_token) => new Promise(async (resolve, reject) => {
    try {
     
        const response = await db.User.findOne({
            where: { refresh_token }
        })

        console.log('response: ', response);

        if(response) {
            jwt.verify(refresh_token, process.env.JWT_SECRET_REFRESH_TOKEN, (err) => {
                if (err) {
                    resolve({
                        err: 1,
                        mes: 'Token is expired. Please login again'
                    })
                } else {
                    const accessToken = jwt.sign({ id: response.id, email: response.email, role_code: response.role_code }, process.env.JWT_SECRET, { expiresIn: '30s' })
                    console.log('accessToken: ', accessToken);
                    resolve({
                        err: accessToken ? 0 : 1,
                        mes: accessToken ? 'access token is generated' : 'Failure to generate access token',
                        'access_token': accessToken ? `Bearer ${accessToken}` : accessToken,
                        'refresh_token': refresh_token
                    })
                }
            })
        }

    } catch (error) {
        reject(error)
    }
})
