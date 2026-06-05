const fs = require('fs');
const https = require('https');
const path = require('path');

const CSV_URL = 'https://raw.githubusercontent.com/ritesh-ojha/IPL-DATASET/main/csv/Match_Info.csv';
const OUTPUT_FILE = path.join(__dirname, '../js/offlineData.js');

https.get(CSV_URL, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Parse CSV
    const rows = data.split('\n');
    const headers = rows[0].split(',');
    
    const matches = [];
    
    // Simple CSV parser ignoring commas inside quotes
    const parseRow = (str) => {
      const arr = [];
      let quote = false;
      let val = '';
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"') quote = !quote;
        else if (char === ',' && !quote) {
          arr.push(val);
          val = '';
        } else {
          val += char;
        }
      }
      arr.push(val);
      return arr.map(v => v.trim());
    };

    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;
      const values = parseRow(rows[i]);
      if (values.length < 12) continue;

      // match_number,team1,team2,match_date,toss_winner,toss_decision,result,eliminator,winner,player_of_match,venue,city,team1_players,team2_players
      
      const match = {
        id: values[0],
        t1: values[1],
        t2: values[2],
        date: values[3],
        toss_winner: values[4],
        toss_decision: values[5],
        result: values[6],
        winner: values[8],
        pom: values[9],
        venue: values[10],
        city: values[11],
        t1_players: values[12],
        t2_players: values[13],
      };
      matches.push(match);
    }

    // Sort by date ascending
    matches.sort((a, b) => new Date(a.date) - new Date(b.date));

    const content = `// Auto-generated offline dataset of all IPL Matches\nwindow.OFFLINE_MATCHES = ${JSON.stringify(matches, null, 2)};\n`;
    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`Successfully parsed ${matches.length} matches and saved to js/offlineData.js`);
  });
}).on('error', (err) => {
  console.error("Error fetching CSV:", err.message);
});
