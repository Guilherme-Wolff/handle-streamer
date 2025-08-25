import  jwt from 'jsonwebtoken';
import {config} from "../../application/config/index.js"

// Chave SECRET para assinar e verificar tokens
const secretKey = config.auth.secret;
const espiresin = config.auth.expiresIn;

interface validToken { isValid: boolean; payload?: any; }

interface validToken { isValid: boolean; payload?: any; }
interface Payload { id: string, username: string }

interface PayloadComplete {
  isValid: boolean;
  payload: Payload;
}


// Função para gerar um JWT
export async function generateJWT( id: string, name: string): Promise<string> {
  console.log("CHAVE : ",secretKey)
  const payload = {
    id: id,
    username: name,
  };

  const options: jwt.SignOptions = {
    expiresIn: espiresin, // Token expira em 1 hora
  };
  var token = jwt.sign(payload, secretKey, options);
  return await token
}

// Função para validar um JWT
export async function validateJWT(token: string): Promise<validToken> {
  try {
    const decoded = jwt.verify(token, secretKey);
    return { isValid: true, payload: decoded };
  } catch (error) {
    return { isValid: false };
  }
}

export async function decodeJWT(token: string): Promise<validToken> {
  try {
    const decoded = jwt.verify(token, secretKey);
    return { isValid: true, payload: decoded };
  } catch (error) {
    return { isValid: false };
  }
}

export async function getUserId(token: string): Promise<string> {
  try {
    const decoded = await decodeJWT(token) as PayloadComplete

    return decoded.payload.id

  } catch (error) {
    return '';
  }
}





