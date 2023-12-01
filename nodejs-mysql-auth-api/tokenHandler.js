import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
config();

const ACCESS_TOKEN_SECRET= 'avSjekkd4526Dkeo586Dhjdsf52ba'
const ACCESS_TOKEN_EXPIRY= 1200
const REF_TOKEN_SECRET= 'j82dDJKE3643LIEJ253DjEL35223dHek52ed'
const REF_TOKEN_EXPIRY= 86400 

export const generateToken = (data, access = true) => {
    const secret = access
        ? ACCESS_TOKEN_SECRET
        : REF_TOKEN_SECRET;
    const expiry = access
        ? ACCESS_TOKEN_EXPIRY
        : REF_TOKEN_EXPIRY;
    return jwt.sign(data, secret, { expiresIn: parseInt(expiry) });
};

export const verifyToken = (token, access = true) => {
    const secret = access
        ? ACCESS_TOKEN_SECRET
        : REF_TOKEN_SECRET;
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return {
            status: 401,
            message: `Unauthorized: ${err.message}`,
        };
    }
};