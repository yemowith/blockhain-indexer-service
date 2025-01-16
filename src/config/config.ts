export const config = {
  REDIS: {
    HOST: process.env.REDIS_HOST,
    PORT: process.env.REDIS_PORT,
    PASSWORD: process.env.REDIS_PASSWORD,
  },
  AWS: {
    ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
    REGION: process.env.AWS_REGION,
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET: process.env.AWS_S3_BUCKET,
    S3_ENDPOINT: process.env.AWS_S3_ENDPOINT,
  },
  PG: {
    HOST: process.env.PG_HOST,
    PORT: process.env.PG_PORT,
    USER: process.env.PG_USER,
    PASSWORD: process.env.PG_PASSWORD,
  },
  BASE_STORAGE_PATH: process.env.BASE_STORAGE_PATH,
  ENABLE_LOGGING: process.env.ENABLE_LOGGING === 'true',
  CHAIN_ID: process.env.CHAIN_ID,
  RPC_URL: process.env.RPC_URL,
  ADDRESS_ZERO: '0x0000000000000000000000000000000000000000',
}

export type Config = typeof config
