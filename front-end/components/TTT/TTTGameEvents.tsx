import { useEffect } from "react";

import { initialBoard, winningCoords } from "@/app/tic-tac-toe/context/TTTGameState";
import { useGameState } from "@/app/tic-tac-toe/hooks/useGameState";
import { useSocket } from "@/app/tic-tac-toe/hooks/useSocket";
import { useKey } from "../hooks/useKey";

export const TTTGameEvents = () => {
	const {
		gameState,
		setBoard,
		setTurn,
		setLineCoords,
		updateGameState,
		setWinner,
		setCountdownVisible,
		countdownVisible,
		setLineVisible,
		isGameMode,
		tournament
	} = useGameState();
	const { rematchIndex, setRematchIndex, setRequestRematch, setSendRequest } = useSocket();

	const escape = useKey(['Escape']);

	// Handling the reset of the scene, resetting important states.
	useEffect(() => {
		if (gameState.reset) {
			setBoard(initialBoard());
			setTurn('');
			setLineCoords([...winningCoords]);
			setWinner('');
			setCountdownVisible(true);
			setLineVisible(false)
			updateGameState({ ...gameState, reset: false, gameOver: false})
		}
	}, [gameState]);

	useEffect(() => {
		if (escape.isKeyDown)
			updateGameState({ ...gameState, pause: true});
	},[escape])

	useEffect(() => {
		if (rematchIndex === (isGameMode ? 3 : 2)) {
			updateGameState({ ...gameState, reset: true});
			setRequestRematch(false);
			setSendRequest(false);
			setRematchIndex(0);
		}
	}, [rematchIndex]);

	useEffect(() => {
		if (!countdownVisible)
			setTurn('X');
	}, [countdownVisible]);

	return (null);
}