import React, { useRef, useState } from 'react'; 
import { angle, checkCurlActive, checkCurlRest, checkSquatDown, checkSquatStanding, average, findExercise, isSquatPosition } from './utils';

import ml5 from 'ml5';
import Sketch from 'react-p5';

const minPoseConfidence = 0.2

const squatJoints = ["leftKnee", "leftHip", "rightHip", "rightKnee"];
const curlJoints = ["leftShoulder", "leftElbow", "rightShoulder", "rightElbow", "leftWrist", "rightWrist"];

const PoseEstimation = () => {
    const videoRef = useRef(); 
    const [poses, setPoses] = useState([]);    

    const [squatsCount, setSquatsCount] = useState(0);
    const [curlsCount, setCurlsCount] = useState(0);

    // "", "up", "down"
    const [squatsState, setSquatsState] = useState("up");

    // "", "rest", "curl"
    const [curlsState, setCurlsState] = useState("");


    const [leftSquatAngle, setleftSquatAngle] = useState(0);
    const [rightSquatAngle, setrightSquatAngle] = useState(0);

    const [leftCurlAngle, setleftCurlAngle] = useState(0);
    const [rightCurlAngle, setrightCurlAngle] = useState(0);

    const [currentExercise, setCurrentExercise] = useState();

    const squatDetection = (squatCoords) => {
        // look for squats
        if (Object.keys(squatCoords).length !== squatJoints.length) {
            // if (squatsState === "up") {
            //     setSquatsState("");
            // }
            return;
        }

        // Squat state: standing --> squat = 1 squat
        const left = angle(squatCoords["leftKnee"].position, squatCoords["leftHip"].position, squatCoords["rightHip"].position);
        const right = angle(squatCoords["rightKnee"].position, squatCoords["rightHip"].position, squatCoords["leftHip"].position);

        setleftSquatAngle(left)
        setrightSquatAngle(right)
        
        if (squatsState === "down" && (checkSquatStanding(left) && checkSquatStanding(right))) {
            setSquatsState("up");
        } else if (squatsState === "up" && (checkSquatDown(left) && checkSquatDown(right))) {
            setSquatsState("down");
            setSquatsCount(squatsCount + 1);
        } else {
            return true;
        }

        return false;
    }

    const curlsDetection = (curlCoords) => {
        // User will be sideways when doing curls. We should expect to see at least one side.
        const leftShoulderCoord = curlCoords["leftShoulder"],
              leftElbowCoord = curlCoords["leftElbow"],
              rightShoulderCoord = curlCoords["rightShoulder"],
              rightElbowCoord = curlCoords["rightElbow"],
              leftWristCoord = curlCoords["leftWrist"],
              rightWristCoord = curlCoords["rightWrist"];

        if (!((leftShoulderCoord && leftElbowCoord && leftWristCoord) || (rightShoulderCoord && rightElbowCoord && rightWristCoord))) {
            // only reset if currently on resting position 
            setCurlsState("");
            return;
        }

        // choose side with the higher confidence
        let leftConfidence = 0, rightConfidence = 0; 

        if (leftShoulderCoord && leftElbowCoord && leftWristCoord) {
            // verify they are in order
            leftConfidence = average([leftShoulderCoord.score, leftElbowCoord.score], leftWristCoord.score);
        }
        if (rightShoulderCoord && rightElbowCoord && rightWristCoord) {
            rightConfidence = average([rightShoulderCoord.score, rightElbowCoord.score], rightWristCoord.score);
        }

        const leftSideStatus = leftConfidence > rightConfidence;
        const curlAngle = leftSideStatus ? 
            angle(leftShoulderCoord.position, leftElbowCoord.position, leftWristCoord.position) :
            angle(rightShoulderCoord.position, rightElbowCoord.position, rightWristCoord.position)

        if (leftSideStatus) {
            setleftCurlAngle(curlAngle);
        } else {
            setrightCurlAngle(curlAngle);
        }
        
        if ((curlsState === "" || curlsState === "curl") && checkCurlRest(curlAngle)) {
            setCurlsState("rest");
        } else if (curlsState === "rest" && checkCurlActive(curlAngle)) {
            setCurlsState("curl");
            setCurlsCount(curlsCount + 1);
        }
    }

    const setup = (p5, canvasParentRef) => {
		// use parent to render the canvas in this ref
		// (without that p5 will render the canvas outside of your component)
		p5.createCanvas(640, 480).parent(canvasParentRef);

        const capture = p5.createCapture({
            video: true,
            audio: false
        });
        capture.hide();

        videoRef.current = capture;  

        const poseNet = ml5.poseNet(videoRef.current, () => {
            console.log("posenet loaded");
        });

        poseNet.on("pose", (results) => {
            setPoses(results);
        });
	};

	const draw = (p5) => {
        p5.image(videoRef.current, 0, 0, 640, 480)

        const squatCoords = {};
        const curlCoords = {};

        const allKeypoints = {};

        // draws keypoints
        for (let i = 0; i < poses.length; i++) {
            const pose = poses[i].pose; 

            for (let j = 0; j < pose.keypoints.length; j += 1) {
                // A keypoint is an object describing a body part (like rightArm or leftShoulder)
                const keypoint = pose.keypoints[j];
                // Only draw an ellipse is the pose probability is bigger than 0.2
                if (keypoint.score > minPoseConfidence) {
                    p5.fill(255, 255, 255);
                    p5.noStroke();
                    p5.ellipse(keypoint.position.x, keypoint.position.y, 10, 10);

                    if (squatJoints.some((part) => part === keypoint.part)) {
                        squatCoords[keypoint.part] = keypoint;
                    }

                    if (curlJoints.some((part) => part === keypoint.part)) {
                        curlCoords[keypoint.part] = keypoint;
                    }

                    allKeypoints[keypoint.part] = keypoint.position;
                }
            }
        }

        // draws skeleton
        for (let i = 0; i < poses.length; i += 1) {
            const skeleton = poses[i].skeleton;
            // For every skeleton, loop through all body connections
            for (let j = 0; j < skeleton.length; j += 1) {
                const partA = skeleton[j][0];
                const partB = skeleton[j][1];
                p5.stroke(255, 255, 255);
                p5.line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
            }
        }

        squatDetection(squatCoords);
        curlsDetection(curlCoords);

        // if (!currentExercise) {
        //     // finds starting position
        //     const exercise = findExercise(allKeypoints);
        //     setCurrentExercise(exercise);
        // }

        // if (currentExercise === "squat") {
        //     const fetchNewExercise = squatDetection(squatCoords);

        //     if (fetchNewExercise && squatsState === "up") {
        //         const exercise = findExercise(allKeypoints);
        //         console.log(exercise);
        //     }
        // }      

        // curlsDetection(curlCoords);
	};

    return (
        <div>
            <h3>Current Exercise: {currentExercise}</h3>
            <Sketch setup={setup} draw={draw} />;
            <h3>Number of Squats: {squatsCount}</h3>
            <h3>Squats State: {squatsState}</h3>
            <h3>Squats Left Angle: {leftSquatAngle}</h3>
            <h3>Squats Right Angle: {rightSquatAngle}</h3>
            <br></br>
            <h3>Number of Curls: {curlsCount}</h3>
            <h3>Curls State: {curlsState}</h3>
            <h3>Curls Left Angle: {leftCurlAngle}</h3>
            <h3>Curls Right Angle: {rightCurlAngle}</h3>
        </div>
    )
}

export default PoseEstimation; 