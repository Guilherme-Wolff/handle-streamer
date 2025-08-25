#!/bin/bash
# Instala as dependências do Node.js usando npm


apt update

sudo apt install yt-dlp

apt upgrade -y

apt install npm -y

apt install npm -y

npm install -g pm2

npm install --prefix /home/jovyan/work

#
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ~/.local/bin/yt-dlp
chmod a+rx ~/.local/bin/yt-dlp 

yt-dlp -U

# Instalar o Nginx
apt-get install -y nginx

ln -s /home/jovyan/work/nginx.conf /etc/nginx/sites-enabled

#NESTAT NET-TOOLS
apt install net-tools -y

# Iniciar o serviço Nginx
service nginx start

service nginx status

#memoria ram
free -h

netstat -tuln | grep nginx

node /home/jovyan/work/index.js &

sleep 2

node /home/jovyan/work/index2.js &

sleep 2

node /home/jovyan/work/index3.js &

sleep 2

node /home/jovyan/work/index4.js &

sleep 2

node /home/jovyan/work/index5.js &


sleep 2

node /home/jovyan/work/index6.js
