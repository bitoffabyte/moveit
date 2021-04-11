import React from 'react';
import firebase from 'firebase/app';
import 'firebase/firestore';
import ml5 from 'ml5';
import Sketch from 'react-p5';
import { angle, checkSquatDown, checkSquatStanding } from './utils';

import './style.scss';

const minPoseConfidence = 0.2;

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSENGER_SENDER,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

const VideoCall = () => {

  const [poses, setPoses] = React.useState([]);  
  const [leftThighAngle, setLeftThighAngle] = React.useState(0);
  const [rightThighAngle, setRightThighAngle] = React.useState(0);

  const [squatsCount, setSquatsCount] = React.useState(0);

  // "", "up", "down"
  const [squatsState, setSquatsState] = React.useState("");

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const firestore = firebase.firestore();

  const servers = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const pc = new RTCPeerConnection(servers);
  let localStream = null;
  let remoteStream = null;

  const remoteVideo = React.useRef();
  const webcamVideo = React.useRef(); 

  /** WEB RTC **/
  React.useEffect(async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    remoteStream = new MediaStream();

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    remoteVideo.current.srcObject = remoteStream;

    // Check if we should create or join a call
    firestore.collection('calls').get().then(async (querySnapshot) => {
      // If there is no ongoing call, go ahead and create a new call.
      if (querySnapshot.empty) {
        const callDoc = firestore.collection('calls').doc();
        const offerCandidates = callDoc.collection('offerCandidates');
        const answerCandidates = callDoc.collection('answerCandidates');
    
        console.log(callDoc.id);
    
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            offerCandidates.add(event.candidate.toJSON());
          }
        };
    
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
    
        const offer = {
          sdp: offerDescription.sdp,
          type: offerDescription.type,
        };
    
        await callDoc.set({ offer });
    
        callDoc.onSnapshot((snapshot) => {
          const data = snapshot.data();
          if (!pc.currentRemoteDescription && data && data.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDescription);
          }
        });
    
        answerCandidates.onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const candidate = new RTCIceCandidate(change.doc.data());
              pc.addIceCandidate(candidate);
            }
          });
        });
      }
      // If there is an ongoing call, go ahead and create a new call.
      else {
        querySnapshot.forEach(async (doc) => {
          const callDoc = firestore.collection('calls').doc(doc.id);
          const answerCandidates = callDoc.collection('answerCandidates');
          const offerCandidates = callDoc.collection('offerCandidates');

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              answerCandidates.add(event.candidate.toJSON());
            }
          };

          const callData = (await callDoc.get()).data();

          const offerDescription = callData.offer;
          await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

          const answerDescription = await pc.createAnswer();
          await pc.setLocalDescription(answerDescription);

          const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
          };

          await callDoc.update({ answer });

          offerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const data = change.doc.data();
                pc.addIceCandidate(new RTCIceCandidate(data));
              }
            });
          });
          callDoc.delete();
        });
      }
    });
  }, []);

  /** POSE DETECTION **/

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

  const setupLocal = (p5, canvasParentRef) => {
		// use parent to render the canvas in this ref
		// (without that p5 will render the canvas outside of your component)
		p5.createCanvas(640, 480).parent(canvasParentRef);

    const capture = p5.createCapture({
        video: true,
        audio: false
    });
    capture.hide();

    webcamVideo.current = capture;  

    const poseNet = ml5.poseNet(webcamVideo.current, () => {
      console.log("posenet loaded");
    });

    poseNet.on("pose", (results) => {
      setPoses(results);

      // squatDetection(results);
    });
	};

	const drawLocal = (p5) => {
    p5.image(webcamVideo.current, 0, 0, 640, 480)

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
          p5.ellipse(keypoint.position.x, keypoint.position.y, 15, 15);

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
            p5.strokeWeight(5);
            p5.stroke(255, 255, 255);
            p5.line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }

    squatDetection(squatCoords);
  };

  return (
    <>
      <div className="videos">
        <span>
          <h3>Local Stream</h3>
          <Sketch setup={setupLocal} draw={drawLocal} />
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video ref={remoteVideo} autoPlay playsInline />
        </span>
        <div className="info">
        <p>Left Thigh Angle: {leftThighAngle}</p>
            <p>Right Thigh Angle: {rightThighAngle}</p>
            <p>Number of Squats: {squatsCount}</p>
            <p>Squats State: {squatsState}</p>
        </div>
      </div>
    </>
  );
};

export default VideoCall;
