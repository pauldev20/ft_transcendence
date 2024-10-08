import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { Object3DNode, Vector3, extend } from '@react-three/fiber';
import { MutableRefObject } from 'react';
import { Mesh, MeshBasicMaterial } from 'three';

import Orbitron_Regular from '@/public/fonts/Orbitron_Regular.json'
import { usePongGameState } from '@/app/[lang]/pong/hooks/usePongGameState';

extend({ TextGeometry })

type ScoreType = {
	[key: number]: { position: Array<number> };
}

/* The `declare module` statement is used to extend the existing module declaration in TypeScript.
Used for extending the `@react-three/fiber` module and adding to the ThreeElements interface the definition
for textGeometry, because the property 'textGeometry' does not exist on type 'JSX.IntrinsicElements'*/
declare module "@react-three/fiber" {
	interface ThreeElements {
	  textGeometry: Object3DNode<TextGeometry, typeof TextGeometry>;
	}
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

/**
 * The Scoreboard component displays the scores of two players on a 3D scoreboard.
 * @param player1 - The score of player 1.
 * @param player2 - The score of player 2.
 * @param scoreVisible - A state that determines if the scores should be visible.
 * @returns A JSX fragment containing two mesh elements. Each
 * mesh element represents a player's score.
 */
export const Scoreboard = () => {
	//* ------------------------------- hooks ------------------------------ */
	const { scores, isScoreVisible, rightPaddleRef, leftPaddleRef } = usePongGameState();

	const font = new FontLoader().parse(Orbitron_Regular);

	// Reposition textGeometry based on score.
	const Score1 : ScoreType = {
		0:	{ position: [-70.8, -7, -40] },
		1:	{ position: [-62.8, -7, -40] },
		2:	{ position: [  -71, -7, -40] },
		3:	{ position: [  -71, -7, -40] },
		4:	{ position: [  -70, -7, -40] },
		5:	{ position: [  -70, -7, -40] },
		6:	{ position: [  -70, -7, -40] },
		7:	{ position: [  -63, -7, -40] },
	}
	const Score2 : ScoreType = {
		0:	{ position: [ 30, -7, -40] },
		1:	{ position: [ 38, -7, -40] },
		2:	{ position: [ 30, -7, -40] },
		3:	{ position: [ 30, -7, -40] },
		4:	{ position: [ 33, -7, -40] },
		5:	{ position: [ 33, -7, -40] },
		6:	{ position: [ 33, -7, -40] },
		7:	{ position: [ 38, -7, -40] },
	}

	const pos1 = Score1[scores.p1Score]?.position;
	const pos2 = Score2[scores.p2Score]?.position;

	//* ------------------------------- functions ------------------------------ */
	const getColor = ( ref:  MutableRefObject<Mesh>) => {
		if (ref && ref.current) {
			const material = ref.current.material as MeshBasicMaterial;
			const currentColor = material.color.getHex();
			return (currentColor);
		} else {
			return ( 0xffffff );
		}
	}

	return (
		<>
			<mesh visible={isScoreVisible} position={pos1 as Vector3} rotation={[-Math.PI / 2, 0, 0]} >
				<textGeometry args={[String(scores.p1Score), {font, size: 35, height: 3}]} />
				<meshBasicMaterial color={ getColor(leftPaddleRef) } />
			</mesh>
			<mesh visible={isScoreVisible} position={pos2 as Vector3} rotation={[-Math.PI / 2, 0, 0]}>
				<textGeometry args={[String(scores.p2Score), {font, size: 35, height: 3}]} />
				<meshBasicMaterial color={ getColor(rightPaddleRef) } />
			</mesh>
		</>
	);
}