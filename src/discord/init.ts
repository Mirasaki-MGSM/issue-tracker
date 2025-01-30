import { DiscordHandler } from './handler.js'

export const initDiscord = async (): Promise<void> => {
  await DiscordHandler.init()
}