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
//   const worlds = await fetchWorlds();
    const worlds = ["Venebra"];

  const today = startOfDayUTC(new Date());
  const todayYmd = formatDateToUTCString(today);

  const dataRoot = path.join('data');
  await ensureDir(dataRoot);

  console.log(`Loaded bossConfig with ${bossConfig.length} bosses.`);
  console.log(`Fetched ${worlds.length} worlds. First 5: ${worlds.slice(0, 5).join(', ')}`);

  let filesWritten = 0;

  await processInBatches(worlds, 6, async (worldName) => {
    const { lastSeenByBoss, hadAnyData } = await getLastSeenByBossForWorld(worldName, bossNames, 180, today);

    const worldDir = path.join(dataRoot, worldName);
    await ensureDir(worldDir);
    const outFile = path.join(worldDir, `${todayYmd}.json`);

    if (!hadAnyData) {
      console.log(`World '${worldName}' has no data for the last 180 days. Writing empty array to ${outFile}.`);
      await writeJson(outFile, []);
      filesWritten++;
      console.log(`Wrote ${outFile} (0 bosses).`);
      return;
    }

    const results = calculateChancesForWorld(bossConfig, lastSeenByBoss, today);
    await writeJson(outFile, results);
    filesWritten++;
    console.log(`Wrote ${outFile} (${results.length} bosses).`);
  });

  console.log(`Total files written: ${filesWritten}`);
  if (filesWritten === 0) {
    console.warn('No files were written. This may cause no changes to commit.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


