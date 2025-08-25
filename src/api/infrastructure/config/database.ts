import { createDatabase } from 'typeorm-extension'
import { dataSource } from '../../application/config/datasource.js'
import { config } from '../../application/config/index.js'

import {  Users } from "../../domain/entities/users.entity.js";
import { Streamers } from "../../domain/entities/streamers.entity.js";
import { Payment } from "../../domain/entities/payment.entity.js";

import ExceptionHandler from '../exceptions/exceptions-handler.js'

/**
 * Database connection function.
 * Is called in bootstrap class app.ts.
 * @returns 
 */
const entities = [Users,Streamers,Payment]
const options = {
  type: "postgres",
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  synchronize: true,
  logging: false,//debugar uopdates em tablas
  entities:entities,
  subscribers: [],
  migrations: ['../../infrastructure/migrations/*.ts'],
  ifNotExist:true
}

const dbConnection = async () => {
  let attempts = 0
  const maxAttempts = 3
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  while (attempts < maxAttempts) {
    try {
      await createDatabase(options)
      await dataSource.initialize()
      await dataSource.synchronize()
      console.log("Successfully connected to database")
      return
    } catch (error) {
      console.error(error)
      attempts++
      console.log(`database connection failed. retrying in 3 seconds... (attempt ${attempts}/${maxAttempts})`)
      await delay(3000)
    }
  }
  throw new ExceptionHandler(500, `database connection failed after ${attempts} attempts`)
}

export default dbConnection