# IPL Cricket Tracker

Welcome to the **IPL Cricket Tracker** project! This is a modern, responsive web application that tracks live cricket matches, team performances, and player statistics for the Indian Premier League (IPL).

## Table of Contents

1. [How It Works](#how-it-works)
2. [Data Architecture](#data-architecture)
3. [The Hybrid Data Model](#the-hybrid-data-model)
4. [How to Run the Project](#how-to-run-the-project)
5. [Project Structure](#project-structure)

---

## How It Works

The web app is built using vanilla HTML, CSS, and JavaScript. We use a **Clean Light Dashboard** aesthetic, featuring soft shadows, clean typography (using Google Fonts _Inter_ and _Outfit_), and smooth micro-animations.

The core functionality of the app handles:
- **Live Match Tracking:** Fetching real-time match statuses and scores.
- **Team Profiles:** Aggregating historical match data to calculate wins, losses, win rates, and top performers.
- **Player Profiles:** Displaying individual career timelines, batting/bowling styles, and season-by-season performance.
- **Points Table:** Automatically generating the points table for any historical season based on match outcomes.

## Data Architecture

The project relies on a dual-source data architecture.

### 1. Live Data via RapidAPI
We use the **Cricket API Free Data** available on RapidAPI to fetch real-time updates for ongoing matches, series fixtures, and recent results.
- **API File:** `js/cricketAPI.js` handles all outgoing requests.
- **Authentication:** Managed via an API Key stored in `js/config.js` (which is git-ignored to prevent leaking secrets).
- **Endpoints Used:** We fetch active matches (`/fixtures`) and filter for T20 formats and IPL-specific matches.
- **Caching:** The API calls are cached locally in memory (`window.apiCache`) for a specified duration (e.g., 60 seconds) to prevent rate-limiting and improve performance.

### 2. Historical Data (Offline JSON/CSV)
Because live APIs rarely provide deep historical data for free, we packaged **19 seasons of IPL history** directly into the app.
- **Historical Matches:** `js/offlineData.js` contains thousands of match records (teams, venues, winners, player-of-the-match, etc.) from 2008 to 2024.
- **Assets Pipeline:** 
  - We use Node scripts (`scripts/fetchAssets.js` and `scripts/fetchData.js`) to parse raw CSV files from open-source datasets (e.g., GitHub repositories containing IPL datasets).
  - The script extracts team logos, player images, full names, batting styles, and playing roles, then writes them into `js/assetsData.js` as global JavaScript objects (`TEAM_LOGOS` and `PLAYER_PROFILES`).
- **Dynamic Calculation:** Instead of hard-coding the points table or team stats, the application (`js/app.js`) iterates over `ALL_MATCHES` on the fly to compute win rates, map out career spans, and rank teams for a given year.

## The Hybrid Data Model

By combining real-time API polling with a rich, static historical database, the app achieves:
- **High Performance:** No database lookup delays for historical stats; everything is calculated instantly in the client's browser.
- **Reliability:** If the live API goes down or hits a rate limit, the core features of the site (Team Profiles, Player Profiles, History) continue to work flawlessly.
- **Cost-Effective:** Minimizes API calls by only requesting live matches, keeping the app well within the free tier limits of RapidAPI.

## How to Run the Project

1. **Clone the Repository:** Download the project files.
2. **Setup API Key:**
   - Rename `js/config.example.js` to `js/config.js`.
   - Open `js/config.js` and insert your RapidAPI key for the "Cricket API Free Data".
3. **Run a Local Server:**
   - Because the project uses ES6 Modules or standard file fetching, it must be run over a local web server (not just double-clicking `index.html`).
   - You can use an extension like **Live Server** in VS Code, or run `npx serve -l 8080` in your terminal.
4. **View the App:** Open `http://localhost:8080` in your browser.

## Project Structure

```text
ipl-tracker/
├── css/
│   └── style.css            # The main stylesheet (Light Dashboard Theme)
├── js/
│   ├── app.js               # Main application logic (Routing, UI rendering)
│   ├── assetsData.js        # Auto-generated file containing Logos and Player Images
│   ├── config.js            # Configuration and API Keys (Not tracked in Git)
│   ├── cricketAPI.js        # Handles fetching and caching live API data
│   └── offlineData.js       # The massive historical database of matches
├── scripts/
│   ├── fetchAssets.js       # Node script to download and parse player/team assets from CSVs
│   └── fetchData.js         # Node script to build the offline match dataset
├── index.html               # The entry point of the application
├── EXPLANATION.md           # This file
└── .gitignore               # Ensures sensitive files aren't uploaded to Git
```

Enjoy tracking the IPL!
