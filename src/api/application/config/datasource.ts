import { DataSource, DataSourceOptions, EntitySchema, MixedList } from "typeorm"
import { config } from "./index.js";
import { Users } from "../../domain/entities/users.entity.js";
import { Streamers } from "../../domain/entities/streamers.entity.js";
import { Payment } from "../../domain/entities/payment.entity.js";
import { Lives } from "../../domain/entities/lives.entity.js";
import { Clip } from "../../domain/entities/clip.entity.js";
import {MIGRATIONS_PATH} from "../../../../root_path.js"

import {primaryEntities} from "./primary_entity.js"

import {processLiveManager} from "../../infrastructure/processManager/processManager.js"
import { MultiBb } from "./multiple_db.js";

//==

let entities: MixedList<string | Function | EntitySchema<any>> | undefined = [
  Users,
  Streamers,
  Payment,
  Lives,
  Clip
]
let host: string | undefined = ''

//CONFIGS:
let configDataSource: DataSourceOptions = {
  type: "postgres",
  url:config.URL_POSTGRES,
  //ssl: { rejectUnauthorized: false },
  synchronize: true,
  logging: false,//debugar uopdates em tablas
  entities: primaryEntities,
  subscribers: [],
  migrations: [MIGRATIONS_PATH+'*.ts'],
  extra: {
    application_name: 'my_app',
    options: '-c client_encoding=UTF8',
  },
};

let configDataSource2: DataSourceOptions = {
  type: "postgres",
  url:config.URL_POSTGRES2,
  ssl: { rejectUnauthorized: false },
  synchronize: true,
  logging: false,//debugar uopdates em tablas
  entities: primaryEntities,
  subscribers: [],
  migrations: [MIGRATIONS_PATH+'*.ts'],
  extra: {
    application_name: 'my_app2',
    options: '-c client_encoding=UTF8',
  },
};
switch (process.env.NODE_ENV) {
  case "dev":
    //entities = primaryEntities
    console.log("DB DEV")
    host = process.env.HOST
    configDataSource = {
      type: "postgres",
      url:config.URL_POSTGRES,
      ssl: { rejectUnauthorized: false },
      synchronize: true,
      logging: false,//debugar uopdates em tablas
      entities: primaryEntities,
      subscribers: [],
      migrations: ['../../infrastructure/migrations/*.ts'],
    };
    break;
  case "production":
    //entities = primaryEntities
    console.log("DB DEV")
    host = process.env.HOST
    configDataSource = {
      type: "postgres",
      url:config.URL_POSTGRES,
      ssl: { rejectUnauthorized: false },
      synchronize: true,
      logging: false,//debugar uopdates em tablas
      entities: primaryEntities,
      subscribers: [],
      migrations: ['../../infrastructure/migrations/*.ts'],
      
    };
    break;
  case "test":
    //entities = ["dist/src/api/domain/entities/*.js"]
    console.log("DB TEST")
    //process.env.DB_HOST
    configDataSource = {
      type: "sqlite",
      database: ":memory:",
      synchronize: true,
      logging: false,
      entities: primaryEntities,
      migrations: ['../../infrastructure/migrations/*.ts'],
      subscribers: [],
    }
    break;
  default:
    entities = ["dist/src/api/domain/entities/*.js"]
    host = "pg_container"
    break;
}


if (process.env.NODE_ENV === "test") {
  let testdataSource = {
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
    logging: false,
    entities: primaryEntities,
    migrations: ['../../infrastructure/migrations/*.ts'],
    subscribers: [],
    "cli": {
      "entitiesDir": "src/entities",
      "migrationsDir": "src/migrations",
      "subscribersDir": "src/subscribers"
    }
  }

}


export let dataSource1 = new DataSource(configDataSource);
export let dataSource2 = new DataSource(configDataSource2);


export let dataSource = new MultiBb()
dataSource.initialize().then(()=>{
  processLiveManager.setStreamers()
})

/*
export const options: DataSourceOptions = {
  type: "postgres",
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [
    Users,
    Streamers
  ],
  subscribers: [],
  migrations: ['./migrations/*.ts']
}

//===============================================

export const dataSource = new DataSource(options)*/


/*AppDataSource.initialize()
  .then(async () => {
    console.log("Connection initialized with database...");
  })
  .catch((error) => console.log(error));*/