import dotenv from 'dotenv';

const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const envPath = envArg ? envArg.split('=')[1] : './.env.local';

console.info(`Loading environment variables from ${envPath}`);

dotenv.config({ path: envPath })

const {
  NODE_ENV = 'development',

  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_TOKEN,
  DISCORD_GUILD_ID,
  DISCORD_CHANNEL_ID,

  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME,
  GITHUB_WEBHOOK_SECRET,
} = process.env;

const requiredEnvRaw = {
  NODE_ENV,

  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_TOKEN,
  DISCORD_GUILD_ID,
  DISCORD_CHANNEL_ID,

  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME,
  GITHUB_WEBHOOK_SECRET,
};

for (const key of Object.keys(requiredEnvRaw)) {
  if (!requiredEnvRaw[key as keyof typeof requiredEnvRaw]) {
    throw new Error(`The ${key} environmental variable is required but was not provided. Please update your .env file.`);
  }
}

export const requiredEnv = requiredEnvRaw as Record<keyof typeof requiredEnvRaw, string>;

const optionalEnvRaw = {
};

export const optionalEnv = optionalEnvRaw as Record<keyof typeof optionalEnvRaw, string | undefined>;

const resolveNodeEnv = (key: string): 'development' | 'production' => {
  if (key === 'development' || key === 'production') {
    return key;
  }

  console.warn(`!!! The NODE_ENV value of ${key} is not recognized. Defaulting to 'development'.`);
  
  return 'development';
}

export const parsedEnv = {
  ...requiredEnv,
  ...optionalEnv,
  NODE_ENV: resolveNodeEnv(requiredEnv.NODE_ENV),
};
