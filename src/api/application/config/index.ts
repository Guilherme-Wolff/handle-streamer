import dotenv from 'dotenv'
dotenv.config()


export const config = {
  MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true' ? 'true' : 'false',
  URL_POSTGRES:String(process.env.URL_POSTGRES),
  URL_POSTGRES2:String(process.env.URL_POSTGRES2),
  NODE_ENV: process.env.NODE_ENV || 'dev',
  PORT: Number(process.env.PORT) || 3000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '123456789',
  DB_NAME: process.env.DB_NAME || 'test',

  DB_HOST_SECONDARY: process.env.DB_HOST_SECONDARY || 'localhost',
  DB_PORT_SECONDARY: Number(process.env.DB_PORT_SECONDARY) || 5432,
  DB_USER_SECONDARY: process.env.DB_USER_SECONDARY || 'guilherme',
  DB_PASSWORD_SECONDARY: process.env.DB_PASSWORD_SECONDARY || '123456789',
  DB_NAME_SECONDARY: process.env.DB_NAME_SECONDARY || 'test',

  MAX_STREAMERS:Number(process.env.MAX_STREAMERS),

  BCRYPT_SECRET: process.env.BCRYPT_SECRET,

  redis: {
    url: process.env.REDIS_URL,
  },
  auth: {
    secret: process.env.AUTH_SECRET || 'secret',
    expiresIn: process.env.AUTH_EXPIRES_IN || '7d',
  },
  PIXELDRAIN_KEY: String(process.env.PIXELDRAIN_API_KEY),

  PROXY_BUNNY:String(process.env.PROXY_BUNNY),
  

  processManager: {
    MAX_TIME_LIVE: process.env.MAX_TIME_LIVE || `${3600}`,
    TIKTOK_ONLINE_STATUS: Number(process.env.TIKTOK_ONLINE_STATUS || 2),
    EXTENSION_VIDEO_DEFAULT: process.env.EXTENSION_VIDEO_DEFAULT
  },
  BUCKET_FILES: {
    PIXELDRAIN_API_KEY: process.env.PIXELDRAIN_API_KEY || '',
    BUNKR_TOKEN:String(process.env.BUNKR_TOKEN)
  }
}
