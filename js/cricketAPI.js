// JavaScript source code
/**
 * cricketAPI.js — Cricket API Service Layer
 * Commit #3: API Config & Service Layer
 * Provider: RapidAPI (cricket-api-free-data)
 *
 * Features:
 * - Request caching (saves free tier quota)
 * - Centralized error handling
 * - Clean endpoint methods
 */

const CricketAPI = (() => {

  // ─── Cache ────────────────────────────────────────────────
  const cache = new Map();

  function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    const isExpired = Date.now() - entry.timestamp > CONFIG.CACHE_DURATION;
    if (isExpired) {
      cache.delete(key);
      return null;
    }
    return entry.data;
  }

  function setCached(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
  }

  // ─── Core Fetch ───────────────────────────────────────────
  async function request(endpoint, params = {}) {
    const url = new URL(`${CONFIG.BASE_URL}/${endpoint}`);
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.set(k, v)
    );

    const cacheKey = `${endpoint}?${url.searchParams.toString()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[API] Cache hit: ${endpoint}`);
      return cached;
    }

    console.log(`[API] Fetching: ${endpoint}`);

    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key':  CONFIG.API_KEY,
          'X-RapidAPI-Host': CONFIG.API_HOST,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setCached(cacheKey, data);
      return data;

    } catch (err) {
      // Never log full URL — it contains the API key in headers
      console.error(`[API] Error on /${endpoint}:`, err.message);
      throw err;
    }
  }

  // ─── Endpoints ────────────────────────────────────────────

  /** Get live/current matches */
  async function getLiveMatches() {
    return request('cricket-match-live-list');
  }

  /** Get upcoming matches */
  async function getUpcomingMatches() {
    return request('cricket-match-upcoming-list');
  }

  /** Get recent/completed matches */
  async function getRecentMatches() {
    return request('cricket-match-recent-list');
  }

  /** Get match scorecard by ID */
  async function getMatchScorecard(matchId) {
    return request('cricket-match-scorecard', { matchId });
  }

  /** Get series/tournament list */
  async function getSeriesList() {
    return request('cricket-series-list');
  }

  /** Get series info by ID (points table etc.) */
  async function getSeriesInfo(seriesId) {
    return request('cricket-series-info', { seriesId });
  }

  /** Get points table by series ID */
  async function getPointsTable(seriesId) {
    return request('cricket-series-points-table', { seriesId });
  }

  /** Get team squad by series ID */
  async function getTeamSquad(seriesId, teamId) {
    return request('cricket-series-squad', { seriesId, teamId });
  }

  /** Search players by name */
  async function searchPlayers(name) {
    return request('cricket-player-list', { playerName: name });
  }

  /** Get player info by ID */
  async function getPlayerInfo(playerId) {
    return request('cricket-player-info', { playerId });
  }

  /** Clear cache manually */
  function clearCache() {
    cache.clear();
    console.log('[API] Cache cleared');
  }

  /** Get cache stats (for debugging) */
  function getCacheStats() {
    return {
      entries: cache.size,
      keys: [...cache.keys()],
    };
  }

  // ─── Public API ───────────────────────────────────────────
  return {
    getLiveMatches,
    getUpcomingMatches,
    getRecentMatches,
    getMatchScorecard,
    getSeriesList,
    getSeriesInfo,
    getPointsTable,
    getTeamSquad,
    searchPlayers,
    getPlayerInfo,
    clearCache,
    getCacheStats,
  };

})();