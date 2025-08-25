# Clean Architecture Example

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)<br>

###### *Stresupported live stream platforms* <br>

* Tiktok


## Important Notes

- If you run Docker-compose use "make up" in wsl, check Makefile for context.

- The Docker-compose container is slow in build up, bear with it please.

- There is a Postman collection (if you prefer this) in root directory with the endpoints and a few skeletons on how request bodies should look like.

- You can also run the application locally with NPM, instruction below.

## Structure of the application

Lously coupled API following a domain driven design architecture split into different layers following the _"Inversion of Control"_ principle (Onion Architecture), where implementations (outer layers) depend upon specifications (inner layers).

![Image](/resources/architecture.jpg)

* Domain: holds the _entities_ folder with the Domain objects Organization and Chargepoint. It is also the place where the specification of the CRUD operations sits (later implemented in the outer layers).

* Application: this is the use-case layer of the API where both the bussiness logic layer (services) and the CRUD operations interfaces (previously mentioned) are implementated. The Datasource needed to run operation on the database is also set here.

* Infrastructure: outer layer where the routing layer sits, here is where the controller endpoint classes are implemented. Input data from the Request object is validated on each route with the correspondant DTO object before accessing the Service layer.

###### *Relevant commands to run the Docker container:* <br>

* npm run docker: transpiles the typescript application into a javascript module in the /dist folder and then runs the application on localhost. Datasource host on this command is set as "pg_container" to properly build the image. _This command is run automatically inside the docker-compose container._

* make up: _Make_ script that builds the docker compose image of the application and runs it in localhost:5001.

* make down: _Make_ script that shuts down the current running docker compose container.

_Make_ is a Linux CLI tool to run scripts easly. If you don't have it installed just go inside the "Makefile" that is sitting on the root folder and get the docker-compose command to run from there.

###### *How to launch with Docker:* <br>

1. Run --> make up.

###### *Relevant commands to run locally:* <br>

* npm run dev: runs ts-node + nodemon on index.ts for development purposes.

* npm start: transpiles the typescript application into a javascript module in the /dist folder and then runs the application on localhost.

Application is launched in PORT 5001 (localhost:5001 if you wanna try in local).

###### *How to launch locally:* <br>

1. Run --> yarn install.
2. Make sure a Postgres server is setup.
2. Run --> yarn run dev or yarn start.

## TODO LIST: <br>

- [ ] Testing.
- [X] Swagger implementation.
- [X] Checks in the Process Manager
