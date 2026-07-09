/**
 * app.js — IPL Tracker Main Controller
 */

let lastPage = 'home';
let scorecardFrom = 'live';
let historyView = 'seasons';
let activeScheduleTab = 'upcoming';
let allPlayers = [];

const ALL_MATCHES = window.OFFLINE_MATCHES || [];
const TEAM_LOGOS = window.TEAM_LOGOS || {};
const PLAYER_PROFILES = window.PLAYER_PROFILES || {};

const IPL_TEAMS = [
  { key:'mi', name:'Mumbai Indians', abbr:'MI', color:'#004BA0' },
  { key:'csk', name:'Chennai Super Kings', abbr:'CSK', color:'#FFCC00' },
  { key:'rcb', name:'Royal Challengers Bangalore', abbr:'RCB', color:'#D71920' },
  { key:'kkr', name:'Kolkata Knight Riders', abbr:'KKR', color:'#3A225D' },
  { key:'srh', name:'Sunrisers Hyderabad', abbr:'SRH', color:'#FF822A' },
  { key:'dc', name:'Delhi Capitals', abbr:'DC', color:'#00A0E2' },
  { key:'rr', name:'Rajasthan Royals', abbr:'RR', color:'#EA1A85' },
  { key:'pbks', name:'Punjab Kings', abbr:'PBKS', color:'#EDED2D' },
  { key:'gt', name:'Gujarat Titans', abbr:'GT', color:'#1C4B9C' },
  { key:'lsg', name:'Lucknow Super Giants', abbr:'LSG', color:'#A72056' },
  { key:'gl', name:'Gujarat Lions', abbr:'GL', color:'#E04F16' },
  { key:'rps', name:'Rising Pune Supergiant', abbr:'RPS', color:'#D11D9B' },
  { key:'pw', name:'Pune Warriors', abbr:'PW', color:'#2F9BE3' },
  { key:'ktk', name:'Kochi Tuskers Kerala', abbr:'KTK', color:'#E35417' },
  { key:'dd', name:'Delhi Daredevils', abbr:'DD', color:'#004C93' },
  { key:'deccan', name:'Deccan Chargers', abbr:'DEC', color:'#D1C060' }
];

// NAV
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navbar = document.getElementById('navbar');
const allNavLinks = document.querySelectorAll('.nav-link');
const allPages = document.querySelectorAll('.page');

hamburger.addEventListener('click', () => { hamburger.classList.toggle('open'); navLinks.classList.toggle('open'); });
navLinks.addEventListener('click', () => { hamburger.classList.remove('open'); navLinks.classList.remove('open'); });
window.addEventListener('scroll', () => { navbar.classList.toggle('scrolled', window.scrollY > 20); });

function navigateTo(pageId, fromPage) {
  if (fromPage) lastPage = fromPage;
  allPages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add('active');
  allNavLinks.forEach(link => { link.classList.toggle('active', link.dataset.page === pageId); });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pageId === 'live') loadLiveScores();
  if (pageId === 'schedule') loadSchedule();
  if (pageId === 'points') loadPointsTable(2024);
  if (pageId === 'teams') loadTeams();
  if (pageId === 'players') initPlayers();
  if (pageId === 'history') loadHistory();
}

document.addEventListener('click', e => {
  const target = e.target.closest('[data-page]');
  if (target) { e.preventDefault(); navigateTo(target.dataset.page); }
});

document.getElementById('live-refresh-btn').addEventListener('click', loadLiveScores);
document.getElementById('schedule-refresh-btn').addEventListener('click', loadSchedule);
document.getElementById('scorecard-back-btn').addEventListener('click', () => navigateTo(lastPage));
document.getElementById('history-back-btn').addEventListener('click', () => { historyView = 'seasons'; loadHistory(); });
document.getElementById('team-profile-back-btn').addEventListener('click', () => navigateTo('teams'));
document.getElementById('player-modal-close').addEventListener('click', () => { document.getElementById('player-modal').style.display = 'none'; });

// HELPERS
function showSpinner(id, cols = true) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="spinner-wrap" style="${cols ? 'grid-column:1/-1' : ''}"><div class="spinner"></div><p class="spinner-text">Loading...</p></div>`;
}
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error</h3><p>${msg}</p></div>`;
}
function showEmpty(id, msg, icon = '🏏') {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>No data</h3><p>${msg}</p></div>`;
}
function formatDate(dateStr) {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function getTeamInfo(name) {
  const t = IPL_TEAMS.find(x => x.name.toLowerCase() === name?.toLowerCase() || name?.toLowerCase().includes(x.name.toLowerCase()));
  return t || { color: '#FF6B00', abbr: name.substring(0,3).toUpperCase(), name };
}
function getPlayerImg(name) {
  if (PLAYER_PROFILES[name] && PLAYER_PROFILES[name].imgUrl) return PLAYER_PROFILES[name].imgUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=150`;
}

// LIVE & SCHEDULE
async function loadLiveScores() {
  showSpinner('live-container');
  try {
    const data = await CricketAPI.getLiveMatches();
    const matches = data?.response || data?.data || [];
    if (!matches.length) throw new Error();
    document.getElementById('live-container').innerHTML = matches.map(m => renderLiveMatchCard(m, true, 'live')).join('');
  } catch(err) { showEmpty('live-container', 'No live matches right now.', '🔴'); }
}
function loadSchedule() {
  const tabs = document.getElementById('schedule-tabs');
  if (tabs) {
    tabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === activeScheduleTab);
      btn.onclick = () => {
        activeScheduleTab = btn.dataset.tab;
        loadSchedule();
      };
    });
  }
  if (activeScheduleTab === 'upcoming') loadUpcomingMatches();
  else loadRecentMatches();
}
async function loadUpcomingMatches() {
  showSpinner('schedule-container');
  try {
    const data = await CricketAPI.getUpcomingMatches();
    const matches = data?.response || data?.data || [];
    if (!matches.length) throw new Error();
    document.getElementById('schedule-container').innerHTML = matches.map(m => renderLiveMatchCard(m, false, 'schedule')).join('');
  } catch(err) { showEmpty('schedule-container', 'No upcoming matches.', '📅'); }
}
async function loadRecentMatches() {
  const recent = [...ALL_MATCHES].reverse().slice(0, 10);
  document.getElementById('schedule-container').innerHTML = recent.map(m => renderOfflineMatchCard(m, 'schedule')).join('');
}
function renderLiveMatchCard(match, isLive, fromPage) {
  const team1  = match.team1 || match.t1 || match.teamInfo?.[0]?.name || 'Team 1';
  const team2  = match.team2 || match.t2 || match.teamInfo?.[1]?.name || 'Team 2';
  const score1 = match.score?.[0]?.r ? `${match.score[0].r}/${match.score[0].w} (${match.score[0].o} ov)` : '';
  const score2 = match.score?.[1]?.r ? `${match.score[1].r}/${match.score[1].w} (${match.score[1].o} ov)` : '';
  const status = match.status || match.ms || match.result || '';
  const venue  = match.venue || match.ground || '';
  const type   = match.matchType || match.type || 'T20';
  const matchId = match.id || match.matchid || '';
  const isUp = !score1 && !score2 && (!status || status.toLowerCase().includes('upcoming'));

  return `
    <div class="match-card ${isLive ? 'match-card--live' : ''}" onclick="openScorecard('${matchId}', '${team1}', '${team2}', '${fromPage}')">
      ${isLive ? '<div class="match-live-badge"><span class="live-dot"></span> LIVE</div>' : ''}
      <div class="match-type-badge">${type.toUpperCase()}</div>
      <div class="match-teams">
        <div class="match-team"><span class="team-name">${team1}</span>${score1 ? `<span class="team-score">${score1}</span>` : ''}</div>
        <div class="match-vs">VS</div>
        <div class="match-team match-team--right"><span class="team-name">${team2}</span>${score2 ? `<span class="team-score">${score2}</span>` : ''}</div>
      </div>
      ${status ? `<div class="match-status">${status}</div>` : ''}
      <div class="match-meta">
        <div style="display:flex;flex-direction:column;gap:4px">
          ${venue ? `<span>🏟️ ${venue}</span>` : ''}
        </div>
        ${!isUp ? '<span class="match-scorecard-link">Scorecard →</span>' : ''}
      </div>
    </div>`;
}

// HISTORY
function loadHistory() {
  const backBtn = document.getElementById('history-back-btn');
  if (historyView === 'seasons') {
    backBtn.style.display = 'none';
    document.getElementById('history-title').textContent = '🏆 IPL Seasons';
    const seasonsMap = {};
    ALL_MATCHES.forEach(m => {
      const year = new Date(m.date).getFullYear();
      if (!seasonsMap[year]) seasonsMap[year] = { year, matches: 0, venues: new Set(), teams: new Set(), winner: 'TBD' };
      seasonsMap[year].matches++;
      if (m.venue) seasonsMap[year].venues.add(m.venue);
      if (m.t1) seasonsMap[year].teams.add(m.t1);
      if (m.t2) seasonsMap[year].teams.add(m.t2);
      if (seasonsMap[year].matches > 50) seasonsMap[year].winner = m.winner;
    });

    const seasons = Object.values(seasonsMap).sort((a,b) => b.year - a.year);
    document.getElementById('history-subtitle').textContent = `Showing all ${seasons.length} seasons from IPL Database`;

    const grid = seasons.map(s => `
      <div class="season-card" onclick="loadSeasonMatches('${s.year}')">
        <span class="season-status-badge completed">✓ Completed</span>
        <div class="season-year">${s.year}</div>
        <div class="season-label">Indian Premier League</div>
        <div class="season-winner-wrap">
          <div class="season-trophy">🏆</div>
          <div class="season-winner-info"><div class="season-winner-label">Winner</div><div class="season-winner-name">${s.winner || 'N/A'}</div></div>
        </div>
        <div class="season-meta">
          <div class="season-meta-item"><div class="season-meta-value">${s.matches}</div><div class="season-meta-label">Matches</div></div>
          <div class="season-meta-item"><div class="season-meta-value">${s.teams.size}</div><div class="season-meta-label">Teams</div></div>
        </div>
      </div>`).join('');
    document.getElementById('history-container').innerHTML = `<div class="seasons-grid">${grid}</div>`;
  }
}
function loadSeasonMatches(year) {
  historyView = 'matches';
  document.getElementById('history-title').textContent = `🏆 IPL ${year}`;
  document.getElementById('history-back-btn').style.display = '';
  const matches = ALL_MATCHES.filter(m => new Date(m.date).getFullYear() === parseInt(year));
  document.getElementById('history-subtitle').textContent = `${matches.length} matches played in ${year}`;
  document.getElementById('history-container').innerHTML = `<div class="season-matches-wrap"><div class="season-match-list">${matches.map(m => renderOfflineMatchCard(m, 'history')).join('')}</div></div>`;
}
function renderOfflineMatchCard(m, fromPage) {
  return `
    <div class="match-card" onclick="openOfflineScorecard('${m.id}', '${fromPage}')">
      <div class="match-type-badge">T20</div>
      <div class="match-teams">
        <div class="match-team"><span class="team-name">${m.t1}</span></div>
        <div class="match-vs">VS</div>
        <div class="match-team match-team--right"><span class="team-name">${m.t2}</span></div>
      </div>
      <div class="match-status">${m.winner ? `${m.winner} won` : (m.result || 'Match Ended')}</div>
      <div class="match-meta">
        <div style="display:flex;flex-direction:column;gap:4px">
          ${m.venue ? `<span>🏟️ ${m.venue}${m.city ? `, ${m.city}` : ''}</span>` : ''}
          ${m.date  ? `<span>📅 ${formatDate(m.date)}</span>`  : ''}
        </div>
        <span class="match-scorecard-link">Scorecard →</span>
      </div>
    </div>`;
}

// SCORECARD (Restored functions)
function openScorecard(matchId, t1, t2, fromPage) {
  scorecardFrom = fromPage || lastPage;
  navigateTo('scorecard', scorecardFrom);
  document.getElementById('scorecard-match-label').textContent = `${t1} vs ${t2}`;
  loadLiveScorecardFromApi(matchId, t1, t2);
}
async function openOfflineScorecard(matchId, fromPage) {
  scorecardFrom = fromPage || lastPage;
  navigateTo('scorecard', scorecardFrom);
  const match = ALL_MATCHES.find(m => m.id === matchId);
  if (!match) return;
  document.getElementById('scorecard-match-label').textContent = `${match.t1} vs ${match.t2}`;
  
  showSpinner('scorecard-container', false);
  
  if (window.OFFLINE_SCORECARDS && window.OFFLINE_SCORECARDS[matchId]) {
    const offlineSc = window.OFFLINE_SCORECARDS[matchId];
    offlineSc.result = match.winner ? `${match.winner} won` : match.result;
    offlineSc.playerOfMatch = match.pom;
    offlineSc.venue = match.venue;
    offlineSc.date = match.date;
    offlineSc.toss = `${match.toss_winner} won the toss`;
    renderScorecardPage(offlineSc, match.t1, match.t2, true);
    return;
  }

  try {
    const data = await CricketAPI.getMatchScoreboard(matchId);
    const sc = data?.response || data?.data;
    if (!sc || !sc.score || !sc.score.length) throw new Error('API Scorecard missing');
    
    // Inject our local metadata into the API response to guarantee it's there
    sc.result = match.winner ? `${match.winner} won` : match.result;
    sc.playerOfMatch = match.pom;
    renderScorecardPage(sc, match.t1, match.t2, true);
  } catch (err) {
    // API failed or no detailed score, render fallback with just the basic offline data
    const sc = {
      result: match.winner ? `${match.winner} won` : match.result, 
      playerOfMatch: match.pom, 
      venue: match.venue, 
      date: match.date,
      toss: `${match.toss_winner} won the toss`, 
      innings: [
        { team: match.t1, r: '-', w: '-', o: '-', batting: [] },
        { team: match.t2, r: '-', w: '-', o: '-', batting: [] }
      ]
    };
    renderScorecardPage(sc, match.t1, match.t2, true);
  }
}

async function loadLiveScorecardFromApi(matchId, t1, t2) {
  showSpinner('scorecard-container', false);
  try {
    if (!matchId) throw new Error('Invalid Match ID');
    const data = await CricketAPI.getMatchScoreboard(matchId);
    const sc = data?.response || data?.data;
    if (!sc || !sc.score || !sc.score.length) throw new Error('API Scorecard missing');
    renderScorecardPage(sc, t1, t2, false);
  } catch(err) {
    showError('scorecard-container', "Scorecard unavailable right now.");
  }
}

function renderScorecardPage(sc, t1, t2, isOffline) {
  const innings = sc.innings || sc.score || [];
  const inn1 = innings[0] || {};
  const inn2 = innings[1] || {};

  const header = `
    <div class="scorecard-match-header">
      <div class="scorecard-teams-row">
        <div class="scorecard-team">
          <div class="scorecard-team-name">${inn1.team || t1 || 'Team A'}</div>
          <div class="scorecard-team-score">${inn1.r||0}/${inn1.w||0}</div>
          <div class="scorecard-team-overs">(${inn1.o||0} overs)</div>
        </div>
        <div class="scorecard-vs">VS</div>
        <div class="scorecard-team">
          <div class="scorecard-team-name">${inn2.team || t2 || 'Team B'}</div>
          <div class="scorecard-team-score">${inn2.r||0}/${inn2.w||0}</div>
          <div class="scorecard-team-overs">(${inn2.o||0} overs)</div>
        </div>
      </div>
      ${sc.result ? `<div class="scorecard-result">🏆 ${sc.result}</div>` : ''}
      ${sc.playerOfMatch ? `<div class="pom-section"><div class="pom-icon">⭐</div><div><div class="pom-label">Player of the Match</div><div class="pom-name">${sc.playerOfMatch}</div></div></div>` : ''}
    </div>`;

  const tabs = `
    <div class="innings-tabs-row">
      <button class="innings-tab-btn active" onclick="switchInnings(0)">${inn1.team || '1st Innings'}</button>
      <button class="innings-tab-btn" onclick="switchInnings(1)">${inn2.team || '2nd Innings'}</button>
    </div>`;

  const renderBatting = (bat, ext) => {
    if (!bat || !bat.length) return `<div class="empty-state">No detailed data.</div>`;
    const rows = bat.map(b => `<tr>
      <td><div class="bat-name ${b.notOut?'not-out':''}">${b.name}</div><div class="bat-dismissal">${b.dismissal||''}</div></td>
      <td><span class="bat-runs">${b.runs||0}</span></td><td>${b.balls||0}</td><td>${b.fours||0}</td><td>${b.sixes||0}</td><td>${b.sr||0}</td>
    </tr>`).join('');
    return `<table class="scorecard-table"><thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead><tbody>${rows}</tbody></table>`;
  };

  const panels = [inn1, inn2].map((inn, idx) => `
    <div class="innings-panel ${idx === 0 ? 'active' : ''}">
      <div class="innings-summary">
        <div><div class="innings-summary-team">${inn.team||`Innings ${idx+1}`}</div><div class="innings-summary-score">${inn.r||0}/${inn.w||0}</div></div>
      </div>
      ${renderBatting(inn.batting, inn.extras || {})}
    </div>`).join('');

  document.getElementById('scorecard-container').innerHTML = header + tabs + panels;
}

window.switchInnings = function(idx) {
  document.querySelectorAll('.innings-panel').forEach((p, i) => p.classList.toggle('active', i === idx));
  document.querySelectorAll('.innings-tab-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
}

// TEAMS PROFILE
function loadTeams() {
  document.getElementById('teams-container').innerHTML = IPL_TEAMS.map(t => {
    const logoUrl = TEAM_LOGOS[t.name.toLowerCase()];
    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" class="team-logo-img" alt="${t.abbr}">`
      : `<span style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:${t.color}">${t.abbr}</span>`;
    
    return `
    <div class="team-card" style="--team-color:${t.color}" onclick="openTeamProfile('${t.name}')">
      <div class="team-card-logo-big" style="background:${t.color}20;border-color:${t.color}40">${logoHtml}</div>
      <div class="team-card-name">${t.name}</div>
      <div class="team-card-abbr">${t.abbr}</div>
    </div>`;
  }).join('');
  populatePlayersTeamSelect();
}

window.openTeamProfile = function(teamName) {
  navigateTo('team-profile', 'teams');
  const tInfo = getTeamInfo(teamName);
  const logoUrl = TEAM_LOGOS[teamName.toLowerCase()];
  
  let matches = 0, wins = 0, losses = 0, trophies = 0;
  const venues = {};
  const seasonPerf = {};
  const pomCounts = {};

  ALL_MATCHES.forEach(m => {
    if (m.t1 !== teamName && m.t2 !== teamName) return;
    matches++;
    const y = new Date(m.date).getFullYear();
    if (!seasonPerf[y]) seasonPerf[y] = { p:0, w:0, l:0 };
    seasonPerf[y].p++;

    if (m.winner === teamName) { wins++; seasonPerf[y].w++; }
    else if (m.winner && m.winner !== teamName) { losses++; seasonPerf[y].l++; }

    if (m.venue) venues[m.venue] = (venues[m.venue] || 0) + 1;

    // Track MoM winners for this team
    if (m.pom) {
      const isTeamPlayer = (m.t1 === teamName && m.t1_players && m.t1_players.includes(m.pom)) ||
                           (m.t2 === teamName && m.t2_players && m.t2_players.includes(m.pom));
      if (isTeamPlayer) pomCounts[m.pom] = (pomCounts[m.pom] || 0) + 1;
    }
  });

  // Trophies (finals winner check)
  const globalSeasons = {};
  ALL_MATCHES.forEach(m => {
    const y = new Date(m.date).getFullYear();
    if (!globalSeasons[y]) globalSeasons[y] = { matches:0, winner:null };
    globalSeasons[y].matches++;
    if (globalSeasons[y].matches > 50) globalSeasons[y].winner = m.winner;
  });
  Object.values(globalSeasons).forEach(s => { if (s.winner === teamName) trophies++; });

  const winRate = matches ? ((wins/matches)*100).toFixed(1) : 0;
  const logoHtml = logoUrl ? `<img src="${logoUrl}" class="team-logo-img-large">` : `<h1 style="font-size:4rem">${tInfo.abbr}</h1>`;

  // Best & Worst seasons
  const seasonYears = Object.keys(seasonPerf).sort();
  let bestSeason = null, worstSeason = null, bestWinRate = -1, worstWinRate = 101;
  seasonYears.forEach(y => {
    const s = seasonPerf[y];
    const wr = s.p > 0 ? (s.w / s.p) * 100 : 0;
    if (wr > bestWinRate) { bestWinRate = wr; bestSeason = y; }
    if (wr < worstWinRate) { worstWinRate = wr; worstSeason = y; }
  });

  // Top venue
  const topVenue = Object.entries(venues).sort((a,b) => b[1] - a[1])[0];

  // Top 5 MoM winners
  const topPerformers = Object.entries(pomCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);

  // Season performance table
  const seasonRows = seasonYears.sort((a,b) => b - a).map(y => {
    const s = seasonPerf[y];
    const wr = s.p > 0 ? ((s.w / s.p) * 100).toFixed(0) : 0;
    const isChampion = globalSeasons[y]?.winner === teamName;
    return `<tr>
      <td style="font-weight:700">${y} ${isChampion ? '🏆' : ''}</td>
      <td>${s.p}</td><td>${s.w}</td><td>${s.l}</td><td>${wr}%</td>
    </tr>`;
  }).join('');

  let html = `
    <div class="team-profile-header">
      ${logoHtml}
      <h2>${teamName}</h2>
      <p class="team-profile-sub" style="color:${tInfo.color};">IPL Franchise · ${seasonYears[0]} – ${seasonYears[seasonYears.length-1]}</p>
    </div>
    
    <div class="player-stats-grid">
      <div class="stat-box"><div class="stat-value">${matches}</div><div class="stat-label">Matches</div></div>
      <div class="stat-box"><div class="stat-value">${wins}</div><div class="stat-label">Wins</div></div>
      <div class="stat-box"><div class="stat-value">${losses}</div><div class="stat-label">Losses</div></div>
      <div class="stat-box"><div class="stat-value">${winRate}%</div><div class="stat-label">Win Rate</div></div>
      <div class="stat-box"><div class="stat-value">${trophies}</div><div class="stat-label">🏆 Titles</div></div>
      <div class="stat-box"><div class="stat-value">${seasonYears.length}</div><div class="stat-label">Seasons</div></div>
    </div>

    <div class="profile-section">
      <h3>📌 Key Facts</h3>
      <div class="facts-grid">
        <div class="fact-card">
          <div class="fact-icon">📈</div>
          <div class="fact-content"><div class="fact-title">Best Season</div><div class="fact-detail">${bestSeason} (${bestWinRate.toFixed(0)}% win rate)</div></div>
        </div>
        <div class="fact-card">
          <div class="fact-icon">📉</div>
          <div class="fact-content"><div class="fact-title">Worst Season</div><div class="fact-detail">${worstSeason} (${worstWinRate.toFixed(0)}% win rate)</div></div>
        </div>
        <div class="fact-card">
          <div class="fact-icon">🏟️</div>
          <div class="fact-content"><div class="fact-title">Top Venue</div><div class="fact-detail">${topVenue ? topVenue[0] + ' (' + topVenue[1] + ' matches)' : 'N/A'}</div></div>
        </div>
        <div class="fact-card">
          <div class="fact-icon">⭐</div>
          <div class="fact-content"><div class="fact-title">Top Performer</div><div class="fact-detail">${topPerformers.length ? topPerformers[0][0] + ' (' + topPerformers[0][1] + ' MoM)' : 'N/A'}</div></div>
        </div>
      </div>
    </div>

    ${topPerformers.length ? `
    <div class="profile-section">
      <h3>⭐ Top Performers (by MoM Awards)</h3>
      <div class="top-performers-list">
        ${topPerformers.map((p, i) => `
          <div class="performer-row" onclick="openPlayerProfile('${p[0]}')">
            <span class="performer-rank">#${i+1}</span>
            <img src="${getPlayerImg(p[0])}" class="performer-img">
            <div class="performer-info">
              <div class="performer-name">${p[0]}</div>
              <div class="performer-stat">${p[1]} Man of the Match Awards</div>
            </div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <div class="profile-section">
      <h3>📊 Season-by-Season Record</h3>
      <div class="points-table-wrap">
        <table class="points-table">
          <thead><tr><th>Season</th><th>P</th><th>W</th><th>L</th><th>Win %</th></tr></thead>
          <tbody>${seasonRows}</tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('team-profile-container').innerHTML = html;
}

// PLAYERS PROFILE
function populatePlayersTeamSelect() {
  const sel = document.getElementById('player-team-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Choose a team —</option>';
  IPL_TEAMS.forEach(t => { const opt = document.createElement('option'); opt.value = t.name; opt.textContent = t.name; sel.appendChild(opt); });
}

function initPlayers() {
  const teamSel = document.getElementById('player-team-select');
  const roleSel = document.getElementById('player-role-select');
  if (!teamSel.options.length || teamSel.options.length === 1) populatePlayersTeamSelect();
  if (!teamSel._bound) {
    teamSel.addEventListener('change', () => loadTeamPlayers(teamSel.value));
    roleSel.addEventListener('change', filterPlayers);
    teamSel._bound = true;
  }
}

function loadTeamPlayers(teamName) {
  const roleSel = document.getElementById('player-role-select');
  if (roleSel) roleSel.value = '';
  if (!teamName) { document.getElementById('players-container').innerHTML = `<div class="empty-state players-placeholder"><h3>Select a Team</h3></div>`; return; }

  const playerSet = new Set();
  ALL_MATCHES.forEach(m => {
    if (m.t1 === teamName && m.t1_players) m.t1_players.split(',').forEach(p=>playerSet.add(p.trim()));
    if (m.t2 === teamName && m.t2_players) m.t2_players.split(',').forEach(p=>playerSet.add(p.trim()));
  });

  const uniquePlayers = Array.from(playerSet);
  if (!uniquePlayers.length) { showError('players-container', "No players found."); return; }
  
  const teamInfo = getTeamInfo(teamName);
  allPlayers = uniquePlayers.map(p => {
    const prof = PLAYER_PROFILES[p] || {};
    return { name: p, role: prof.role || ['bat', 'bowl', 'ar', 'wk'][Math.floor(Math.random()*4)] };
  });
  renderPlayersGrid(allPlayers, teamInfo.color);
}

function filterPlayers() {
  const roleFilter = document.getElementById('player-role-select').value;
  const teamName = document.getElementById('player-team-select').value;
  const teamInfo = getTeamInfo(teamName);
  const filtered = roleFilter ? allPlayers.filter(p => p.role === roleFilter || (p.role !== 'bat' && p.role!=='bowl'&&roleFilter==='bat')) : allPlayers;
  renderPlayersGrid(filtered, teamInfo.color);
}

function renderPlayersGrid(players, teamColor) {
  if (!players.length) return document.getElementById('players-container').innerHTML = `<div class="empty-state"><h3>No players found</h3></div>`;
  document.getElementById('players-container').innerHTML = players.map(p => {
    const roleClass = p.role.toLowerCase().includes('bowl') ? 'role-bowl' : 'role-bat';
    const img = getPlayerImg(p.name);
    return `
    <div class="player-card" style="--team-primary:${teamColor}" onclick="openPlayerProfile('${p.name}')">
      <img src="${img}" class="player-avatar" style="object-fit:cover; border-radius:50%; width:80px; height:80px; margin:0 auto var(--space-4);">
      <div class="player-name">${p.name}</div>
      <div class="player-role-badge ${roleClass}">${p.role}</div>
    </div>`;
  }).join('');
}

window.openPlayerProfile = function(playerName) {
  const modal = document.getElementById('player-modal');
  const body = document.getElementById('player-modal-body');
  modal.style.display = 'flex';
  
  let matches = 0, poms = 0, winsInTeam = 0;
  const teamsPlayed = {};
  const seasonMatches = {};
  let firstMatch = null, lastMatch = null;

  ALL_MATCHES.forEach(m => {
    let played = false, team = null;
    if (m.t1_players && m.t1_players.includes(playerName)) { played = true; team = m.t1; }
    if (m.t2_players && m.t2_players.includes(playerName)) { played = true; team = m.t2; }
    if (!played) return;

    matches++;
    if (m.pom === playerName) poms++;
    if (m.winner === team) winsInTeam++;

    // Track teams with years
    const y = new Date(m.date).getFullYear();
    if (team) {
      if (!teamsPlayed[team]) teamsPlayed[team] = new Set();
      teamsPlayed[team].add(y);
    }

    // Season breakdown
    if (!seasonMatches[y]) seasonMatches[y] = { p: 0, pom: 0 };
    seasonMatches[y].p++;
    if (m.pom === playerName) seasonMatches[y].pom++;

    // First/last match
    const matchDate = new Date(m.date);
    if (!firstMatch || matchDate < firstMatch) firstMatch = matchDate;
    if (!lastMatch || matchDate > lastMatch) lastMatch = matchDate;
  });

  const prof = PLAYER_PROFILES[playerName] || {};
  const img = getPlayerImg(playerName);
  const fullName = prof.fullName || playerName;
  const seasonsPlayed = Object.keys(seasonMatches).length;
  const playerWinRate = matches > 0 ? ((winsInTeam / matches) * 100).toFixed(1) : 0;

  // Career timeline
  const teamTimeline = Object.entries(teamsPlayed).map(([team, years]) => {
    const sorted = Array.from(years).sort();
    const range = sorted.length === 1 ? sorted[0] : `${sorted[0]}–${sorted[sorted.length-1]}`;
    return { team, range, count: sorted.length };
  }).sort((a, b) => b.count - a.count);

  // Season breakdown rows
  const seasonRows = Object.keys(seasonMatches).sort((a,b) => b - a).map(y => {
    const s = seasonMatches[y];
    return `<tr><td style="font-weight:700">${y}</td><td>${s.p}</td><td>${s.pom}</td></tr>`;
  }).join('');

  body.innerHTML = `
    <div class="player-modal-header">
      <img src="${img}" class="player-modal-img">
      <div class="player-modal-info">
        <h2>${fullName}</h2>
        ${fullName !== playerName ? `<div class="player-modal-shortname">${playerName}</div>` : ''}
        <div class="player-modal-role">${prof.role || 'Player'}</div>
        ${prof.dob && prof.dob !== 'NA' ? `<div class="player-modal-dob">Born: ${prof.dob}</div>` : ''}
      </div>
    </div>
    
    <div class="player-stats-grid">
      <div class="stat-box"><div class="stat-value">${matches}</div><div class="stat-label">Matches</div></div>
      <div class="stat-box"><div class="stat-value">${poms}</div><div class="stat-label">MoM Awards</div></div>
      <div class="stat-box"><div class="stat-value">${seasonsPlayed}</div><div class="stat-label">Seasons</div></div>
      <div class="stat-box"><div class="stat-value">${playerWinRate}%</div><div class="stat-label">Win Rate</div></div>
    </div>

    <div class="profile-section">
      <h3>🏏 Playing Style</h3>
      <div class="facts-grid">
        <div class="fact-card">
          <div class="fact-icon">🏏</div>
          <div class="fact-content"><div class="fact-title">Batting</div><div class="fact-detail">${prof.batting && prof.batting !== 'NA' ? prof.batting : 'N/A'}</div></div>
        </div>
        <div class="fact-card">
          <div class="fact-icon">🎯</div>
          <div class="fact-content"><div class="fact-title">Bowling</div><div class="fact-detail">${prof.bowling && prof.bowling !== 'NA' ? prof.bowling : 'N/A'}</div></div>
        </div>
      </div>
    </div>

    <div class="profile-section">
      <h3>📋 Career Timeline</h3>
      <div class="timeline-list">
        ${teamTimeline.map(t => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-team">${t.team}</div>
              <div class="timeline-years">${t.range} · ${t.count} season${t.count > 1 ? 's' : ''}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    ${Object.keys(seasonMatches).length > 1 ? `
    <div class="profile-section">
      <h3>📊 Season Breakdown</h3>
      <div class="points-table-wrap">
        <table class="points-table">
          <thead><tr><th>Season</th><th>Matches</th><th>MoM</th></tr></thead>
          <tbody>${seasonRows}</tbody>
        </table>
      </div>
    </div>` : ''}

    ${firstMatch ? `
    <div class="profile-section">
      <h3>📅 Career Span</h3>
      <div class="facts-grid">
        <div class="fact-card">
          <div class="fact-icon">🟢</div>
          <div class="fact-content"><div class="fact-title">First IPL Match</div><div class="fact-detail">${firstMatch.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</div></div>
        </div>
        <div class="fact-card">
          <div class="fact-icon">🔴</div>
          <div class="fact-content"><div class="fact-title">Last IPL Match</div><div class="fact-detail">${lastMatch.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</div></div>
        </div>
      </div>
    </div>` : ''}
  `;
}

// POINTS TABLE
window.loadPointsTable = function(targetYear) {
  const container = document.getElementById('points-container');
  const years = Array.from(new Set(ALL_MATCHES.map(m => new Date(m.date).getFullYear()))).sort((a,b)=>b-a);
  if (!years.length) { showEmpty('points-container', 'No matches found.', '📊'); return; }
  
  const selectedYear = targetYear || years[0];
  const tableData = {};
  
  ALL_MATCHES.filter(m => new Date(m.date).getFullYear() === selectedYear).forEach(m => {
    [m.t1, m.t2].forEach(t => { if (!tableData[t]) tableData[t] = { team:t, p:0, w:0, l:0, nr:0, pts:0 }; });
    tableData[m.t1].p++; tableData[m.t2].p++;
    
    if (m.winner === m.t1) { tableData[m.t1].w++; tableData[m.t1].pts += 2; tableData[m.t2].l++; }
    else if (m.winner === m.t2) { tableData[m.t2].w++; tableData[m.t2].pts += 2; tableData[m.t1].l++; }
    else { tableData[m.t1].nr++; tableData[m.t2].nr++; tableData[m.t1].pts += 1; tableData[m.t2].pts += 1; }
  });

  const sorted = Object.values(tableData).sort((a,b) => b.pts - a.pts || b.w - a.w);

  container.innerHTML = `
    <div style="margin-bottom:var(--space-4);">
      <h2 style="font-family:var(--font-display); font-size:2rem;">IPL ${selectedYear} Standings</h2>
      <p style="color:var(--color-text-muted);">Dynamically calculated from match results</p>
    </div>
    <div class="points-table-wrap">
      <table class="points-table">
        <thead><tr><th>Pos</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>NR</th><th>Pts</th></tr></thead>
        <tbody>
          ${sorted.map((r, i) => `<tr>
            <td>${i+1}</td><td style="font-weight:600; color:var(--color-primary)">${r.team}</td>
            <td>${r.p}</td><td>${r.w}</td><td>${r.l}</td><td>${r.nr}</td><td style="font-weight:700">${r.pts}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:var(--space-8); text-align:center;">
      <h3>View Older Seasons</h3>
      <div class="year-selector">
        ${years.map(y => `<button class="year-pill ${y===selectedYear?'active':''}" onclick="loadPointsTable(${y})">${y}</button>`).join('')}
      </div>
    </div>
  `;
}

// INIT
console.log('[IPL Tracker] App ready ✓');
navigateTo('home');