import React, { useRef, useState } from 'react'; 
import { angle, checkSquatDown, checkSquatStanding } from './utils';

import ml5 from 'ml5';
import Sketch from 'react-p5';

const minPoseConfidence = 0.2;

const PoseEstimation = () => {
    const videoRef = useRef(); 
    const [poses, setPoses] = useState([]);    

    const [leftThighAngle, setLeftThighAngle] = useState(0);
    const [rightThighAngle, setRightThighAngle] = useState(0);

    const [squatsCount, setSquatsCount] = useState(0);

    // "", "up", "down"
    const [squatsState, setSquatsState] = useState("");

    const squatDetection = (squatCoords) => {
        // look for squats (leftKnee --> leftHip, rightKnee --> rightHip, leftHip --> rightHip)
        if (Object.keys(squatCoords).length !== 4) {
            return
        }

        // Squat state: standing --> squat = 1 squat
        const leftAngle = angle(squatCoords["leftKnee"], squatCoords["leftHip"], squatCoords["rightHip"]);
        const rightAngle = angle(squatCoords["rightKnee"], squatCoords["rightHip"], squatCoords["leftHip"]);

        setLeftThighAngle(leftAngle);
        setRightThighAngle(rightAngle);

        if ((squatsState === "" || squatsState === "down") && checkSquatStanding(leftAngle) && checkSquatStanding(rightAngle)) {
            setSquatsState("up");
        } else if (squatsState === "up" && checkSquatDown(leftAngle) && checkSquatDown(rightAngle)) {
            setSquatsState("down");
            setSquatsCount(squatsCount + 1);
        }
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

            // squatDetection(results);
        });
	};

	const draw = (p5) => {
        p5.image(videoRef.current, 0, 0, window.innerHeight * 1.11, window.innerHeight * 0.83);

        const squatCoords = {} 

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
                    const positionX = (keypoint.position.x / 640) * window.innerHeight * 1.11;
                    const positionY = (keypoint.position.y / 480) *  window.innerHeight * 0.83;
                    p5.ellipse(positionX, positionY, 15, 15);

                    if (keypoint.part === "leftKnee" || keypoint.part === "leftHip" || keypoint.part === "rightKnee" || keypoint.part === "rightHip") {
                        squatCoords[keypoint.part] = keypoint.position;
                    }
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
                const positionXA = (partA.position.x / 640) * window.innerHeight * 1.11;
                const positionYA = (partA.position.y / 480) *  window.innerHeight * 0.83;
                const positionXB = (partB.position.x / 640) * window.innerHeight * 1.11;
                const positionYB = (partB.position.y / 480) *  window.innerHeight * 0.83;
                p5.strokeWeight(8);
                p5.stroke(255, 255, 255);
                p5.line( positionXA, positionYA, positionXB, positionYB);
            }
        }

        squatDetection(squatCoords);
	};

    return (
        <div>
            <Sketch setup={setup} draw={draw} />;
            <p>Left Thigh Angle: {leftThighAngle}</p>
            <p>Right Thigh Angle: {rightThighAngle}</p>
            <p>Number of Squats: {squatsCount}</p>
            <p>Squats State: {squatsState}</p>
        </div>
    )
}

export default PoseEstimation; 