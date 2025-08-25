import axios from 'axios';
import * as esprima from 'esprima';
import * as estraverse from 'estraverse';

/* ALIAS
 https://dash.bunkr.cr/js/servers.js
 */

export let BUNKR_ALIAS: any = {
  15: "Pizza",
  16: "Burger",
  17: "Nugget",
  18: "Fries",
  19: "Meatballs",
  20: "Milkshake",
  21: "Kebab™",
  22: "Taquito",
  23: "Nachos",
  24: "Ramen",
  25: "Wiener",
  26: "Soup",
  27: "Wings",
  28: "Bacon",
  29: "Sushi",
  30: "Beer"
}

const downloadAndExtractAliases = async (url: string): Promise<string[] | null> => {
  try {
    // 1. Baixar o conteúdo do JS da URL
    const response = await axios.get(url);
    const jsCode = response.data;

    // 2. Analisar o código JavaScript em um AST
    const ast = esprima.parseScript(jsCode, { range: true });

    // 3. Procurar pelo objeto de mapeamento de aliases
    let aliases: Record<number, string> | null = null;
    estraverse.traverse(ast, {
      enter(node) {
        // Procurar por um ObjectExpression (objeto de mapeamento)
        if (node.type === 'ObjectExpression') {
          aliases = {};
          for (const property of node.properties) {
            if (
              property.type === 'Property' &&
              property.key.type === 'Literal' &&
              !isNaN(Number(property.key.value)) && // Verifica se a chave pode ser convertida em número
              property.value.type === 'Literal' &&
              typeof property.value.value === 'string'
            ) {
              const keyAsNumber = Number(property.key.value); // Converte a chave para número
              aliases[keyAsNumber] = property.value.value as string;
            }
          }
        }
      },
    });

    // 4. Verificar se encontramos os aliases
    if (aliases !== null && Object.keys(aliases).length > 0) {
      
      return aliases;
    } else {
      console.log('Objeto de aliases não encontrado.');
      return null;
    }
  } catch (error) {
    console.error('Erro ao baixar ou processar o JavaScript:', error);
    return null;
  }
};

// URL do JS a ser baixado
const jsUrl = 'https://dash.bunkr.cr/js/servers.js';
const main = async () => {
  BUNKR_ALIAS = await downloadAndExtractAliases(jsUrl);
  
}

main()

