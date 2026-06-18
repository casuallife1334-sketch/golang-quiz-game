export default function JoinGame({goBack}){

  return(

    <div className="screen">

      <h2>Присоединиться к игре</h2>

      <input
        className="input"
        placeholder="Введите код игры"
      />

      <button className="main-button">
        Подключиться
      </button>

      <button className="back" onClick={goBack}>
        Назад
      </button>

    </div>

  )

}