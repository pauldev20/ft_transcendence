"use client"

import { Canvas } from "@react-three/fiber"
import React, { useEffect, useState } from 'react';
import { OrbitControls } from '@react-three/drei'; 
import Floor from "../sharedComponents/Floor";
import { gameValidation }  from "../sharedComponents/GameValidation"
import FinishLine from "../sharedComponents/FinishLine";
import { fieldGenerator, gridLineGenrator } from "./components/Grid";
import EndModal from "./components/EndModal";
import Camera from "../sharedComponents/Camera";
import Countdown from "../sharedComponents/Countdown";
import inputHandler from "@/components/inputHandler";

// Used to track user moves for validation
// '' = empty position, 'X' or 'O' or '⬜️' updated on user click
// Used to validate winning combinations.
const initialBoard = () =>  {
	return (
		[
			[
				['', '', '', ''],
				['', '', '', ''],
				['', '', '', ''],
				['', '', '', ''],
			],
			[
				['', '', '', ''],
				['', '', '', ''],
				['', '', '', ''],
				['', '', '', ''],
			],
			[
				['', '', '', ''],
				['', '', '', ''],
				['', '', '', ''],
				['', '', '', ''],
			],
			[
				['', '', '', ''],
				['', '', '', ''],
				['', '', '', ''],
				['', '', '', ''],
			],
		]
	);
}

// Initial coordinates for each field in the scene
// Each [0, 0, 0] represents the coordinates of a field
// Set on field creation.
const initialSceneCoords = [
	[
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
	],
	[
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
	],
	[
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
	],
	[
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
		[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
	],
];


// Represents the 4 coordinates forming a winning line.
// Extracted from initialSceneCords after finding a winner.
const winningCoords : [number, number, number][]= [
	[-1, -1, -1],[-1, -1, -1],[-1, -1, -1],[-1, -1, -1]
];

/**
 * The QubicScene component is a Three.js scene that represents the main scene of the Tic Tac Toe:Qubic game.
 * It handles game state, user interactions, and 3D rendering of the game board.
 * Uses various hooks for state management and effects for handling game logic,
 * resizing, modal display, and game completion.
 * @returns The entire Three.js scene, including the modal.
 */
const QubicScene = () => {
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const [clicked, click] = useState(false); // @note set to true to trigger validation
	const [currentTurn, setTurn] = useState('X');
	const [board, setCurrentBoardState] = useState(initialBoard()); // @note setter and getter for board state
	const [sceneCoords, setSceneCoords] = useState([...initialSceneCoords]);
	const [showFinishLine, setShowFinishLine] = useState(false);
	const [coords, setCoords] = useState([...winningCoords]);
	const [colour, setColour] = useState(0xffffff);
	const [showModal, setShowModal] = useState(false);
	const [gameOver, setGameOver] = useState(false);
	const [winner, setWinner] = useState('');
	const [countdownVisible, setCountdownVisible] = useState(true);
	const [reset, setReset] = useState(false);
	const keyMap = inputHandler();

	const closeModal = () => {
		setShowModal(false);
	}

	const openModal = () => {
		setShowModal(true);
	}

	// Handling the reset of the scene.
	useEffect(() => {
		if (reset) {
			closeModal();
			setCurrentBoardState(initialBoard());
			setTurn('X');
			setShowFinishLine(false);
			setCoords([...winningCoords]);
			setColour(0xffffff);
			setGameOver(false);
			setWinner('');
			setCountdownVisible(true);
			setReset(false);
		}
	}, [reset]);

	// Opens the EndModal after a delay if the 'gameOver' state is true.
	useEffect(() => {
		if (gameOver) {
			const delay = 2000;
			const modalTimeout = setTimeout(() => {
				openModal();
			}, delay);

			return (() => {
				clearTimeout(modalTimeout)
			});
		}
	}, [gameOver]);

	// Updates window dimensions on window resizing and
	// changes the turn after a clicked field and checks if a winning condition
	// is achived.
	useEffect(() => {
		const handleResize = () => {
			setDimensions({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		}

		const checkClick = () => {
			if (clicked) {
				if (currentTurn == 'X')
					setTurn('O');
				else if (currentTurn == 'O')
					setTurn('⬜️');
				else
					setTurn('X');
				click(false);
				const winner = gameValidation(board, sceneCoords, coords, setCoords);
				if (winner) {
					if (winner === 'X') {
						setShowFinishLine(true);
						setColour(0xff0000);
					}
					else if (winner === 'O') {
						setShowFinishLine(true);
						setColour(0x1aabff)
					}
					else if (winner === '⬜️') {
						setShowFinishLine(true);
						setColour(0x008000)
					}
					setWinner(winner);
					setGameOver(true);
				}
			}
		}

		checkClick();
		handleResize();

		window.addEventListener('resize', handleResize);

		return (() => {
			window.removeEventListener('resize', handleResize);
		});
	}, [clicked]);

	return (
		<div style={{ width: '100%', height: '100%' }}>
			<Canvas style={{ width: dimensions.width, height: dimensions.height }}>
				<Camera keyMap={keyMap} target={[4, 1, 2]} reset={reset} />
				<Countdown countdownVisible={countdownVisible} setCountdownVisible={setCountdownVisible} />
				{gridLineGenrator()}
				{!countdownVisible && fieldGenerator(clicked, click, currentTurn, board, setCurrentBoardState, sceneCoords, setSceneCoords, gameOver)}
				<Floor	position={[ 3, -0.2, 3]} args={[0.25, 23.2, 23.2]} /> 
				<Floor	position={[ 3,  7.8, 3]} args={[0.25, 23.2, 23.2]} />
				<Floor	position={[ 3, 15.8, 3]} args={[0.25, 23.2, 23.2]} />
				<FinishLine coords={coords} visible={showFinishLine} colour={colour} />
				<OrbitControls enableZoom={true} target={[4, 1, 2]} enableRotate={!countdownVisible} enablePan={false} />
			</Canvas>
			<EndModal setReset={setReset} isOpen={showModal} onClose={closeModal} winner={winner} />
		</div> 
	);
}

export default QubicScene;