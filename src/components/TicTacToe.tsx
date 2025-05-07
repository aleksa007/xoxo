import { useState, useEffect } from 'react';
import './TicTacToe.css';
import { db } from '../firebase';
import { ref, set, onValue, get, remove } from 'firebase/database';

type Player = 'X' | 'O' | null;

type GameState = {
  board: Player[];
  isXNext: boolean;
  winner: Player;
};

const defaultState: GameState = {
  board: Array(9).fill(null),
  isXNext: true,
  winner: null,
};

const TicTacToe = () => {
  const [roomId, setRoomId] = useState('');
  const [inputRoom, setInputRoom] = useState('');
  const [player, setPlayer] = useState<Player>(null);
  const [game, setGame] = useState<GameState>(defaultState);
  const [status, setStatus] = useState('');
  const [waiting, setWaiting] = useState(false);

  // Calculate winner
  const calculateWinner = (squares: Player[]): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  // Listen for game state changes
  useEffect(() => {
    if (!roomId) return;
    const gameRef = ref(db, `rooms/${roomId}`);
    const unsub = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data.board)) {
        setGame(data);
        setWaiting(false);
      } else {
        setGame(defaultState);
      }
    });
    return () => unsub();
  }, [roomId]);

  // Set status message
  useEffect(() => {
    if (!roomId) return;
    if (game.winner) setStatus(`Winner: ${game.winner}`);
    else if (game.board.every(square => square)) setStatus('Draw!');
    else if (player) setStatus(game.isXNext === (player === 'X') ? 'Your turn' : "Opponent's turn");
    else setStatus('');
  }, [game, player, roomId]);

  // Create a new room
  const createRoom = async () => {
    const newRoom = Math.random().toString(36).substring(2, 8);
    await set(ref(db, `rooms/${newRoom}`), defaultState);
    setRoomId(newRoom);
    setPlayer('X');
    setWaiting(true);
  };

  // Join an existing room
  const joinRoom = async () => {
    if (!inputRoom) return;
    const roomRef = ref(db, `rooms/${inputRoom}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      setRoomId(inputRoom);
      setPlayer('O');
    } else {
      alert('Room not found!');
    }
  };

  // Handle move
  const handleClick = async (index: number) => {
    if (!roomId || !player) return;
    if (game.board[index] || game.winner) return;
    if ((game.isXNext && player !== 'X') || (!game.isXNext && player !== 'O')) return;
    const newBoard = [...game.board];
    newBoard[index] = player;
    const winner = calculateWinner(newBoard);
    await set(ref(db, `rooms/${roomId}`), {
      board: newBoard,
      isXNext: !game.isXNext,
      winner: winner,
    });
  };

  // Reset game
  const resetGame = async () => {
    if (!roomId) return;
    await set(ref(db, `rooms/${roomId}`), defaultState);
  };

  // Leave room (cleanup)
  const leaveRoom = async () => {
    if (roomId && player === 'X') {
      // X is host, remove room
      await remove(ref(db, `rooms/${roomId}`));
    }
    setRoomId('');
    setPlayer(null);
    setGame(defaultState);
    setInputRoom('');
    setStatus('');
    setWaiting(false);
  };

  console.log('waiting:', waiting, 'player:', player, 'isXNext:', game.isXNext);

  if (!roomId) {
    return (
      <div className="game">
        <h1>Tic Tac Toe</h1>
        <button className="reset-button" onClick={createRoom}>Create Room</button>
        <div style={{ margin: '16px 0' }}>or</div>
        <input
          type="text"
          placeholder="Enter Room Code"
          value={inputRoom}
          onChange={e => setInputRoom(e.target.value)}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #888', marginRight: 8 }}
        />
        <button className="reset-button" onClick={joinRoom}>Join Room</button>
      </div>
    );
  }

  return (
    <div className="game">
      <h1>Tic Tac Toe</h1>
      <div className="status">Room: <b>{roomId}</b> | You are: <b>{player}</b></div>
      <div className="status">{waiting ? 'Waiting for opponent...' : status}</div>
      <div className="board">
        {Array.isArray(game.board) &&
          game.board.map((square, index) => (
            <button
              key={index}
              className="square"
              onClick={() => handleClick(index)}
              disabled={!!game.winner || (game.isXNext !== (player === 'X'))}
            >
              {square === 'X' && <span className="neon-x">X</span>}
              {square === 'O' && <span className="neon-o">O</span>}
            </button>
          ))}
      </div>
      <button className="reset-button" onClick={resetGame} style={{marginRight: 8}}>Reset Game</button>
      <button className="reset-button" onClick={leaveRoom}>Leave Room</button>
    </div>
  );
};

export default TicTacToe; 