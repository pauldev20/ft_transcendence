"use client"

import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei'; 
import inputHandler from '@/components/inputHandler';
import Camera from '../sharedComponents/Camera';
import Border from './components/Border';
import { RightPaddle, LeftPaddle, TopPaddle, BottomPaddle } from './components/Paddle';
import { Ball } from './components/Ball';
import { CubeLineY, CubeLineX }from './components/CubeLine';
import Scoreboard from './components/Scoreboard';
import EndModal from './components/EndModal';
import Countdown from '../sharedComponents/Countdown';
import { Mesh } from 'three'

/**
 * The OneForAllScene component is a Three.js scene representing a 4 player Pong game that includes various elements such as paddles,
 * ball, borders, camera, countdown, scoreboard, and a modal for displaying the winner.
 * @returns The entire Three.js scene, including the modal.
 */
export default function OneForAllScene() {
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const keyMap = inputHandler();
	const [p1Score, setP1Score] = useState(0);
	const [p2Score, setP2Score] = useState(0);
	const [p3Score, setP3Score] = useState(0);
	const [p4Score, setP4Score] = useState(0);
	const [showModal, setShowModal] = useState(false);
	const [winner, setWinner] = useState('');
	const [gameOver, setGameOver] = useState(false);
	const [scoreVisible, setScoreVisibility] = useState(false);
	const [reset, setReset] = useState(false);
	const [isBallVisible, setBallVisibility] = useState(true);
	
	const rightPaddleRef = useRef<Mesh>(null) as MutableRefObject<Mesh>;
	const leftPaddleRef = useRef<Mesh>(null) as MutableRefObject<Mesh>;
	const topPaddleRef = useRef<Mesh>(null) as MutableRefObject<Mesh>;
	const bottomPaddleRef = useRef<Mesh>(null) as MutableRefObject<Mesh>;
	const ballRef = useRef<Mesh>(null);

	const closeModal = () => {
		setShowModal(false);
	}

	const openModal = () => {
		setShowModal(true);
	}

	// Handles the reset of the scene when the 'reset' state changes.
	useEffect(() => {
		if (reset) {
			setBallVisibility(true);
			setGameOver(false);
			closeModal();
			setReset(false);
			setP1Score(0);
			setP2Score(0);
			setP3Score(0);
			setP4Score(0);
			setWinner('');
			setScoreVisibility(false);
		}
	}, [reset]);

	// Opens the EndModal after a delay if the 'gameOver' state is true.
	useEffect(() => {
		if (gameOver) {
			const delay = 1000;
			const modalTimeout = setTimeout(() => {
				openModal();
			}, delay);

			return (() => {
				clearTimeout(modalTimeout)
			});
		}
	}, [gameOver]);

	// Updates window dimensions on window resizing.
	useEffect(() => {
		const handleResize = () => {
			setDimensions({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		handleResize();

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	return (
		<div style={{ width: '100%', height: '100%' }}>
			<Canvas style={{ width: dimensions.width, height: dimensions.height }}>
				<Countdown scoreVisible={scoreVisible} setScoreVisibility={setScoreVisibility} rotation={[Math.PI / 2, 0, 0]} />
				<Camera position={[0, -350, 100]} keyMap={keyMap} /> 
				<Border />
				<TopPaddle ref={topPaddleRef} position={[0, 151, 0]} keyMap={keyMap} />
				<BottomPaddle ref={bottomPaddleRef} position={[0, -151, 0]} keyMap={keyMap} />
				<RightPaddle ref={rightPaddleRef} position={[151, 0, 0]} keyMap={keyMap} />
				<LeftPaddle ref={leftPaddleRef} position={[-151, 0, 0]} keyMap={keyMap} />
				<Ball
					rightPaddleRef={rightPaddleRef}
					leftPaddleRef={leftPaddleRef}
					topPaddleRef={topPaddleRef}
					bottomPaddleRef={bottomPaddleRef}
					p1Score={p1Score} setP1Score={setP1Score}
					p2Score={p2Score} setP2Score={setP2Score}
					p3Score={p3Score} setP3Score={setP3Score}
					p4Score={p4Score} setP4Score={setP4Score}
					setWinner={setWinner}
					gameOver={gameOver} setGameOver={setGameOver}
					scoreVisible={scoreVisible}
					isBallVisible={isBallVisible} setBallVisibility={setBallVisibility}
					ref={ballRef}
				/>
				<CubeLineY />
				<CubeLineX />
				<OrbitControls enablePan={false} />
				<Scoreboard 
					player1={p1Score} player2={p2Score} player3={p3Score} player4={p4Score}
					rightPaddleRef={rightPaddleRef} leftPaddleRef={leftPaddleRef}
					topPaddleRef={topPaddleRef} bottomPaddleRef={bottomPaddleRef}
					scoreVisible={scoreVisible} />
				<Stats />
			</Canvas>
			<EndModal isOpen={showModal} onClose={closeModal} winner={winner} setReset={setReset} />
		</div>
	);
}
