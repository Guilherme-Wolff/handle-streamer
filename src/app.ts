import "reflect-metadata"
import express, { Request, Response, NextFunction, Express, Router } from 'express'
//import ServerlessHttp from "serverless-http"

import cors from 'cors'
import bodyParser from "body-parser"

import * as fs from 'fs';

import { RouteTable } from './api/infrastructure/RouteTable.js'
import { container } from "tsyringe"
///import { OrganizationRepository } from "./api/application/RepositoryImpl/organization.repository.js"
///import { ChargePointRepository } from "./api/application/RepositoryImpl/chargepoint.repository.js"




import { UsersRepository } from "./api/application/RepositoryImpl/users.repository.js"
import { UsersService } from "./api/application/services/users.service.js"

//import { ProxiesManager } from "./api/application/services/get_proxies.js"
//
import { readJSONDoc } from "../doc/doc_json.js"
//Middlewares

import swaggerUI from "swagger-ui-express"

import { Pixeldrain } from "./api/application/services/pixeldrain.service.js"
import { PATH_RESPONSE_UPLOADS,HTML_USERS_PATH ,COOKIE_PATH_UPLOAD,PATH_CLIPS} from "../root_path.js"
import path from "path";


const createDiretoryStream = async (name: string): Promise<void> => {
  fs.mkdir(name, { recursive: true }, (error) => {
    if (error) {
      return
    }
  });
}

const createPaths = () => {
  const paths:string[] = [PATH_RESPONSE_UPLOADS, HTML_USERS_PATH,COOKIE_PATH_UPLOAD,PATH_CLIPS]

  paths.forEach(async(name)=>{
    await createDiretoryStream(name)
  })

  return;
}
const UPDATE_KEY_PIXELDRAIN = async () => {
  const px = new Pixeldrain()

  await px.updateKey();

  return
}

export const App: Express = express()

//createPaths()

//SWAGGER DOC
/*const caminhoArquivo = './src/swagger.json';
/*
useJsonDoc(caminhoArquivo,App).catch(data => data) 
*/

//UPDATE_KEY_PIXELDRAIN()
//dbConnection()
/*
const whitelist = ['http://localhost:3000', 'http://localhost:5432', 'https://www.thunderclient.com']

const options = {
  origin: (origin: string | undefined, callback: Function) => {
    origin = origin || '';
    //origin = '*';
    console.log('-----> origin: ', origin);
    if (whitelist.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Not allowed Host: ${origin}`))
    }
  },
}
App.use(cors(options))*/

//App.use(cors())

App.use(bodyParser.json())
//App.use('/api/v1' ,RouteTable)
RouteTable(App)


/*App.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.send(err.message)
})*/


//const serverless = ServerlessHttp(App);

//const handler = ServerlessHttp(app)


/**
 * Registering dependencies in the execution context container
 */

container.register<UsersRepository>(UsersRepository, { useClass: UsersRepository })
container.register<UsersService>(UsersService, { useClass: UsersService })

/*const handler = async (event: any, context: any) => {
  const result = await serverless(event, context);
  return result;
};

export { handler }*/


