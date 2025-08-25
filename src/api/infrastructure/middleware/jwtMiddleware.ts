// jwtMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import {validateJWT} from "../helpers/JWT.js"

export async function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.header('Authorization');
  console.log("TOKEN",token)

  if (!token) {
    return res.status(401).json({ message: 'Authentication token not provided' });
  }
  const validToken = await validateJWT(token)
    if (validToken.isValid === true) {
      next();
    }else {
        return res.status(403).json({ message: 'Invalid Token' });
    }
}
