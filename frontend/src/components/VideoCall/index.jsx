import React from 'react';
import firebase from 'firebase/app';
import 'firebase/firestore';
import PoseEstimation from './PoseEstimation';

import './style.scss';

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

  const webcamVideo = React.createRef();
  const remoteVideo = React.createRef();

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

  return (
    <>
      <div className="videos">
        <span>
          <h3>Local Stream</h3>
          <PoseEstimation />
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video ref={remoteVideo} autoPlay playsInline />
        </span>
      </div>
    </>
  );
};

export default VideoCall;