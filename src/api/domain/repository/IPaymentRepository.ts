import { Payment } from "../entities/payment.entity"


/**
 * Chargepoint interface holding a set of specific operations
 */
export interface IPaymentRepository {
  findById(id: string): Promise<Payment[]>
  /*createPayment(info:any) : Promise<Payment[]>
  getAllPayments(): Promise<Payment[]>
  isEmailUnique(email: string): Promise<boolean>*/
}