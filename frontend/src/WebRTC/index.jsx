import React from 'react';
import firebase from 'firebase/app';
import 'firebase/firestore';

import './style.css';

const WebRTC = () => {
  const firebaseConfig = {
    apiKey: 'AIzaSyC45YxeRxDUzTS0sXBc95CNhLIU_2YVQAg',
    authDomain: 'moveit-3ba0e.firebaseapp.com',
    projectId: 'moveit-3ba0e',
    storageBucket: 'moveit-3ba0e.appspot.com',
    messagingSenderId: '721613026537',
    appId: '1:721613026537:web:465bf7d6fbf2373f512c78',
    measurementId: 'G-Z8W8BFE0PD',
  };

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

  const webcamButton = React.createRef();
  const webcamVideo = React.createRef();
  const callButton = React.createRef();
  const callInput = React.createRef();
  const answerButton = React.createRef();
  const remoteVideo = React.createRef();
  const hangupButton = React.createRef();

  return (
    <>
      <h2>1. Start your Webcam</h2>
      <div className="videos">
        <span>
          <h3>Local Stream</h3>
          <video ref={webcamVideo} autoPlay playsInline muted="muted" />
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video ref={remoteVideo} autoPlay playsInline />
        </span>
      </div>

      <button
        ref={webcamButton}
        type="button"
        onClick={async () => {
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

          webcamVideo.current.srcObject = localStream;
          remoteVideo.current.srcObject = remoteStream;

          console.log(callButton.current);

          callButton.current.disabled = false;
          answerButton.current.disabled = false;
          webcamButton.current.disabled = true;
        }}
      >
        Start webcam
      </button>
      <h2>2. Create a new Call</h2>
      <button
        ref={callButton}
        type="button"
        // disabled
        onClick={async () => {
          console.log('Hi');
          // Reference Firestore collections for signaling
          const callDoc = firestore.collection('calls').doc();
          const offerCandidates = callDoc.collection('offerCandidates');
          const answerCandidates = callDoc.collection('answerCandidates');

          console.log(callDoc);

          callInput.current.value = callDoc.id;

          // Get candidates for caller, save to db
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              offerCandidates.add(event.candidate.toJSON());
            }
          };

          // Create offer
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);

          const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
          };

          await callDoc.set({ offer });

          // Listen for remote answer
          callDoc.onSnapshot((snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data && data.answer) {
              const answerDescription = new RTCSessionDescription(data.answer);
              pc.setRemoteDescription(answerDescription);
            }
          });

          // When answered, add candidate to peer connection
          answerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
              }
            });
          });

          hangupButton.current.disabled = false;
        }}
      >
        Create Call (offer)
      </button>

      <h2>3. Join a Call</h2>
      <p>Answer the call from a different browser window or device</p>

      <input ref={callInput} />
      <button
        ref={answerButton}
        type="button"
        // disabled
        onClick={async () => {
          const callId = callInput.current.value;
          const callDoc = firestore.collection('calls').doc(callId);
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
        }}
      >
        Answer
      </button>

      <h2>4. Hangup</h2>

      <button
        ref={hangupButton}
        type="button"
        // disabled
      >
        Hangup
      </button>
    </>
  );
};

export default WebRTC;
