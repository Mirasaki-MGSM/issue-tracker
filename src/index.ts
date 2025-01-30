import { initDiscord } from './discord/init.js';
import { parsedEnv } from './env.js';
import { initGitHub } from './github/init.js';

/**
  Copyright (C) 2025 Richard Hillebrand

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.

  __*THIS LICENSE APPLIES TO THE ENTIRE REPOSITORY, NOT JUST THIS FILE.*__
 */
const main = async () => {
  const { default: pkg } = await import("../package.json", {
    assert: {
      type: "json",
    },
  });

  console.log(`[${pkg.name}] v${pkg.version} - ${pkg.description}`);
  console.log(`[${pkg.name}] Author: ${pkg.author.name} <${pkg.author.email}> (${pkg.author.url})`);
  console.log(`[${pkg.name}] License: ${pkg.license}`);
  
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