import fs from 'node:fs/promises';

function startOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetweenUTC(later, earlier) {
  const a = startOfDayUTC(later).getTime();
  const b = startOfDayUTC(earlier).getTime();
  return Math.floor((a - b) / (24 * 60 * 60 * 1000));
}

export async function loadBossConfig(configPath = 'bossConfig.json') {
  const content = await fs.readFile(configPath, 'utf8');
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error('bossConfig.json must be an array');
  }
  return parsed.map(b => ({
    name: String(b.name),
    start_day: Number(b.start_day),
    end_day: Number(b.end_day)
  }));
}

export function calculateChancesForWorld(bossConfig, lastSeenByBoss, today) {
  const results = [];
  const todaySod = startOfDayUTC(today);
  const yesterday = new Date(todaySod.getTime());
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const ymdYesterday = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;

  for (const boss of bossConfig) {
    const lastSeen = lastSeenByBoss.get(boss.name) || null;

    let chance = 'low';
    if (lastSeen === ymdYesterday) {
      chance = 'noChance';
    } else if (lastSeen) {
      const lastSeenDate = new Date(`${lastSeen}T00:00:00.000Z`);
      const daysSince = daysBetweenUTC(todaySod, lastSeenDate);
      if (daysSince >= boss.start_day && daysSince <= boss.end_day) {
        chance = 'high';
      } else if (daysSince === boss.start_day - 1 || daysSince === boss.end_day + 1) {
        chance = 'medium';
      } else {
        chance = 'low';
      }
    } else {
      chance = 'low';
    }

    results.push({ bossName: boss.name, lastSeen, chance });
  }

  return results;
}


