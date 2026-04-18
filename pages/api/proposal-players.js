import worldcupData from '../../data/worldcup2022.json';

function mapWorldCupPlayers() {
    const teams = Array.isArray(worldcupData?.teams) ? worldcupData.teams : [];
    const players = [];

    teams.forEach((team, teamIndex) => {
        const teamName = String(team?.name || '').trim() || 'Unknown Team';
        const teamPlayers = Array.isArray(team?.players) ? team.players : [];

        teamPlayers.forEach((player, playerIndex) => {
            const playerName = String(player?.name || '').trim();
            if (!playerName) {
                return;
            }
            const jerseyNumberRaw = player?.jersey_number;
            const jerseyNumber = Number.isFinite(Number(jerseyNumberRaw))
                ? String(Number(jerseyNumberRaw))
                : '-';

            players.push({
                id: `${team?.id ?? teamIndex}-${playerIndex}`,
                name: playerName,
                number: jerseyNumber,
                pos: teamName,
            });
        });
    });

    return players;
}

export default function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(200).json({
        players: mapWorldCupPlayers(),
    });
}