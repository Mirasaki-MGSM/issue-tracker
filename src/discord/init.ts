import { ChannelType, Client, ForumChannel, GatewayIntentBits } from 'discord.js'
import { parsedEnv } from '../env';

let _client: Client | null = null

export const initDiscordClient = () => {
  if (!_client) {
    _client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    })
  }

  return;
}

export const getDiscordClient = (): Promise<Client<true>> => {
  return new Promise((resolve, reject) => {
    if (!_client) {
      reject(new Error('Discord client not initialized.'))
      return;
    }

    if (_client.isReady()) {
      resolve(_client)
      return;
    }

    _client.login(parsedEnv.DISCORD_CLIENT_TOKEN)
    _client.once('ready', (c) => {
      console.log(`Discord client ready and logged in as ${c.user.username}.`)
      resolve(c)
    })
  });
}

export const getDiscordChannel = async (): Promise<ForumChannel> => {
  const client = await getDiscordClient();
  const guild = client.guilds.cache.get(parsedEnv.DISCORD_GUILD_ID);

  if (!guild) {
    throw new Error(`Discord guild with ID ${parsedEnv.DISCORD_GUILD_ID} not found.`);
  }

  const channel = guild.channels.cache.get(parsedEnv.DISCORD_CHANNEL_ID);

  if (!channel) {
    throw new Error(`Discord channel with ID ${parsedEnv.DISCORD_CHANNEL_ID} not found.`);
  }

  if (!channel.isThreadOnly()) {
    throw new Error(`Discord channel with ID ${parsedEnv.DISCORD_CHANNEL_ID} is not a forum channel.`);
  }

  if (channel.type === ChannelType.GuildMedia) {
    throw new Error(`Discord channel with ID ${parsedEnv.DISCORD_CHANNEL_ID} is a media channel.`);
  }

  return channel;
}

export const initDiscord = async (): Promise<void> => {
  initDiscordClient()
  await getDiscordClient()
  await getDiscordChannel()
}