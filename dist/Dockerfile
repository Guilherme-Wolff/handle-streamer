# Usando uma imagem base do Node.js, versão 22, com Debian Slim
FROM node:22-slim

# Instalar pacotes necessários
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    python3 \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Baixar e instalar o yt-dlp
RUN mkdir -p /root/.nix-profile/bin/ \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /root/.nix-profile/bin/yt-dlp \
    && chmod a+rx /root/.nix-profile/bin/yt-dlp \
    && ls -l /root/.nix-profile/bin/yt-dlp

# Definir o diretório de trabalho
WORKDIR /app

# Copiar o arquivo package.json e pnpm-lock.yaml (ou arquivos relacionados) para o diretório de trabalho
COPY package.json pnpm-lock.yaml ./

# Instalar dependências usando pnpm
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copiar o restante dos arquivos do projeto
COPY . .

# Rodar o build do projeto (caso tenha um script de build configurado)
RUN npm run build

# Definir o comando para rodar o aplicativo
CMD ["npm", "run", "start"]
