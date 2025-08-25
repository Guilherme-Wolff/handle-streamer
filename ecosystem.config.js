module.exports = {
  apps: [{
    name: "app",
    script: "./dist/index.js", // Ajuste para o caminho correto do seu arquivo principal
    instances: 1,
    env: {
      NODE_ENV: "dev",
      PORT: process.env.PORT || 8080
    }
  }]
};