const CricketAPI = (() => {

  const cache = new Map();

  function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    const isExpired = Date.now() - entry.timestamp > CONFIG.CACHE_DURATION;
    if (isExpired) { cache.delete(key); return null; }
    return entry.data;
  }

  function setCached(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
  }

  async function request(path, params = {}) {
    const url = new URL(`https://cricket-api-free-data.p.rapidapi.com/${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const cacheKey = url.toString();
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[API] Cache hit: ${path}`);
      return cached;
    }

    console.log(`[API] Fetching: ${path}`);

    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key':  CONFIG.API_KEY,
          'x-rapidapi-host': 'cricket-api-free-data.p.rapidapi.com',
          'Content-Type':    'application/json',
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const data = await res.json();
      setCached(cacheKey, data);
      return data;

    } catch (err) {
      console.error(`[API] Error on /${path}:`, err.message);
      throw err;
    }
  }

  async function getLiveMatches() {
    return request('cricket-livescores');
  }

  async function getAllFixtures() {
    return request('cricket-fixtures');
  }

  async function getLeagueFixtures() {
    return request('cricket-fixtures-leaguelist');
  }

  async function getAllSchedules() {
    return request('cricket-schedule');
  }

  async function getLeagueSchedules() {
    return request('cricket-schedule-leaguelist');
  }

  async function getUpcomingMatches() {
    return request('cricket-matches-upcoming');
  }

  async function getRecentMatches() {
    return request('cricket-matches-recent');
  }

  async function getLiveMatchList() {
    return request('cricket-matches-live');
  }

  async function getMatchScoreboard(matchId) {
    return request('cricket-match-scoreboard2', { matchId });
  }

  async function getMatchInfo(matchId) {
    return request('cricket-match-info2', { matchId });
  }

  async function getAllSeries() {
    return request('cricket-series');
  }

  async function getLeagueSeries() {
    return request('cricket-series-leaguelist');
  }

  async function getAllTeams() {
    return request('cricket-teams');
  }

  async function getLeagueTeams() {
    return request('cricket-teams-leaguelist');
  }

  async function getAllPlayers(teamId) {
    return request('cricket-players', { teamid: teamId });
  }

  function clearCache() {
    cache.clear();
    console.log('[API] Cache cleared');
  }

  return {
    getLiveMatches,
    getAllFixtures,
    getLeagueFixtures,
    getAllSchedules,
    getLeagueSchedules,
    getUpcomingMatches,
    getRecentMatches,
    getLiveMatchList,
    getMatchScoreboard,
    getMatchInfo,
    getAllSeries,
    getLeagueSeries,
    getAllTeams,
    getLeagueTeams,
    getAllPlayers,
    clearCache,
  };

})();