import * as fs from 'fs';
import path from 'path';

import {COOKIE_PATH} from "../../../../root_path.js"// Substitua pelo caminho correto

export const saveCookies = (cookies) => {
    const filePath = path.join(COOKIE_PATH);
    
    fs.writeFile(filePath, cookies, 'utf8', (err) => {
        if (err) {
            console.error('Erro ao salvar os cookies:', err);
        } else {
            console.log('Cookies salvos com sucesso em', filePath);
        }
    });
};