// userUtils.ts
import { Users } from "../../../domain/entities/users.entity.js"
import { UsersService } from "../../../application/services/users.service.js"
import { container } from "tsyringe"

interface UserRegister {
    name: string;
    email: string;
    password: string;
  }

const user:UserRegister = {
    name: 'gui',
    email:'testeg@gmail.com',
    password:'teste123'
};

    let UsersServiceTest: UsersService = container.resolve(UsersService)

  
  export const registerUser = async (user: UserRegister): Promise<boolean> => {
    let ok = false;
    const response = await UsersServiceTest.getAllUsers()
    if(response){
        ok = true;
    }
    return true;
  }
module.exports = [
    registerUser
]