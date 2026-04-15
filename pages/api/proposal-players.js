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

            players.push({
                id: `${team?.id ?? teamIndex}-${playerIndex}`,
                name: playerName,
                number: '1',
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