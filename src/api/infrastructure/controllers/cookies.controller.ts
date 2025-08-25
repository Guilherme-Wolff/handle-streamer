import "reflect-metadata"
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { container } from "tsyringe"
import { AuthService } from "../../application/services/auth.service.js"
import { UsersService } from "../../application/services/users.service.js"
import { validateDTO } from "../helpers/chargepoint-dtoValidation.js"
import { EntityType } from "../utils/entity-types.js"
import { HttpStatus } from "../utils/http-status.js"
import _ from 'lodash'
import { Users } from "../../domain/entities/users.entity.js"
import { hash, compare } from "bcrypt"
import { generateHash, compareHash } from "../helpers/bcrypt.js"
import { generateJWT, validateJWT } from "../helpers/JWT.js"
import { saveCookies } from "../../application/config/saveCookies.js"
import * as fs from 'fs';
import path from 'path';

import multer from 'multer';

import { COOKIE_PATH_UPLOAD } from "../../../../root_path.js" // Substitua pelo caminho correto

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(COOKIE_PATH_UPLOAD);
    // Verifica se o diretório existe, senão cria
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Define o nome do arquivo como timestamp-nome_original.extensão
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExt);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'text/plain' || path.extname(file.originalname).toLowerCase() === '.txt') {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos .txt são permitidos'));
  }
};

const upload = multer({ 
  storage: storage,
  
  limits: {
    fileSize: 5 * 1024 * 1024 // limite de 2MB
  }
});

const setCookieHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    
    if (req.file) {
      console.log('Arquivo recebido:', req.file.path);
      
      
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        saveCookies(fileContent);

        fs.readdir(COOKIE_PATH_UPLOAD, (err, files) => {
          if (err) {
            console.error("Erro ao listar arquivos do diretório:", err);
            return;
          }
    
          files.forEach((file) => {
            const filePath = path.join(COOKIE_PATH_UPLOAD, file);
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Erro ao deletar arquivo ${file}:`, err);
              } else {
                console.log(`Arquivo deletado: ${filePath}`);
              }
            });
          });
        });
        
      
      
      res.json({ 
        message: 'Cookies salvos com sucesso',
        file: {
          originalname: req.file.originalname,
          path: req.file.path,
          size: req.file.size
        }
      });
      return;
    
    } else {
      res.status(400).json({ error: 'Nenhum arquivo ou cookies enviados' });
      return;
    }
  } catch (error) {
    console.error("Erro ao processar a requisição:", error);
    
    return;
  }
}



class CookiesController {
  private readonly _router: Router = Router()
  // Dependency Injection
  private AuthService: AuthService = container.resolve(AuthService)
  private UsersService: UsersService = container.resolve(UsersService)

  //
  constructor() {
    this._configure()
  }


  //
  private _configure(): void {

    const setCookieHandlers = [
      upload.single('file') as unknown as RequestHandler,
      setCookieHandler
    ];

    this._router.post('/setcookie', setCookieHandlers);


  }

  get router(): Router {
    return this._router
  }
}

export default new CookiesController().router