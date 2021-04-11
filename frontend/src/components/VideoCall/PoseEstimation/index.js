import React, { useRef, useState } from 'react'; 
import { angle, checkCurlActive, checkCurlRest, checkSquatDown, checkSquatStanding, average, isSquatPosition, isCurlPosition, isStanding, isSitting } from './utils';

import ml5 from 'ml5';
import Sketch from 'react-p5';

const minPoseConfidence = 0.1;

const canvasWidth = window.innerHeight * 1.11;
const canvasHeight = window.innerHeight * 0.83;

const durationThreshold = 100;

const squatJoints = ["leftKnee", "leftHip", "rightHip", "rightKnee"];
const curlJoints = ["leftShoulder", "leftElbow", "rightShoulder", "rightElbow", "leftWrist", "rightWrist"];
// const jjJoints = ["leftShoulder", "leftElbow", "rightShoulder", "rightElbow"];

const PoseEstimation = () => {
    const videoRef = useRef(); 
    const [poses, setPoses] = useState([]);    

    const [squatsCount, setSquatsCount] = useState(0);
    const [curlsCount, setCurlsCount] = useState(0);

    // "up", "down"
    const [squatsState, setSquatsState] = useState("up");

    // "", "rest", "curl"
    const [curlsState, setCurlsState] = useState("");

    const [leftSquatAngle, setleftSquatAngle] = useState(0);
    const [rightSquatAngle, setrightSquatAngle] = useState(0);

    const [leftCurlAngle, setleftCurlAngle] = useState(0);
    const [rightCurlAngle, setrightCurlAngle] = useState(0);

    const [currentExercise, setCurrentExercise] = useState("resting");

    // used to change currentExercise back to "resting" if it's been a few seconds 
    const [currentExerciseDuration, setCurrentExerciseDuration] = useState(0);

    const squatDetection = (squatCoords) => {
        // look for squats
        if (Object.keys(squatCoords).length !== squatJoints.length) {
            return false;
        }

        // Squat state: standing --> squat = 1 squat
        const left = angle(squatCoords["leftKnee"].position, squatCoords["leftHip"].position, squatCoords["rightHip"].position);
        const right = angle(squatCoords["rightKnee"].position, squatCoords["rightHip"].position, squatCoords["leftHip"].position);

        setleftSquatAngle(left)
        setrightSquatAngle(right)
        
        if (squatsState === "down" && (checkSquatStanding(left) && checkSquatStanding(right))) {
            setSquatsState("up");
            setCurrentExercise("resting");
        } else if (squatsState === "up" && (checkSquatDown(left) && checkSquatDown(right))) {
            setSquatsState("down");
            setSquatsCount(squatsCount + 1);

            setCurrentExercise("squat");
            return true; 
        }

        return false;
    }

    // TODO: fix all the false positives
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
            return false;
        }

        // choose side with the higher confidence
        let leftConfidence = 0, rightConfidence = 0; 

        if (leftShoulderCoord && leftElbowCoord && leftWristCoord) {
            // verify they are in order
            leftConfidence = average([leftShoulderCoord.score, leftElbowCoord.score, leftWristCoord.score]);
        }
        if (rightShoulderCoord && rightElbowCoord && rightWristCoord) {
            rightConfidence = average([rightShoulderCoord.score, rightElbowCoord.score, rightWristCoord.score]);
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
            // TODO: make sure that coordinates are horizontally in order (shoulder --> elbow --> wrist) or vice versa during the resting position
            setCurlsState("rest");
        } else if (curlsState === "rest" && checkCurlActive(curlAngle)) {
            setCurlsState("curl");
            setCurlsCount(curlsCount + 1);

            setCurrentExercise("curl")
            return true; 
        }
        return false;
    }

    const setup = (p5, canvasParentRef) => {
		// use parent to render the canvas in this ref
		// (without that p5 will render the canvas outside of your component)
		p5.createCanvas(window.innerHeight * 1.11, window.innerHeight * 0.83).parent(canvasParentRef);

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
        p5.image(videoRef.current, 0, 0, canvasWidth, canvasHeight);

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
                    const positionX = (keypoint.position.x / 640) * canvasWidth;
                    const positionY = (keypoint.position.y / 480) *  canvasHeight;
                    p5.ellipse(positionX, positionY, 15, 15);

                    if (squatJoints.some((part) => part === keypoint.part)) {
                        squatCoords[keypoint.part] = keypoint;
                    }

                    if (curlJoints.some((part) => part === keypoint.part)) {
                        curlCoords[keypoint.part] = keypoint;
                    }
                    allKeypoints[keypoint.part] = keypoint;
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
                const positionXA = (partA.position.x / 640) * canvasWidth;
                const positionYA = (partA.position.y / 480) *  canvasHeight;
                const positionXB = (partB.position.x / 640) * canvasWidth;
                const positionYB = (partB.position.y / 480) *  canvasHeight;
                p5.strokeWeight(8);
                p5.stroke(255, 255, 255);
                p5.line( positionXA, positionYA, positionXB, positionYB);
            }
        }

        const standingStatus = isStanding(allKeypoints);

        // squats detection
        if (standingStatus || currentExercise === "squat") {
            const isSquat = squatDetection(squatCoords);
            if (isSquat) {
                setCurrentExerciseDuration(0);
                return;
            } else {
                setCurrentExerciseDuration(currentExerciseDuration + 1);
                if (currentExerciseDuration > durationThreshold) {
                    setCurrentExercise("resting");
                }
            }
        }

        // curl detection
        if (!standingStatus && currentExercise !== "squat") {
            const isCurl = curlsDetection(curlCoords);
            if (isCurl) {
                setCurrentExerciseDuration(0);
                return;
            } else {
                setCurrentExerciseDuration(currentExerciseDuration + 1)
                if (currentExerciseDuration > durationThreshold) {
                    setCurrentExercise("resting");
                }
            }
        }

	};

    return (
        <>
            {/* <h3>Current Exercise: {currentExercise}</h3> */}
            <Sketch setup={setup} draw={draw} />
            {/* <h3>Number of Squats: {squatsCount}</h3> */}
            {/* <h3>Squats State: {squatsState}</h3>
            <h3>Squats Left Angle: {leftSquatAngle}</h3>
            <h3>Squats Right Angle: {rightSquatAngle}</h3> */}
            {/* <h3>Number of Curls: {curlsCount}</h3> */}
            {/* <h3>Curls State: {curlsState}</h3> */}
            {/* <h3>Curls Left Angle: {leftCurlAngle}</h3>
            <h3>Curls Right Angle: {rightCurlAngle}</h3>  */}
        </>
    )
}

export default PoseEstimation; 