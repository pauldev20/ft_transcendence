import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { extend, useFrame } from '@react-three/fiber';
import { memo, useEffect, useRef, useState } from 'react';
import { MeshStandardMaterial } from 'three';

import Orbitron_Regular from '@/public/fonts/Orbitron_Regular.json';
import { usePongGameState } from '@/app/pong/hooks/usePongGameState';
import { useSound } from '../hooks/Sound';
import { lerp } from '../TTT/Countdown';
import { usePongSocket } from '@/app/pong/hooks/usePongSocket';

extend({ TextGeometry })

/**
 * The Countdown component is a timer that counts down from 4 to 0 and displays the count as a 3D text
 * in a React Three Fiber scene.
 * @param props - The `props` parameter is an object that contains the following properties:
 * 				  `setScoreVisible`, `scoreVisible` and `rotation`.
 * @returns A mesh element that displays the current count value.
 * The visibility of the mesh is determined by the props.scoreVisible value. If props.scoreVisible is
 * false, the mesh will be visible, otherwise it will be hidden.
 */
const Countdown = memo(() => {
	const font = new FontLoader().parse(Orbitron_Regular);
	const [count, setCount] = useState(4);
	const {
		pongGameState,
		isScoreVisible,
		setScoreVisibility,
		countdownPos,
		countdownRot,
		setStarted,
		started
	} = usePongGameState();
	const { playerState } = usePongSocket();
	const soundEngine = useSound();
	const meshMatRef = useRef<MeshStandardMaterial>(null);
	const [countdownVisible, setCountdownVisible] = useState(false);

	useEffect(() => {
		if (pongGameState.pause) {
			if (pongGameState.gameId !== '-1') {
				setScoreVisibility(false);
				if (!started) {
					setCountdownVisible(false);
				}
			} else {
				if (meshMatRef.current) {
					console.log("set")
					meshMatRef.current.opacity = 0;
				}
				setScoreVisibility(false);
			}
			return ;
		}

		if (!isScoreVisible) {
			setCountdownVisible(true);
			const countdownInterval = setInterval(() => {
				
				setCount((prevCount) => {
					if (prevCount > 0) {
						soundEngine?.playSound("pongCountdown");
						return (prevCount - 1);
					} else {
						clearInterval(countdownInterval);
						setScoreVisibility(true);
						setStarted(true);
						setCount(4);
						return (0);
					}
				});
			}, 1000);

			return () => {
				clearInterval(countdownInterval);
			};
		}
	}, [isScoreVisible, pongGameState.pause, started, pongGameState.gameId,setScoreVisibility, setStarted, soundEngine]);

	useFrame(() => {
		if (meshMatRef.current && playerState.client !== -1) {
			meshMatRef.current.opacity = lerp(meshMatRef.current.opacity, !isScoreVisible ? 1 : 0, 0.05);
		}
	});

	return (
		<mesh visible={!isScoreVisible && pongGameState.gameId !== "-1"} position={ count === 1 ? countdownPos[0] : countdownPos[1]} rotation={countdownRot}>
			<textGeometry args={[String(count), {font, size: 60, height: 6}]} />
			<meshBasicMaterial color={ 0xffffff } />
		</mesh>
	);
})

Countdown.displayName = "Countdown"

export default Countdown;