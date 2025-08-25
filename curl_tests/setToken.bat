@echo off

REM Fazer a solicitação e salvar a resposta no arquivo response.json
curl -X POST -H "Content-Type: application/json" -d @login.json http://localhost:5000/api/v1/auth/login -o response.json

REM Extrair o valor do tokenJwt da resposta JSON
for /f "tokens=3 delims=:{}" %%a in ('type response.json ^| find "tokenJwt"') do set "tokenJwt=%%a"

REM Definir a variável de ambiente TOKEN_JWT com o valor do tokenJwt
setx TOKEN_JWT %tokenJwt%

REM Exibir a variável de ambiente criada
echo tokenJwt=%tokenJwt%

REM Limpar o arquivo de resposta (opcional)
del response.json
