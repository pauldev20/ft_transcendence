import { PerspectiveCamera } from "@react-three/drei"
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

/**
 * Ceates a perspective camera for a 3D scene and updates its position and orientation based on a key map.
 * @param props -
 * @returns The PerspectiveCamera component from the Three.js library.
 */
const Camera = (props) => {
	const ref = useRef();
	const keyMap = props.keyMap;

	// On reset changes back the original position.
	useEffect(() => {
		if (props.reset) {
			ref.current.position.set(...[33, 25, 39]);
			ref.current.lookAt(...props.target);
		}
	}, [props.reset]);

	// Pressing on the Digit1 key, resets the camera back to its original spot.
	useFrame(() => {
		if (keyMap['Digit1']) {
			ref.current.position.set(...[33, 25, 39]);
			ref.current.lookAt(...props.target);
		}
	});

	return (
		<PerspectiveCamera
			makeDefault
			ref={ref}
			fov={60}
			aspect={props.dimensions.innerWidth / props.dimensions.innerHeight}
			near={0.1}
			far={1000}
			position={[33, 25, 39]}
		/>
	);
}

export default Camera;