export default function PlayerList({ players = [], host }) {

  if (!players.length) {
    return <div>Нет игроков</div>;
  }

  return (

    <div className="players">

      {players.map((p) => (

        <div key={p.id} className="player">

          {p.id === host && "👑 "}

          {p.name}

        </div>

      ))}

    </div>

  );

}