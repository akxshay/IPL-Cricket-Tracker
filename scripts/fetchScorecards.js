const fs = require('fs');
const https = require('https');
const path = require('path');
const readline = require('readline');

const CSV_URL = 'https://raw.githubusercontent.com/ritesh-ojha/IPL-DATASET/main/csv/Ball_By_Ball_Match_Data.csv';
const OUTPUT_FILE = path.join(__dirname, '../js/offlineScorecards.js');

console.log('Downloading and parsing Ball-by-Ball data (this might take a minute)...');

https.get(CSV_URL, (res) => {
  const rl = readline.createInterface({
    input: res,
    crlfDelay: Infinity
  });

  const scorecards = {};
  let isHeader = true;

  // Simple CSV parser that handles commas inside quotes
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

  rl.on('line', (line) => {
    if (!line.trim()) return;
    if (isHeader) {
      isHeader = false;
      return;
    }
    const values = parseRow(line);
    if (values.length < 16) return;

    // ID,Innings,Overs,BallNumber,Batter,Bowler,NonStriker,ExtraType,BatsmanRun,ExtrasRun,TotalRun,IsWicketDelivery,PlayerOut,Kind,FieldersInvolved,BattingTeam
    const matchId = values[0];
    const inningsNum = parseInt(values[1]);
    const overs = parseInt(values[2]);
    const batter = values[4];
    const bowler = values[5];
    const extraType = values[7];
    const batsmanRun = parseInt(values[8]) || 0;
    const isWicket = parseInt(values[11]) === 1;
    const playerOut = values[12];
    const kind = values[13];
    const fielders = values[14];
    const battingTeam = values[15];

    if (!scorecards[matchId]) {
      scorecards[matchId] = { innings: [null, null] };
    }

    // Usually innings 1 and 2, but sometimes Super Overs (innings 3/4)
    // We will just aggregate the first two innings.
    if (inningsNum > 2) return;
    
    const innIdx = inningsNum - 1;
    if (!scorecards[matchId].innings[innIdx]) {
      scorecards[matchId].innings[innIdx] = {
        team: battingTeam,
        r: 0,
        w: 0,
        o: 0,
        battersMap: {},
        battersArray: [],
      };
    }
    
    const inn = scorecards[matchId].innings[innIdx];

    // Update total runs and wickets
    inn.r += (parseInt(values[10]) || 0);
    if (isWicket && kind !== 'run out') { // only bowler wickets or general wickets
      inn.w += 1;
    } else if (isWicket && kind === 'run out') {
      inn.w += 1; // run out is also a wicket fall
    }
    
    // Update max overs (convert max over to display over like 19 overs 6 balls = 20.0)
    // Actually we just track max over.
    inn.maxOver = Math.max(inn.maxOver || 0, overs);
    inn.maxBall = Math.max(inn.maxBall || 0, parseInt(values[3]));

    // Batter stats
    if (!inn.battersMap[batter]) {
      const bObj = { name: batter, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'not out' };
      inn.battersMap[batter] = bObj;
      inn.battersArray.push(bObj);
    }
    const bStats = inn.battersMap[batter];

    // Wide balls don't count towards batter's balls faced
    if (extraType !== 'wides') {
      bStats.balls += 1;
    }
    bStats.runs += batsmanRun;
    if (batsmanRun === 4) bStats.fours += 1;
    if (batsmanRun === 6) bStats.sixes += 1;

    // Handle dismissals
    if (isWicket && playerOut !== 'NA') {
      if (!inn.battersMap[playerOut]) {
        const outObj = { name: playerOut, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'out' };
        inn.battersMap[playerOut] = outObj;
        inn.battersArray.push(outObj);
      }
      const outStats = inn.battersMap[playerOut];
      
      let dismissalText = 'out';
      if (kind === 'bowled') dismissalText = `b ${bowler}`;
      else if (kind === 'caught') dismissalText = `c ${fielders !== 'NA' ? fielders : 'fielder'} b ${bowler}`;
      else if (kind === 'lbw') dismissalText = `lbw b ${bowler}`;
      else if (kind === 'run out') dismissalText = `run out (${fielders !== 'NA' ? fielders : 'fielder'})`;
      else if (kind === 'stumped') dismissalText = `st ${fielders !== 'NA' ? fielders : 'wk'} b ${bowler}`;
      else if (kind === 'caught and bowled') dismissalText = `c & b ${bowler}`;
      else dismissalText = kind;
      
      outStats.dismissal = dismissalText;
    }
  });

  rl.on('close', () => {
    console.log('Processing data...');
    // Clean up data for frontend
    for (const matchId in scorecards) {
      const match = scorecards[matchId];
      match.innings = match.innings.filter(i => i !== null);
      
      match.innings.forEach(inn => {
        // Calculate overs (e.g. 19.4)
        if (inn.maxOver !== undefined && inn.maxBall !== undefined) {
          inn.o = `${inn.maxOver}.${inn.maxBall > 6 ? 6 : inn.maxBall}`;
          if (inn.maxBall >= 6) {
             inn.o = `${inn.maxOver + 1}.0`;
          }
        } else {
          inn.o = '0.0';
        }
        
        inn.batting = inn.battersArray.map(b => {
          return {
            name: b.name,
            runs: b.runs,
            balls: b.balls,
            fours: b.fours,
            sixes: b.sixes,
            dismissal: b.dismissal,
            sr: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0',
            notOut: b.dismissal === 'not out'
          };
        });
        delete inn.battersMap;
        delete inn.battersArray;
        delete inn.maxOver;
        delete inn.maxBall;
      });
    }

    const content = `// Auto-generated offline scorecards\nwindow.OFFLINE_SCORECARDS = ${JSON.stringify(scorecards)};\n`;
    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`Successfully generated scorecards for ${Object.keys(scorecards).length} matches and saved to js/offlineScorecards.js`);
  });

}).on('error', (err) => {
  console.error("Error fetching CSV:", err.message);
});
