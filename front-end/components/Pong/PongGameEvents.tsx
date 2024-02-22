import { usePongGameState } from "@/app/pong/hooks/usePongGameState";
import { usePongSocket } from "@/app/pong/hooks/usePongSocket";
import { useEffect, useMemo } from "react";
import { useKey } from "../hooks/useKey";

interface PositionInfo {
	camPosition: [number, number, number],
	countdownRotation:[number, number, number],
	countdownPosition: [[number, number, number], [number, number, number]]
}

export const PongGameEvents = () => {
	// Provider hooks 
	const {
		setScores,
		pongGameState,
		updatePongGameState,
		setWinner,
		setBallVisibility,
		setScoreVisibility,
		setCamPos,
		setCountdownRot,
		setCountdownPos,
		isGameMode,
		isScoreVisible
	} = usePongGameState();
	const {
		playerState,
		rematchIndex,
		setRequestRematch,
		setSendRequest,
		setRematchIndex,
		continueIndex,
		setSendContinueRequest,
		setContinueIndex
	} = usePongSocket();

	// Normal hooks
	const escape = useKey(['Escape']);

	const positionInfo = useMemo<PositionInfo[]>(() => {
		return [
			{
				camPosition: [0, 350, 400],
				countdownRotation: [0, 0, 0],
				countdownPosition: [
					[-23, 50, 0],
					[-35, 50, 0]
				]
			},
			{
				camPosition: [-400, 350, 0],
				countdownRotation: [Math.PI / 2, -Math.PI / 2, Math.PI / 2],
				countdownPosition: [
					[0, 50, -23],
					[0, 50, -35]
				]
			},
			{
				camPosition: [0, 350, -400],
				countdownRotation: [-Math.PI, 0, Math.PI],
				countdownPosition: [
					[23, 50, 0],
					[35, 50, 0]
				]
			},
			{
				camPosition: [400, 350, 0],
				countdownRotation: [-Math.PI / 2, Math.PI / 2, Math.PI / 2],
				countdownPosition: [
					[0, 50, 23],
					[0, 50, 35]
				]
			}
		];
	}, []);

	useEffect(() => {
		if (playerState.client !== -1) {
			if (!isGameMode) {
				const newCountdownPos = [
					[-23, 50, 0] as [number, number, number],
					[-35, 50, 0] as [number, number, number]
				]
				setCountdownPos(newCountdownPos);
				setCountdownRot([-Math.PI /2, 0, 0]);
				return ;
			}
			setCamPos(positionInfo[playerState.client].camPosition);
			const newCountdownPos = [
				positionInfo[playerState.client].countdownPosition[0],
				positionInfo[playerState.client].countdownPosition[1]
			]
			setCountdownPos(newCountdownPos);
			setCountdownRot(positionInfo[playerState.client].countdownRotation)
		}
	},[playerState.client, isGameMode, positionInfo, setCamPos, setCountdownPos, setCountdownRot]);

	// Handles the reset of the scene when the 'reset' state changes.
	useEffect(() => {
		if (pongGameState.reset) {
			setBallVisibility(true);
			setScores({ p1Score: 0, p2Score: 0, p3Score: 0, p4Score: 0 });
			setWinner('');
			setScoreVisibility(false);
			updatePongGameState({ reset: false, gameOver: false });
		}
	}, [pongGameState.reset, setBallVisibility, setScoreVisibility, setScores, setWinner, updatePongGameState]);

	// Handle pause when esc is pressed
	useEffect(() => {
		if (escape.isKeyDown && !pongGameState.gameOver && isScoreVisible) {
			updatePongGameState({ pause: true});
		}
	},[escape.isKeyDown, pongGameState.gameOver, isScoreVisible, updatePongGameState])

	// Execute reset when all players want a rematch
	useEffect(() => {
		// Check if all players have requested a rematch
		if (rematchIndex === (isGameMode ? 4 : 2)) {
			// Reset rematch-related flags
			setRequestRematch(false);
			setSendRequest(false);
			setRematchIndex(0);

			// Update game state to trigger a reset
			updatePongGameState({ reset: true })
		}
	}, [rematchIndex, isGameMode, setRequestRematch, setSendRequest, setRematchIndex, updatePongGameState]);

	// Resumes the game when all players want to continue.
	useEffect(() => {
		// Check if all players have requested to continue.
		if (continueIndex === (isGameMode ? 4 : 2)) {
			// Add delay so the game won't start right away
			setTimeout(() => {
				// Reset pause-related flags
				setContinueIndex(0);
				setSendContinueRequest(false);

				// Update game state to trigger a resume of the game
				updatePongGameState({ pause: false});
			}, 1000);
		}
	}, [continueIndex, isGameMode, setContinueIndex, setSendContinueRequest, updatePongGameState]);

	return (null);
}