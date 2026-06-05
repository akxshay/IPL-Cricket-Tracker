/**
 * cricketAPI.js — Cricket API Service Layer
 * Fixed: exact endpoints from Cricket API Free Data (RapidAPI)
 */

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

  // ─── Endpoints ────────────────────────────────────────────

  /** Live Scores */
  async function getLiveMatches() {
    return request('cricket-livescores2');
  }

  /** Fixtures - All */
  async function getAllFixtures() {
    return request('cricket-fixtures2');
  }

  /** Fixtures - League (IPL) */
  async function getLeagueFixtures() {
    return request('cricket-fixtures-leaguelist2');
  }

  /** Schedules - All */
  async function getAllSchedules() {
    return request('cricket-schedule2');
  }

  /** Schedules - League */
  async function getLeagueSchedules() {
    return request('cricket-schedule-leaguelist2');
  }

  /** Matches - Upcoming */
  async function getUpcomingMatches() {
    return request('cricket-matches-upcoming2');
  }

  /** Matches - Recent */
  async function getRecentMatches() {
    return request('cricket-matches-recent2');
  }

  /** Matches - Live */
  async function getLiveMatchList() {
    return request('cricket-matches-live2');
  }

  /** Match - Scoreboard */
  async function getMatchScoreboard(matchId) {
    return request('cricket-match-scoreboard2', { matchId });
  }

  /** Match - Info */
  async function getMatchInfo(matchId) {
    return request('cricket-match-info2', { matchId });
  }

  /** Series - All */
  async function getAllSeries() {
    return request('cricket-series2');
  }

  /** Series - League */
  async function getLeagueSeries() {
    return request('cricket-series-leaguelist2');
  }

  /** Series - Info */
  async function getSeriesInfo(seriesId) {
    return request('cricket-series-list2', { seriesId });
  }

  /** Teams - All */
  async function getAllTeams() {
    return request('cricket-teams2');
  }

  /** Teams - League */
  async function getLeagueTeams() {
    return request('cricket-teams-leaguelist2');
  }

  /** Players - Get List */
  async function getAllPlayers(teamId) {
    return request('cricket-players2', { teamid: teamId });
  }

  /** Clear cache */
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
    getSeriesInfo,
    getAllTeams,
    getLeagueTeams,
    getAllPlayers,
    clearCache,
  };

})();