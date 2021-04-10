import React, { useEffect, useRef, useState } from 'react'; 

import ml5 from 'ml5';
import Sketch from 'react-p5';

const minPoseConfidence = 0.1;


const PoseEstimation = () => {


    const videoRef = useRef(); 

    const [poses, setPoses] = useState([]);
    const [capture, setCapture] = useState();
    
    useEffect(() => {
        const poseNet = ml5.poseNet(videoRef.current, () => {
            console.log("posenet loaded");
        });

        poseNet.on("pose", (results) => {
            setPoses(results);
        });
    }, []);

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
        console.log("fck");
	};

	const draw = (p5) => {
        if (videoRef.current) {
            p5.image(videoRef.current, 0, 0, 640, 480)
    
            // draws keypoints
            for (let i = 0; i < poses.length; i++) {
                const pose = poses[i].pose; 
    
                for (let j = 0; j < pose.keypoints.length; j += 1) {
                    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
                    const keypoint = pose.keypoints[j];
                    // Only draw an ellipse is the pose probability is bigger than 0.2
                    if (keypoint.score > 0.2) {
                      p5.fill(255, 0, 0);
                      p5.noStroke();
                      p5.ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
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
                  p5.stroke(255, 0, 0);
                  p5.line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
                }
              }
        }
	};

    return (
        <div>
            <Sketch setup={setup} draw={draw} />;
        </div>
    )
}

export default PoseEstimation; 