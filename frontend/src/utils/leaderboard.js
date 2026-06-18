export function buildLeaderboard(players = [], scores = {}, hostId = null) {
  return (players || [])
    .filter((player) => player?.id && player.id !== hostId)
    .map((player) => ({
      ...player,
      score: scores?.[player.id] || 0
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const nameA = (a.name || "").trim().toLowerCase();
      const nameB = (b.name || "").trim().toLowerCase();
      if (nameA !== nameB) {
        return nameA.localeCompare(nameB, "ru");
      }

      return String(a.id).localeCompare(String(b.id));
    })
    .map((player, index) => ({
      ...player,
      rank: index + 1
    }));
}
