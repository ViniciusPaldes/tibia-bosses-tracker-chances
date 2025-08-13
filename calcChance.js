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
        ...b,
        name: String(b.name),
        start_day: Number(b.start_day),
        end_day: Number(b.end_day)
    }));
}

export function calculateChancesForWorld(bossConfig, lastSeenByBoss, today) {
    const results = [];
    const todaySod = startOfDayUTC(today);

    for (const boss of bossConfig) {
        const lastSeen = lastSeenByBoss.get(boss.name) || null;

        let chance = 'low';
        let daysSince = null;
        if (lastSeen) {
            const lastSeenDate = new Date(`${lastSeen}T00:00:00.000Z`);
            daysSince = daysBetweenUTC(todaySod, lastSeenDate) +1; // 0 = killed today

            if (daysSince === 0) {
                chance = 'no chance';
            } else if (daysSince >= boss.start_day && daysSince <= boss.end_day) {
                chance = 'high';
            } else if (daysSince === boss.start_day - 1 || daysSince === boss.end_day + 1) {
                chance = 'medium';
            } else if (daysSince === boss.start_day - 2 || daysSince === boss.end_day + 2) {
                chance = 'low';
            } else if (daysSince === boss.start_day - 3 || daysSince === boss.end_day + 3) {
                chance = 'no chance';
            } else if (daysSince > boss.end_day + 3) {
                chance = 'Lost Track';
            } else {
                // More than 3 days before the window (daysSince < start_day - 3)
                chance = 'no chance';
            }
        } else {
            chance = 'low';
        }

        results.push({ ...boss, lastSeen, daysSince, chance });
    }

    return results;
}


