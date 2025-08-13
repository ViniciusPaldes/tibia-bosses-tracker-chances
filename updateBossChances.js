import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchWorlds } from './fetchWorlds.js';
import { getLastSeenByBossForWorld, formatDateToUTCString } from './lastSeen.js';
import { loadBossConfig, calculateChancesForWorld } from './calcChance.js';

function startOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJson(filePath, data) {
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content + '\n');
}

async function processInBatches(items, concurrency, worker) {
  const results = [];
  let index = 0;
  const runners = new Array(Math.min(concurrency, items.length)).fill(null).map(async () => {
    while (true) {
      const current = index++;
      if (current >= items.length) return;
      results[current] = await worker(items[current], current);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const bossConfig = await loadBossConfig('bossConfig.json');
  const bossNames = bossConfig.map(b => b.name);
  const worlds = await fetchWorlds();

  const today = startOfDayUTC(new Date());
  const todayYmd = formatDateToUTCString(today);

  const dataRoot = path.join('data');
  await ensureDir(dataRoot);

  await processInBatches(worlds, 6, async (worldName) => {
    const { lastSeenByBoss, hadAnyData } = await getLastSeenByBossForWorld(worldName, bossNames, 365, today);
    if (!hadAnyData) {
      return; // Skip world if no data found in last 365 days
    }

    const results = calculateChancesForWorld(bossConfig, lastSeenByBoss, today);
    const worldDir = path.join(dataRoot, worldName);
    await ensureDir(worldDir);
    const outFile = path.join(worldDir, `${todayYmd}.json`);
    await writeJson(outFile, results);
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


