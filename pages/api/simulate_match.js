import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { MongoClient, ServerApiVersion } from 'mongodb';
//const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'; //  local Ollama server
const OLLAMA_URL = process.env.OLLAMA_URL || 'https://lakia-semifuturistic-unbecomingly.ngrok-free.dev';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?appName=Cluster0';
const dbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';
const collectionName = process.env.MONGODB_CURRENT_GAME_DATA_COLLECTION || 'Current_game_data';

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let clientPromise;

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST method required' });
  }

  const { homeTeam, awayTeam } = req.body;

  //  data/worldcup2022.json
  const filePath = path.join(process.cwd(), 'data', 'worldcup2022.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const worldCupData = JSON.parse(rawData);

  const home = worldCupData.teams.find(
    t => t.name.toLowerCase() === homeTeam.toLowerCase()
  );
  const away = worldCupData.teams.find(
    t => t.name.toLowerCase() === awayTeam.toLowerCase()
  );

  if (!home || !away) {
    return res.status(404).json({ error: 'Team not found' });
  }

  const homePlayerNames = Array.isArray(home.players)
    ? home.players.map(player => String(player?.name || '').trim()).filter(Boolean)
    : [];
  const awayPlayerNames = Array.isArray(away.players)
    ? away.players.map(player => String(player?.name || '').trim()).filter(Boolean)
    : [];

  const getRandomPlayer = (playerNames, fallbackName) => { //fallback 
    if (!Array.isArray(playerNames) || playerNames.length === 0) {
      return fallbackName;
    }
    return playerNames[Math.floor(Math.random() * playerNames.length)];
  };

  const buildEventDescription = (eventType, playerName, teamName) => {
    switch (eventType) {
      case 'goal':
        return `Goal by ${playerName} for ${teamName}`;
      case 'penalty_scored':
        return `Penalty scored by ${playerName} for ${teamName}`;
      case 'penalty_missed':
        return `Penalty missed by ${playerName} for ${teamName}`;
      case 'yellow_card':
        return `Yellow card for ${playerName}`;
      case 'red_card':
        return `Red card for ${playerName}`;
      case 'substitution':
        return `Substitution involving ${playerName} for ${teamName}`;
      case 'injury':
        return `Injury for ${playerName}`;
      default:
        return `${eventType || 'match event'} by ${playerName} for ${teamName}`;
    }
  };

  const normalizeEventTeam = (rawTeam, playerName) => {
    const normalizedTeam = String(rawTeam || '').trim().toLowerCase();
    if (normalizedTeam === 'home' || normalizedTeam === home.name.toLowerCase()) {
      return 'home';
    }
    if (normalizedTeam === 'away' || normalizedTeam === away.name.toLowerCase()) {
      return 'away';
    }

    if (homePlayerNames.includes(playerName)) {
      return 'home';
    }
    if (awayPlayerNames.includes(playerName)) {
      return 'away';
    }

    return 'home';
  };

  const normalizeEventMinute = (rawMinute, fallbackIndex) => {
    const cleaned = String(rawMinute ?? '')
      .trim()
      .replace(/["']/g, '')
      .replace(/\s+/g, '');

    const match = cleaned.match(/^(\d{1,2})(?:\+(\d{1,2}))?$/);
    if (!match) {
      const fallbackMinute = Math.min(90, Math.max(1, (fallbackIndex + 1) * 10));
      return String(fallbackMinute);
    }

    const base = Math.min(90, Math.max(1, Number(match[1])));
    const extra = match[2] ? Math.min(9, Math.max(1, Number(match[2]))) : null;

    if (base === 45 && extra !== null) {
      return `45+${extra}`;
    }
    if (base === 90 && extra !== null) {
      return `90+${extra}`;
    }
    return String(base);
  };

  const minuteSortValue = (minute) => {
    const text = String(minute || '').trim();
    const plus = text.match(/^(\d{1,2})\+(\d{1,2})$/);
    if (plus) {
      return Number(plus[1]) + (Number(plus[2]) / 100);
    }
    return Number(text) || 0;
  };

  const prompt = `
You are a football match predictor.
Home: ${home.name}, Players: ${homePlayerNames.join(', ')}, Total Goals: ${home.total_goals}, Possession: ${home.ball_possession}, Placement: ${home.placement}
Away: ${away.name}, Players: ${awayPlayerNames.join(', ')}, Total Goals: ${away.total_goals}, Possession: ${away.ball_possession}, Placement: ${away.placement}

Based on those stats from the 2022 World Cup, predict the outcome of a match that could REALISTICALLY happen between these two teams in the 2026 World Cup. (the average amount of fouls in a match is 10)

Return JSON ONLY, exactly like this format, but fill in the numbers realistically:
{
  "score": "HomeTeamGoals - AwayTeamGoals",
  "ball_possession": "HomeTeamPossession % - AwayTeamPossession %",
  "fouls": "HomeTeamFouls - AwayTeamFouls",
  "winner": "home/away/draw",
  "match_events": [
    {
      "minute": "12",
      "event": "goal",
      "team": "home",
      "player": "hometeam player name",
      "description": "Goal by hometeam player name for home team"
    },
    {
      "minute": "45+2",
      "event": "yellow_card",
      "team": "away",
      "player": "awayteam player name",
      "description": "Yellow card for awayteam player name"
    },
    {
      "minute": "88",
      "event": "injury",
      "team": "away",
      "player": "awayteam player name",
      "description": "Injury for awayteam player name"
    }
  ]
}

Rules:
- Return at least 8 match_events.
- There MUST be a winner for bracket matches.
- Possession must use percentage signs and add up to 100%.
- Use the real team names and players from worldcup2022.json.
- Allowed events: goal, yellow_card, red_card, substitution, penalty_missed, penalty_scored, injury.
- Goal events must match the score exactly.
- team must be home or away.
- player must belong to the correct team.
- minute must be "N", "45+X", or "90+X" and stay in strict chronological order.
- "45+X" only belongs at the end of the first half; "90+X" only belongs at the end of the match.
- Do NOT include any extra text or explanation.
`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
       },
      body: JSON.stringify({ model: 'llama3.1:8b', prompt, stream: false })
    });

    const text = await response.text();
    //console.log('RAW RESPONSE:', text);
    const rawResponse = JSON.parse(text);
    const result = JSON.parse(rawResponse.response); // Ollama puts output in `response`
    console.log('RAW RESULT:', JSON.stringify(result, null, 2));

    if (!Array.isArray(result.match_events)) {
      result.match_events = [];
    }

    result.match_events = result.match_events.map((event, index) => {
      const eventType = String(event?.event || '').trim().toLowerCase();
      const rawPlayerName = String(event?.player || '').trim();
      const normalizedTeam = normalizeEventTeam(event?.team, rawPlayerName);
      const teamName = normalizedTeam === 'home' ? home.name : away.name;
      const allowedPlayers = normalizedTeam === 'home' ? homePlayerNames : awayPlayerNames;
      const playerName = allowedPlayers.includes(rawPlayerName)
        ? rawPlayerName
        : getRandomPlayer(allowedPlayers, rawPlayerName || `${teamName} Player`);

      return {
        ...event,
        minute: normalizeEventMinute(event?.minute, index),
        team: normalizedTeam,
        player: playerName,
        description: buildEventDescription(eventType, playerName, teamName),
      };
    });

    result.match_events = result.match_events
      .map(event => ({ ...event, __sort: minuteSortValue(event.minute) }))
      .sort((a, b) => a.__sort - b.__sort)
      .map(({ __sort, ...event }) => event);

    // Count actual goal events per team
    const homeGoals = result.match_events.filter(
      e => (e.event === 'goal' || e.event === 'penalty_scored') && 
      (e.team === 'home' || e.team?.toLowerCase() === home.name.toLowerCase())
    ).length;

    const awayGoals = result.match_events.filter(
      e => (e.event === 'goal' || e.event === 'penalty_scored') && 
      (e.team === 'away' || e.team?.toLowerCase() === away.name.toLowerCase())
    ).length;

    // Force the score to match the actual goal events
    result.score = `${homeGoals} - ${awayGoals}`;

    // Fix winner based on corrected score
    if (homeGoals > awayGoals) result.winner = 'home';
    else if (awayGoals > homeGoals) result.winner = 'away';
    // Ollama is instructed to always provide a winner, so use its result for ties

    // Replace stored game data: clear Current_game_data, then store only this latest simulation.
    const client = await clientPromise;
    const currentGameData = client.db(dbName).collection(collectionName);

    await currentGameData.deleteMany({});

    const dbMatchEvents = Array.isArray(result.match_events)
      ? result.match_events.map(event => {
          const eventType = String(event?.event || '').trim().toLowerCase();
          if (eventType === 'penalty_scored') {
            return {
              ...event,
              event: 'goal',
            };
          }
          if (eventType === 'yellow_card' || eventType === 'red_card') {
            return {
              ...event,
              event: 'foul',
            };
          }
          return event;
        })
      : [];

    await currentGameData.insertOne({
      homeTeam: home.name,
      awayTeam: away.name,
      score: result.score || null,
      ball_possession: result.ball_possession || null,
      fouls: result.fouls || null,
      winner: result.winner || null,
      match_events: dbMatchEvents,
      createdAt: new Date(),
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error generating match outcome' });
  }
}