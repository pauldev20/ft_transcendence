import { useRef, useState } from "react";
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Ball = ({ rightPaddleRef, leftPaddleRef }) => {
	let ref = useRef();

	let ball = { x: 0, y: 0, velocityX: 1, velocityY: 1, speed: 1 };
	const halfPaddleWidth = 4 / 2;
	const HalfPaddleHeight = 30 / 2;
	const halfBall = 2;

	const updateBall = (paddlePos, direction) => {
		const deltaY = ball.y - paddlePos.y;
		const normalizedY = deltaY / HalfPaddleHeight;

		ball.speed += 0.2;
		ball.velocityX = direction * ball.speed;
		ball.velocityY = normalizedY * ball.speed;
	}

	useFrame(() => {
		ball.x += ball.velocityX;
		ball.y += ball.velocityY;
		ref.current.position.x = ball.x;
		ref.current.position.y = ball.y;

		const rightPaddlePos = rightPaddleRef.current.position;
		const leftPaddlePos = leftPaddleRef.current.position;

		const isCollidingWithPaddle = (paddle: { x: number; y: number; }) => {
			return (
				ball.x + halfBall > paddle.x - halfPaddleWidth &&
				ball.x - halfBall < paddle.x + halfPaddleWidth &&
				ball.y - halfBall < paddle.y + HalfPaddleHeight &&
				ball.y + halfBall > paddle.y - HalfPaddleHeight
			);
		}

		if (ball.y > 100 || ball.y < -100) {
			ball.velocityY *= -1;
		}
		else if (isCollidingWithPaddle(leftPaddlePos)) {
			updateBall(leftPaddlePos, 1);
		}
		else if (isCollidingWithPaddle(rightPaddlePos)) {
			updateBall(rightPaddlePos, -1);
		}

	});

	return (
		<mesh ref={ref}>
			<boxGeometry args={[4, 4, 4]} />
			<meshBasicMaterial
				color={0xffffff}
				transparent={false}
				blending={THREE.AdditiveBlending}
				side={THREE.BackSide}
			/>
		</mesh>
	);
}

export default Ball;