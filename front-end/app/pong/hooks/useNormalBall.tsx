import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { usePongGameState } from "./usePongGameState";
import { usePongSocket } from "./usePongSocket";

export const useBall = () => {
	const {
		ballRef,
		scores,
		setWinner,
		setBallVisibility,
		setPongGameState,
		pongGameState,
		isScoreVisible,
		leftPaddleRef,
		rightPaddleRef,
		setScores
	} = usePongGameState();
	const { wsclient, playerState } = usePongSocket();

	const temp = useRef({ x: 0, z: 0, velocityX: 0, velocityZ: 0, speed: 0.1 });
	const PositionRef = useRef({position: {x:0, z:0}, velocity: {x:0, z:0}, deltaTime: 0});
	const halfPaddleWidth = 4 / 2;
	const halfPaddleHeight = 30 / 2;
	const halfBall = 2;

	/**
	 * Changes the ball's direction after it collided with a paddle.
	 * @param paddlePos - the position of the paddle.
	 * 					  Contains 'x' and 'z' properties.
	 * @param direction - The direction (1 or -1) indicating the side of the paddle the ball collided with:
	 * 					  -  1: Collided with the left paddle.
	 * 					  - -1: Collided with the right paddle.
	 */
	const changeBallDir = (paddlePos: THREE.Vector3, direction: number) => {
		const ball = temp.current;
		const deltaZ = ball.z - paddlePos.z;
		const normalizedY = deltaZ / halfPaddleHeight;

		if (ball.speed <= 2)
			ball.speed += 0.2;
		ball.velocityX = direction * ball.speed;
		ball.velocityZ = normalizedY * ball.speed;
	}

	useEffect(() => {
		if (pongGameState.gameOver && ballRef && ballRef.current) {
			temp.current.velocityX = 0
			temp.current.velocityZ = 0
			ballRef.current.position.x = 0;
			ballRef.current.position.z = 0;
		}
	},[pongGameState.gameOver]);

	/**
	 * Sets the ball back to the middle and generates a random direction for the ball.
	 * It randomly takes one specified range and calculates with it a angle to determin the ball's direction.
	 */
	const randomBallDir = () => {
		let ball = temp.current;
		ball.x = 0;
		ball.z = 0;
		ball.speed = 1.2;

		const ranges = [
			{min: -37.5, max: 37.5},
			{min: 142.5, max: 218.5},
		];

		const { min, max } = ranges[Math.floor(Math.random() * ranges.length)];
		const angle = (Math.random() * (max - min) + min) * (Math.PI / 180);

		ball.velocityX = ball.speed * Math.sin(angle + (Math.PI / 2));
		ball.velocityZ = ball.speed * Math.cos(angle + (Math.PI / 2));
	}

	/**
	 * Updates the new position of the ball based on its velocity and the time passed since last frame (deltaTime).
	 * @param ball - The ball object containing position and velocity properties.
	 * 				 Contains 'x', 'z', 'velocityX', and 'velocityZ' fields.
	 * @param deltaTime - The time passed since the last frame, in seconds.
	 * 					  Used to ensure independence from the frame rate.
	 */
	const updateBallPosition = (ball: { x: number; z: number; velocityX: number; velocityZ: number; }, deltaTime: number) => {
		if (pongGameState.pause)
			return ;
		if (playerState.master) {
			ball.x += ball.velocityX * 100 * deltaTime;
			ball.z += ball.velocityZ * 100 * deltaTime;
			const msg = {
				position: { x: ball.x, z: ball.z },
				velocity: { x: ball.velocityX, z: ball.velocityZ },
				deltaTime: deltaTime
			}
			const stringPos = JSON.stringify(msg);
			wsclient?.emitMessageToGame(stringPos, `ballUpdate-${pongGameState.gameId}`, pongGameState.gameId);
		} else {
			const { position, velocity, deltaTime } = PositionRef.current;
			ball.x = -position.x + -velocity.x * deltaTime;
			ball.z = position.z + velocity.z * deltaTime;
		}

		if (ballRef.current) {
			ballRef.current.position.x = ball.x;
			ballRef.current.position.z = ball.z;
		}
		// if (props.onPositionChange && ballRef.current) {
		// 	props.onPositionChange(ballRef.current.position);
		// }
	}

	useEffect(() => {
		const setNewCoords = (msg: string) => {
			const newPosition = JSON.parse(msg);
			PositionRef.current = newPosition;
		};
		wsclient?.addMessageListener(`ballUpdate-${pongGameState.gameId}`, pongGameState.gameId, setNewCoords);

		return () => {
			wsclient?.removeMessageListener(`ballUpdate-${pongGameState.gameId}`, pongGameState.gameId);
		};
	}, []);

	/**
	 * Initiates the game by providing a random direction to the ball after the countdown 
	 * sets the score visibility to true.
	 */
	useEffect(() => {
		if (isScoreVisible)
			randomBallDir();
	}, [isScoreVisible]);

	useEffect(() => {
		const checkWinner = (player: string, playerScore: number) => {
			if (playerScore === 7) {
				let ball = temp.current;
				ball.x = 0;
				ball.z = 0;
				ball.velocityX = 0;
				ball.velocityZ = 0;
				ball.speed = 0.1;
				setPongGameState({ ...pongGameState, gameOver: true })
				setWinner(player);
				setBallVisibility(false);
			}
		}

		checkWinner('P1', scores.p1Score);
		checkWinner('P2', scores.p2Score);
	}, [scores.p1Score, scores.p2Score]);

	// Game/render loop for the ball.
	useFrame((_, deltaTime) => {
		const ball = temp.current;

		updateBallPosition(ball, deltaTime);

		const rightPaddlePos = rightPaddleRef.current.position;
		const leftPaddlePos = leftPaddleRef.current.position;

		const isCollidingWithPaddle = (paddle: { x: number; z: number; }) => {
			return (
				ball.x + halfBall >= paddle.x - halfPaddleWidth &&
				ball.x - halfBall <= paddle.x + halfPaddleWidth &&
				ball.z - halfBall <= paddle.z + halfPaddleHeight &&
				ball.z + halfBall >= paddle.z - halfPaddleHeight
			);
		}

		// Handling ball collision with top and bottom boarders.
		if (ball.z > 100 || ball.z < -100) {
			ball.velocityZ *= -1;
			updateBallPosition(ball, deltaTime);
		}
		// Handling ball collision with paddles.
		else if (isCollidingWithPaddle(leftPaddlePos)) {
			changeBallDir(leftPaddlePos, 1);
		}
		else if (isCollidingWithPaddle(rightPaddlePos)) {
			changeBallDir(rightPaddlePos, -1);
		}
		// Handling scoring when the ball is outside of the play area.
		else if ((ball.x > 200 || ball.x < -200) && 
			scores.p2Score !== 7 && scores.p1Score !== 7) {
			if (ball.x < -200)
				setScores({ ...scores, p2Score: scores.p2Score + 1 })
			else
				setScores({ ...scores, p1Score: scores.p1Score + 1 })
			randomBallDir();
		}
	});
}