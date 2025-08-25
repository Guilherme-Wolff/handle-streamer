import { execSync } from "child_process";
import { join } from "path";
import glob from "glob"; // `glob` é uma exportação padrão, sem `{}`.


// Padrão para encontrar os arquivos JS no diretório dist
const files = glob.sync("dist/**/*.js");

files.forEach((file) => {
  const output = file; // Sobrescrever o arquivo original
  const command = `terser ${file} --compress drop_console=true --mangle --output ${output}`;
  console.log(`Processing: ${file}`);
  execSync(command, { stdio: "inherit" });
});

console.log("Terser processing complete!");
