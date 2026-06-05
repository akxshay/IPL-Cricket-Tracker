const fs = require('fs');
const https = require('https');
const path = require('path');

const TEAMS_URL = 'https://raw.githubusercontent.com/ritesh-ojha/IPL-DATASET/main/csv/teams_info.csv';
const PLAYERS_URL = 'https://raw.githubusercontent.com/ritesh-ojha/IPL-DATASET/main/csv/2024_players_details.csv';
const OUTPUT_FILE = path.join(__dirname, '../js/assetsData.js');

const fetchUrl = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve(data));
  }).on('error', reject);
});

const parseCsv = (data) => {
  const rows = data.split('\n');
  const result = [];
  const parseRow = (str) => {
    const arr = [];
    let quote = false;
    let val = '';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '"') quote = !quote;
      else if (char === ',' && !quote) { arr.push(val); val = ''; }
      else val += char;
    }
    arr.push(val);
    return arr.map(v => v.trim());
  };
  
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].trim()) continue;
    result.push(parseRow(rows[i]));
  }
  return result;
};

async function run() {
  try {
    console.log("Fetching Teams Data...");
    const teamsData = await fetchUrl(TEAMS_URL);
    const teamsCsv = parseCsv(teamsData);
    const TEAM_LOGOS = {};
    teamsCsv.forEach(row => {
      if (row[0] && row[1]) TEAM_LOGOS[row[0].toLowerCase()] = row[1];
    });

    console.log("Fetching Players Data...");
    const playersData = await fetchUrl(PLAYERS_URL);
    const playersCsv = parseCsv(playersData);
    const PLAYER_PROFILES = {};
    playersCsv.forEach(row => {
      // ID,Name,longName,battingName,fieldingName,imgUrl,dob,battingStyles,longBattingStyles,bowlingStyles,longBowlingStyles,playingRoles,espn_url
      if (row[1] && row[5]) {
        PLAYER_PROFILES[row[1]] = {
          fullName: row[2] || row[1],
          imgUrl: row[5],
          role: row[11] || 'NA',
          batting: row[8] || 'NA',
          bowling: row[10] || 'NA',
          dob: row[6] || 'NA'
        };
      }
    });

    const content = `// Auto-generated assets
window.TEAM_LOGOS = ${JSON.stringify(TEAM_LOGOS, null, 2)};
window.PLAYER_PROFILES = ${JSON.stringify(PLAYER_PROFILES, null, 2)};
`;
    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`Successfully generated js/assetsData.js`);

  } catch(e) {
    console.error("Failed to fetch assets:", e);
  }
}

run();
