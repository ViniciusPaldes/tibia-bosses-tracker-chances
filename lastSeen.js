function formatDateUTC(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function fetchKillStatsFor(worldName, dateString) {
    const url = `https://raw.githubusercontent.com/tibiamaps/tibia-kill-stats/refs/heads/main/data/${encodeURIComponent(worldName.toLocaleLowerCase())}/${dateString}.json`;
    const res = await fetch(url);
    if (!res.ok) {
        console.log("Error", res, "url", url);
        // Treat non-200 (e.g., 404) as no data for that date
        return null;
    }
    try {
        return await res.json();
    } catch {
        return null;
    }
}

export async function getLastSeenByBossForWorld(worldName, bossNames, maxDays = 365, baseDate) {
    const today = baseDate instanceof Date ? baseDate : new Date();
    const bossNameSet = new Set(bossNames);
    const lastSeenByBoss = new Map();
    let hadAnyData = false;

    for (let i = 1; i < maxDays +1; i++) {
        const checkDate = new Date(Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate()
        ));
        checkDate.setUTCDate(checkDate.getUTCDate() - i);
        const ymd = formatDateUTC(checkDate);

        const data = await fetchKillStatsFor(worldName, ymd);
        if (Array.isArray(data)) {
            hadAnyData = true;
            for (const entry of data) {
                const race = typeof entry?.race === 'string' ? entry.race : '';
                if (!race || race[0] !== race[0]?.toUpperCase()) continue; // Only consider capitalized
                if (!bossNameSet.has(race)) continue; // Only bosses we track
                if (!lastSeenByBoss.has(race)) {
                    lastSeenByBoss.set(race, ymd);
                }
            }
            if (lastSeenByBoss.size === bossNameSet.size) {
                break; // Found all bosses
            }
        }
        // If null/invalid, continue to older dates without breaking
    }

    return { lastSeenByBoss, hadAnyData };
}

export function formatDateToUTCString(date) {
    return formatDateUTC(date);
}


