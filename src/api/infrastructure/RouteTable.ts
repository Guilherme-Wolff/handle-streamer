import "reflect-metadata"
import express, { Router, Express } from 'express'
//import AuthController from "./controllers/auth.controller.js"
//import UsersController from "./controllers/users.controller.js"
//import StreamersController from "./controllers/streamers.controller.js"

import SaveLiveController from "./controllers/savelive.controller.js"
import StreamersController from "./controllers/streamers.controller.js"

import CookiesController from "./controllers/cookies.controller.js"


import { COOKIES_TIKTOK } from "../application/config/cookies.js"

import { config } from "../application/config/index.js"

//Middlewares
import { AuthMiddleware } from "./middleware/jwtMiddleware.js"
import { saveCookies } from "../application/config/saveCookies.js"

import ClipController from "./controllers/clip.controller.js"

import ProxyController from "./controllers/proxy.controller.js"

import { getDiskInfo } from 'node-disk-info';

import dns from 'node:dns';
import { promisify } from 'node:util';


const dnsLookup = promisify(dns.lookup);

const { address } = await dnsLookup('localhost');

console.log('Hostname:', address);


const maintenanceMode = async (req, res, next) => {
  if (config.MAINTENANCE_MODE === "true" && !req.path.includes('/setmntc')) {
    return res.status(503).send('We are undergoing maintenance. Please come back later!');
  }
  next();
};

const setMaintenanceMode = async (req, res, next) => {
  const { mntc } = req.body;

  if (mntc) {
    config.MAINTENANCE_MODE = mntc;
    await res.json({
      message: mntc
    })
  }
  next();
};


function RouteTable(app: Express) {
  const router = express.Router()
  // V1
  app.use(/*"/.netlify/functions/app"*/'/api/v1', router)
  router.use(maintenanceMode)
  //SAVE LIVES TIKTOK
  router.use('/tiktok', SaveLiveController)

  router.use('/streamers', StreamersController)
  router.get('/ola', (req, res, next) => {
    res.json({
      ola: 'ola vc'
    })
  })

  router.use('/tiktok', SaveLiveController)
  router.use('/cookie', CookiesController)

  router.use('/clip',/*AuthMiddleware ,*/ClipController)
  router.use('/proxy',/*AuthMiddleware ,*/ProxyController)


  router.get('/alive', (req, res) => {
    res.send({
      alive: true,
    })
  })

  router.get('/info', async (req, res) => {
    try {
      const disks = await getDiskInfo();
      const mainDisk = disks.find(disk => disk.mounted === '/') || disks[0];
  
      const totalGB = (mainDisk.blocks / (1024 ** 3)).toFixed(2);
      const usedGB = (mainDisk.used / (1024 ** 3)).toFixed(2);
      const freeGB = (mainDisk.available / (1024 ** 3)).toFixed(2);
  
      res.send({
        space: {
          total: `${totalGB} GB`,
          used: `${usedGB} GB`,
          free: `${freeGB} GB`,
          percentUsed: mainDisk.capacity
        }
      });
    } catch (error) {
      console.error('Erro ao obter informações de disco:', error);
      res.status(500).send({
        space: 'Erro ao obter informações do disco',
        //error: error.message
      });
    }
  })
  router.use('/prometheus_scrape', AuthMiddleware, () => {
    console.log("Coleta periodica")
  })
}
export { RouteTable }




