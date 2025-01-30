import { initDiscord } from './discord/init';
import { parsedEnv } from './env';
import { initGitHub } from './github/init';

/**
 * This is the entry point for an application that creates a seamless bridge/connection
 * between GitHub issues and a Discord Forum channel.
 */
const main = async () => {
  console.log(`Starting with following environment:`, Object.fromEntries(Object.entries(parsedEnv).map(([key, value]) => [
    key,
    key.includes('TOKEN') || key.includes('SECRET') ? '***' : value,
  ])));
  await Promise.all([
    initDiscord(),
    initGitHub(),
  ])
}

main();