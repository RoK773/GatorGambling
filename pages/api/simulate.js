const API_KEY = process.env.API_KEY || '0c67853afd04b72d81402f2e02e477e4';
const LEAGUE_ID = 1; // this is what the API uses for the World Cup
const SEASON = 2022; // most recent data of world cup

//fetching API-football, attaches api key header to all requests, returns the response data
async function fetchingfromAPI(endpoint){
    const response = await fetch(`https://v3.football.api-sports.io/${endpoint}`, {
        headers: {'x-apisports-key': API_KEY}
    });
    const data = await response.json();
    return data.response;
}

//get the team id, the team stats, and their players
async function getData(teamName){
    const teams = await fetchingfromAPI(`teams?search=${teamName}`);
    if(!teams.length) return null; // if no teams found, return null

    const team = teams[0].team; // take the first team that matches the search, since there should only be one team with that name in the world cup

    const [stats, players] = await Promise.all([
        fetchingfromAPI(`teams/statistics?league=${LEAGUE_ID}&season=${SEASON}&team=${team.id}`),
        fetchingfromAPI(`players?team=${team.id}&season=${SEASON}`)
    ]);
    return {team,stats,players}
}

//then prompt omalla 
async function promptOmalla(prompt){
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {'Content-Type' : 'application/json'},
        body: JSON.stringify({
            model: 'llama3.2', prompt, stream: false //stream can be changed if we want?
        })
    });

    const data = await response.json();
    return data.response; //olama retuns the text inside response
}

async function simulate(team1, team2){
    console.log('Fetching data for teams...');
    const [team1Data, team2Data] = await Promise.all([
        getData(team1),
        getData(team2)
    ]);

    //if either was not found, return an error message
    if (!team1Data || !team2Data) {
        console.log('Error finding teams')
        return;
    }

    //format the team stats into readable prompt text for omalla
    const formatTeam = (name, data) => `
    ${name}:
    - Wins: ${data.stats?.fixtures?.wins?.total ?? 'N/A'}
    - Goals scored: ${data.stats?.goals?.for?.total?.total ?? 'N/A'}
    - Goals against: ${data.stats?.goals?.against?.total?.total ?? 'N/A'}`;
    //- Players: ${data.players.slice(0, 11).map(p => p.player.name).join(', ')}`; // might not be correct

    const prompt = `
    You are a soccer match simulator. Based on the following REAL team stats from FIFA World Cup 2022,
    simulate a match that would take place in the 2026 World Cup between ${team1} and ${team2}.
    ${formatTeam(team1, team1Data)}
    ${formatTeam(team2, team2Data)}
    Generate *ONLY* the following, no intro, no explanation, nothing additional: 
    - a final score: ${team1} X - ${team2} X
    - Red cards: ${team1} (X) - ${team2} (X)
    - Yellow cards: ${team1} (X) - ${team2} (X)
    - Fouls: ${team1} (X) - ${team2} (X)
    - Ball possession: ${team1} (X%) - ${team2} (X%)
    `;

    // console.log('\nSending stats to Omalla\n');

    // const result = await promptOmalla(prompt);

    // console.log("\nResult:\n");
    // console.log(result);
    return await promptOmalla(prompt);
}

// simulate('Argentina', 'Brazil');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

    const {team1, team2} = req.body;
    if (!team1 || !team2) return res.status(400).json({error: 'Missing teams'});

    try{
        const result = await simulate(team1, team2);
        if (!result) return res.status(404).json({error: 'Teams not found'});
        res.status(200).json({result});
    } catch (error) {
        res.status(500).json({error: 'Simulation fail'});
    }
}
