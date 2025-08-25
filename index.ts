import "reflect-metadata";
import http from 'http'
import { App } from './src/app.js'
//import { handler } from './src/app';

const port = process.env.PORT || 5001
export const server = http.createServer(App)

server.listen(Number(port), "0.0.0.0", () => {
  console.log(`Stream Saver rodando na porta ${port}`);
});