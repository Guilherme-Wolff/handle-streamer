import * as fs from 'fs';
import swaggerUI from "swagger-ui-express"
import  { Express} from 'express'

export async function readJSONDoc(caminho: string): Promise<any> {
  return new Promise((resolve, reject) => {
    fs.readFile(caminho, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function useJsonDoc(caminho: string,App:Express): Promise<any> {
  const jsonData = await readJSONDoc(caminho);
  App.use("/api-docs",swaggerUI.serve,swaggerUI.setup(jsonData))
  return jsonData;
}

/*(async () => {
  const caminhoArquivo = 'dados.json'; // Substitua pelo caminho do seu arquivo JSON

  try {
    const jsonData = await readJSONDoc(caminhoArquivo);
    console.log('Dados do JSON lidos e armazenados na variável jsonData:', jsonData);
  } catch (error) {
    console.error('Erro ao ler e processar o arquivo JSON:', error);
  }
})();*/
