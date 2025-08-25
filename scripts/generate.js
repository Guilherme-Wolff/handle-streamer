import fs from "fs"

// Defina os argumentos que o script aceitará

const template = /template/g
const Template = /Template/g

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const nameIndex = process.argv.indexOf('--name');
const overwriteIndex = process.argv.indexOf('--overwrite');

const resourceName = process.argv[nameIndex + 1];

const overwrite = process.argv[overwriteIndex + 1] || 'false'

console.log("tamanho",overwrite)

if (nameIndex === -1) {
    console.error("You need to provide a --name argument with the name of the resource.");
    process.exit(1);
}


const writeFileIfNotExist = (path_file, content) => {
    const path_replace = path_file.replace(/\\/g, '/');
    if (!overwrite.length || overwrite === 'false') {
        if (!fs.existsSync(path_replace)) {

            fs.writeFileSync(path_replace, content);
            console.log(`File '${path_replace}' created successfully.`);
        } else {
            // Se o arquivo já existir, exibe uma mensagem
            console.log(`The file '${path_replace}' already exists. It was not overwritten.`);
        }
    } else {
        fs.writeFileSync(path_replace, content);
        console.log(`File '${path_replace}' created successfully.`);
    }

}

// = = = = = = = = = = = = = = = = = = = 

const controllerTemplate = fs.readFileSync(process.cwd() + '/scripts/templates/controller/template.controller.ts', 'utf8');
const serviceTemplate = fs.readFileSync(process.cwd() + '/scripts/templates/service/template.service.ts', 'utf8');
const repositoryTemplate = fs.readFileSync(process.cwd() + '/scripts/templates/repository/template.repository.ts', 'utf8');
const entityTemplate = fs.readFileSync(process.cwd() + '/scripts/templates/entity/template.entity.ts', 'utf8');
const interfaceTemplate = fs.readFileSync(process.cwd() + '/scripts/templates/interface/ITemplateRepository.ts', 'utf8');
const dtoTemplate = fs.readFileSync(process.cwd() + '/scripts/templates/dto/template.dto.ts', 'utf8');

// = = = = = = = = = = = = = = = = = = = 

const controllerCode = controllerTemplate
    .replace(template, `${resourceName}`)
    .replace(Template, `${capitalizeFirstLetter(resourceName)}`)

writeFileIfNotExist(`${process.cwd()}/src/api/infrastructure/controllers/${resourceName}.controller.ts`, controllerCode)

// = = = = = = = = = = = = = = = = = = = 

const serviceCode = serviceTemplate
    .replace(template, `${resourceName}`)
    .replace(Template, `${capitalizeFirstLetter(resourceName)}`)

writeFileIfNotExist(`${process.cwd()}/src/api/application/services/${resourceName}.service.ts`, serviceCode)

// = = = = = = = = = = = = = = = = = = =
const repositoryCode = repositoryTemplate
    .replace(template, `${resourceName}`)
    .replace(Template, `${capitalizeFirstLetter(resourceName)}`)

writeFileIfNotExist(`${process.cwd()}/src/api/application/RepositoryImpl/${resourceName}.repository.ts`, repositoryCode)

// = = = = = = = = = = = = = = = = = = =
const entityCode = entityTemplate
    .replace(template, `${resourceName}`)
    .replace(Template, `${capitalizeFirstLetter(resourceName)}`)

writeFileIfNotExist(`${process.cwd()}/src/api/domain/entities/${resourceName}.entity.ts`, entityCode)

// = = = = = = = = = = = = = = = = = = =
const interfaceCode = interfaceTemplate
    .replace(template, `${resourceName}`)
    .replace(Template, `${capitalizeFirstLetter(resourceName)}`)

writeFileIfNotExist(`${process.cwd()}/src/api/domain/repository/I${resourceName}Repository.ts`, interfaceCode)

// = = = = = = = = = = = = = = = = = = = 

const dtoCode = dtoTemplate
    .replace(template, `${resourceName}`)
    .replace(Template, `${capitalizeFirstLetter(resourceName)}`)

writeFileIfNotExist(`${process.cwd()}/src/api/infrastructure/dto/${resourceName}.controller.ts`, dtoCode)

// = = = = = = = = = = = = = = = = = = = 





