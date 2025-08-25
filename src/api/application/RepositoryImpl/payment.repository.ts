import "reflect-metadata"
import { injectable } from "tsyringe"
import { Equal } from "typeorm"
import { Payment } from "../../domain/entities/payment.entity.js"
import { IPaymentRepository } from "../../domain/repository/IPaymentRepository.js"
import { dataSource } from "../config/datasource.js"
import { CrudRepository } from "./crud.repository.js"



@injectable()
export class PaymentRepository
  extends CrudRepository<Payment | any>
  implements IPaymentRepository {
  async findById(id: string): Promise<Payment[]> {
    try {
      console.log("payment")
      const p:Payment = new Payment(50, '1234567489','BRL','09/10/2023')
      return [p];
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  /*async getAllPayments(id: string): Promise<Payment[]> {

    try {
      
      return await dataSource.manager.findOne<any>(Payment, { where: { id } })
       
      //return await dataSource.manager.save<any>(user)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }*/

  
  /*async userExist(email: string): Promise<Boolean> {
    try {
      return await dataSource.manager.exists<any>(Users, {
        email: Equal(email)
      })
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }*/
}