export default function PlayerList({ players = [], host }) {
  const gamePlayers = players.filter((player) => player.id !== host);

  if (!gamePlayers.length) {
    return <div>Нет игроков</div>;
  }

  return (

    <div className="players">

      {gamePlayers.map((p) => (

        <div key={p.id} className="player">

          {p.name}

        </div>

      ))}

    </div>

  );

}
