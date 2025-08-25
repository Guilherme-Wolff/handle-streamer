import {compare,hash} from "bcrypt"

export async function generateHash(password: string): Promise<string> {
  const saltRounds = 10;
  const passhash = await hash(password, saltRounds);
  return passhash;
}

export async function compareHash(password: string, hash: string): Promise<boolean> {
  const isMatch = await compare(password, hash);
  return isMatch;
}

export async function hashPassword(password,saltRounds=8){
	return await hash(password, saltRounds)
}


export async function validateUser(password,hash) {
    return await compare(password, hash)     
}

