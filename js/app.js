/**
 * app.js — Main App Controller
 * Commit #5: Homepage Redesign + Points Table + Teams
 */

// ── Navigation ────────────────────────────────────────────────
const hamburger   = document.getElementById('hamburger');
const navLinks    = document.getElementById('navLinks');
const navbar      = document.getElementById('navbar');
const allNavLinks = document.querySelectorAll('.nav-link');
const allPages    = document.querySelectorAll('.page');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.addEventListener('click', () => {
  hamburger.classList.remove('open');
  navLinks.classList.remove('open');
});
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ── Routing ───────────────────────────────────────────────────
function navigateTo(pageId) {
  allPages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add('active');
  allNavLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (pageId === 'live')     loadLiveScores();
  if (pageId === 'schedule') loadUpcomingMatches();
  if (pageId === 'points')   loadPointsTable();
  if (pageId === 'teams')    loadTeams();
}

document.addEventListener('click', e => {
  const target = e.target.closest('[data-page]');
  if (target) { e.preventDefault(); navigateTo(target.dataset.page); }
});

// ── Helpers ───────────────────────────────────────────────────
function showSpinner(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div><p class="spinner-text">Loading...</p></div>`;
}
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Something went wrong</h3><p>${msg}</p></div>`;
}
function showEmpty(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="empty-state"><div class="empty-icon">🏏</div><h3>No data found</h3><p>${msg}</p></div>`;
}
function formatDate(dateStr) {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ── Live Scores ───────────────────────────────────────────────
async function loadLiveScores() {
  showSpinner('live-container');
  try {
    const data = await CricketAPI.getLiveMatches();
    const matches = data?.response || data?.data || [];
    if (!matches.length) { showEmpty('live-container', 'No live matches right now. Check back later!'); return; }
    document.getElementById('live-container').innerHTML = matches.map(m => renderMatchCard(m, true)).join('');
  } catch(err) { showError('live-container', err.message); }
}

// ── Upcoming Matches ──────────────────────────────────────────
async function loadUpcomingMatches() {
  showSpinner('schedule-container');
  try {
    const data = await CricketAPI.getUpcomingMatches();
    const matches = data?.response || data?.data || [];
    if (!matches.length) { showEmpty('schedule-container', 'No upcoming matches scheduled yet.'); return; }
    document.getElementById('schedule-container').innerHTML = matches.map(m => renderMatchCard(m, false)).join('');
  } catch(err) { showError('schedule-container', err.message); }
}

// ── Match Card ────────────────────────────────────────────────
function renderMatchCard(match, isLive) {
  const team1 = match.team1 || match.t1 || match.teamInfo?.[0]?.name || 'Team 1';
  const team2 = match.team2 || match.t2 || match.teamInfo?.[1]?.name || 'Team 2';
  const score1 = match.score?.[0]?.r ? `${match.score[0].r}/${match.score[0].w} (${match.score[0].o} ov)` : '';
  const score2 = match.score?.[1]?.r ? `${match.score[1].r}/${match.score[1].w} (${match.score[1].o} ov)` : '';
  const status = match.status || match.ms || '';
  const venue  = match.venue || match.ground || '';
  const date   = formatDate(match.date || match.dateTimeGMT || '');
  const type   = match.matchType || match.type || 'T20';
  return `
    <div class="match-card ${isLive ? 'match-card--live' : ''}">
      ${isLive ? '<div class="match-live-badge"><span class="live-dot"></span> LIVE</div>' : ''}
      <div class="match-type-badge">${type.toUpperCase()}</div>
      <div class="match-teams">
        <div class="match-team">
          <span class="team-name">${team1}</span>
          ${score1 ? `<span class="team-score">${score1}</span>` : ''}
        </div>
        <div class="match-vs">VS</div>
        <div class="match-team match-team--right">
          <span class="team-name">${team2}</span>
          ${score2 ? `<span class="team-score">${score2}</span>` : ''}
        </div>
      </div>
      ${status ? `<div class="match-status">${status}</div>` : ''}
      <div class="match-meta">
        ${venue ? `<span>🏟️ ${venue}</span>` : ''}
        ${date  ? `<span>📅 ${date}</span>`  : ''}
      </div>
    </div>`;
}

// ── Points Table ──────────────────────────────────────────────
async function loadPointsTable() {
  showSpinner('points-container');
  try {
    const data = await CricketAPI.getAllSeries();
    const series = data?.response || data?.data || [];

    // Find IPL series
    const ipl = series.find(s =>
      s.name?.toLowerCase().includes('ipl') ||
      s.name?.toLowerCase().includes('indian premier')
    );

    if (!ipl) {
      // Show mock points table if IPL not found in API
      renderMockPointsTable();
      return;
    }

    const ptData = await CricketAPI.getLeagueSeries();
    const standings = ptData?.response || ptData?.data || [];

    if (!standings.length) { renderMockPointsTable(); return; }
    renderPointsTable(standings);

  } catch(err) {
    console.warn('[Points] API failed, showing mock data:', err.message);
    renderMockPointsTable();
  }
}

function renderMockPointsTable() {
  const teams = [
    { name:'Mumbai Indians',       abbr:'MI',  p:14, w:10, l:4,  pts:20, nrr:'+0.809' },
    { name:'Chennai Super Kings',  abbr:'CSK', p:14, w:9,  l:5,  pts:18, nrr:'+0.527' },
    { name:'Royal Challengers',    abbr:'RCB', p:14, w:8,  l:6,  pts:16, nrr:'+0.333' },
    { name:'Kolkata Knight Riders',abbr:'KKR', p:14, w:8,  l:6,  pts:16, nrr:'+0.151' },
    { name:'Sunrisers Hyderabad',  abbr:'SRH', p:14, w:7,  l:7,  pts:14, nrr:'-0.102' },
    { name:'Delhi Capitals',       abbr:'DC',  p:14, w:6,  l:8,  pts:12, nrr:'-0.234' },
    { name:'Rajasthan Royals',     abbr:'RR',  p:14, w:6,  l:8,  pts:12, nrr:'-0.318' },
    { name:'Punjab Kings',         abbr:'PBKS',p:14, w:5,  l:9,  pts:10, nrr:'-0.421' },
    { name:'Gujarat Titans',       abbr:'GT',  p:14, w:4,  l:10, pts:8,  nrr:'-0.512' },
    { name:'Lucknow Super Giants', abbr:'LSG', p:14, w:3,  l:11, pts:6,  nrr:'-0.733' },
  ];
  renderPointsTable(teams, true);
}

function renderPointsTable(teams, isMock = false) {
  const rows = teams.map((t, i) => {
    const isQualified = i < 4;
    const isEliminated = i >= 7;
    const nrr = t.nrr || t.nr || '0.000';
    const nrrClass = String(nrr).startsWith('+') ? 'nrr-positive' : String(nrr).startsWith('-') ? 'nrr-negative' : '';
    return `
      <tr class="${isQualified ? 'qualified' : ''} ${isEliminated ? 'eliminated' : ''}">
        <td>
          <div class="team-cell">
            <div class="team-rank ${i < 4 ? 'top' : ''}">${i+1}</div>
            <div class="team-logo-sm-wrap">
              <div class="team-card-logo-placeholder" style="width:32px;height:32px;font-size:1rem;margin:0">👕</div>
            </div>
            <div>
              <div class="team-fullname">${t.name || t.teamname || 'Team'}</div>
              <div class="team-abbr">${t.abbr || t.teamshortname || ''}</div>
            </div>
          </div>
        </td>
        <td>${t.p || t.played || 0}</td>
        <td>${t.w || t.win || 0}</td>
        <td>${t.l || t.loss || 0}</td>
        <td class="pts-cell">${t.pts || t.points || 0}</td>
        <td class="${nrrClass}">${nrr}</td>
      </tr>`;
  });

  document.getElementById('points-container').innerHTML = `
    ${isMock ? '<p style="color:var(--color-text-muted);font-size:0.8rem;padding:0 0 var(--space-4);font-family:var(--font-display)">⚠️ Showing sample data — live API data unavailable</p>' : ''}
    <table class="points-table">
      <thead>
        <tr>
          <th>Team</th>
          <th>P</th>
          <th>W</th>
          <th>L</th>
          <th>PTS</th>
          <th>NRR</th>
        </tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
    <div style="display:flex;gap:var(--space-4);margin-top:var(--space-4);font-size:0.8rem;color:var(--color-text-muted)">
      <span style="display:flex;align-items:center;gap:6px"><span style="width:3px;height:16px;background:var(--color-success);border-radius:2px;display:inline-block"></span> Qualified</span>
      <span style="display:flex;align-items:center;gap:6px"><span style="width:3px;height:16px;background:var(--color-danger);border-radius:2px;display:inline-block"></span> Eliminated</span>
    </div>`;
}

// ── Teams ─────────────────────────────────────────────────────
async function loadTeams() {
  showSpinner('teams-container');
  try {
    const data = await CricketAPI.getAllTeams();
    const teams = data?.response || data?.data || [];
    if (!teams.length) { showEmpty('teams-container', 'No teams data available.'); return; }

    // Filter for IPL teams only
    const iplTeams = teams.filter(t =>
      t.teamtype === 'domestic' ||
      t.country === 'India' ||
      t.name?.toLowerCase().includes('india')
    ).slice(0, 20);

    const colors = ['#004BA0','#FFCC00','#D71920','#E11B22','#F26522','#232324','#FF9933','#862B2B','#1C4B9C','#3D2082'];
    document.getElementById('teams-container').innerHTML =
      (iplTeams.length ? iplTeams : teams.slice(0, 20)).map((team, i) => `
        <div class="team-card" style="--team-color:${colors[i % colors.length]}">
          ${team.logo
            ? `<img src="${team.logo}" alt="${team.name}" class="team-card-logo" onerror="this.style.display='none'">`
            : `<div class="team-card-logo-placeholder">👕</div>`}
          <div class="team-card-name">${team.name || 'Team'}</div>
          <div class="team-card-abbr">${team.abbreviation || team.tname || ''}</div>
        </div>`).join('');
  } catch(err) { showError('teams-container', err.message); }
}

// ── Init ──────────────────────────────────────────────────────
console.log('[IPL Tracker] App ready ✓');
navigateTo('home');
