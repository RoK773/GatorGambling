import fs from 'fs';
import path from 'path';
//const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'; //  local Ollama server
const OLLAMA_URL = process.env.OLLAMA_URL || 'https://lakia-semifuturistic-unbecomingly.ngrok-free.dev';

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
- ball possession percentages must add to 100
- Include between 3 and 8 match_events
- Use the real team names instead of "home team" and "away team"
- Use players of the provided teams from the data provided ('worldcup2022.json')
- event can be: goal, yellow_card, red_card, substitution, penalty_missed, penalty_scored, injury
- The number of goal events NEEDS to be the same as the number of goals in the score,(ex: if the score is 2-1, there should be 3 goal events)
- team must be: home or away
- player must be from the listed players for the event's team
- minute must be a football match minute string in one of these formats only: "N" or "45+X" or "90+X" (examples: "12", "45+1", "88", "90+3")
- minute values must be in strict chronological order from first event to last event (never place a later minute before an earlier minute)
- additional-time minutes can ONLY appear at the end of a half:
  - "45+X" is allowed only as the final minute(s) of the first half, after all first-half regular minutes (1-45)
  - after any "45+X" event, the next minute must be 46 or higher (never 44/45)
  - "90+X" is allowed only as the final minute(s) of the match, after all second-half regular minutes (46-90)
  - after any "90+X" event, there must be no later non-stoppage event
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

    result.match_events = result.match_events.map(event => {
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
        team: normalizedTeam,
        player: playerName,
        description: buildEventDescription(eventType, playerName, teamName),
      };
    });

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
    else result.winner = 'draw';

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error generating match outcome' });
  }
}