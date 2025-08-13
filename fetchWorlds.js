export async function fetchWorlds() {
  const response = await fetch('https://api.tibiadata.com/v4/worlds');
  if (!response.ok) {
    throw new Error(`Failed to fetch worlds: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  // Use only regular (non-tournament) worlds per API shape: worlds.regular_worlds[].name
  const regularWorlds = Array.isArray(data?.worlds?.regular_worlds) ? data.worlds.regular_worlds : [];
  return regularWorlds.map(w => w.name).filter(Boolean);
}


