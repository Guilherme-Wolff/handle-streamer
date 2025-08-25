FROM node:alpine

# Instala dependências necessárias, como curl e sudo (se necessário)
RUN apk add --no-cache curl sudo

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia o package.json e package-lock.json para o contêiner
COPY package*.json ./

# Instala as dependências usando o npm ci (mais eficiente para ambientes de CI/CD)
RUN npm ci && npm cache clean --force && npm install -g typescript

# Instale o PM2 globalmente
RUN npm install -g pm2

RUN apk update

RUN apk update && \
    apk add --no-cache curl ffmpeg python3

RUN mkdir -p /usr/bin/
# Baixa o yt-dlp, dá permissão e lista o arquivo
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/bin/yt-dlp \
    && sudo chmod a+rx /usr/bin/yt-dlp \
    && ls -l /usr/bin/yt-dlp 

# Define o usuário para rodar o contêiner (não root)
USER node

# Copia o restante dos arquivos da aplicação para o contêiner com as permissões corretas
COPY --chown=node:node . .

# Separe o build do start (eram um único comando)
RUN npm run build

# Exponha a porta que sua aplicação usa
ENV PORT=8080
ENV PROXY_BUNNY=https://proxy-bunkr-file-qphjp.bunny.run/
EXPOSE ${PORT}

# Comando para iniciar a aplicação
CMD ["node","dist/index.js"]
