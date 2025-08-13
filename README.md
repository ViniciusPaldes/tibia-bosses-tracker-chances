# tibia-bosses-tracker-chances

## Overview
`tibia-bosses-tracker-chances` is a supporting project for **[tibia-bosses-tracker-app](https://github.com/your-org/tibia-bosses-tracker-app)**.  
Its role is to provide **daily-calculated boss spawn chances** along with detailed boss metadata.

This project is also an **AI learning experiment**, created and refined with the help of **Cursor** and **ChatGPT** to explore prompt-driven development.

## Features
- Fetches **last seen** data for Tibia bosses from external kill statistics
- Combines last seen with **configurable spawn ranges** (`start_day` and `end_day`)
- Calculates **chance statuses**:
  - `High`
  - `Medium`
  - `Low`
  - `No Chance` (killed yesterday)
  - `Lost Track` (past end day)
- Returns **full boss metadata**:
  - Name
  - Start/End spawn days
  - Multiple locations with coordinates
  - Loot list

## Architecture
The system runs as a **scheduled GitHub Action** that:
1. Retrieves kill statistics for all configured worlds.
2. Uses `bossConfig.json` to determine spawn chance windows.
3. Outputs structured JSON data to: data/WORLD/DATE.json
4. This JSON is then consumed by **tibia-bosses-tracker-app**.

### Folder Structure
```text
/data                 # Daily output JSON files
/bossConfig.json      # Boss spawn config and metadata
/src                  # Data fetch and processing logic
/.github/workflows    # Automation scripts for daily runs
```

## Boss Config Format
Example entry:
```json
{
  "name": "Arachir The Ancient One",
  "start_day": 6,
  "end_day": 9,
  "locations": [
    { "city": "Darashia", "coords": "32968,32400,12:2" },
    { "city": "Ankrahmun", "coords": "33014,32891,15:5" }
  ],
  "loots": [
    "Bloody Edge",
    "Vampire Lord Token"
  ]
}
```
## Development

This project is data-only and intended for backend/stateless operation.

## Requirements
- Node.js 18+
- Yarn or npm

## Scripts
### Install dependencies
```
yarn install
```
### Run data fetch manually
```
yarn fetch-data
```
### Lint code
```
yarn lint
```
## Automation

The repository is configured to update daily via GitHub Actions:
- Fetches all configured worlds.
- Generates fresh chance data.
- Commits the results.
