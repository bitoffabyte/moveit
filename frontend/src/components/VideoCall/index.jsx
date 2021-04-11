import React from 'react';
import firebase from 'firebase/app';
import 'firebase/firestore';
import PoseEstimation from './PoseEstimation';
import { AreaChart, Area } from "recharts";

import Biceps from '../../assets/biceps.svg';
import Legs from '../../assets/legs.svg';
import Shoulders from '../../assets/shoulders.svg';

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

const VideoCall = (props) => {
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
  const [roomId, setRoomId] = React.useState('');

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
    
        props.socket.emit('joinRoom', callDoc.id);
        setRoomId(id => callDoc.id);
    
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
          props.startTimer();
          callDoc.delete();

          props.socket.emit('joinRoom', doc.id);
          setRoomId(id => doc.id);
        });
      }
    });
  }, []);

  const data = [
    { uv: 29.28 },
    { uv: 45.62 },
    { uv: 38.36 },
    { uv: 32.13 },
    { uv: 42.77 },
    { uv: 32.39 },
    { uv: 37.06 },
    { uv: 46.14 },
    { uv: 42.51 },
    { uv: 56.25 },
    { uv: 37.58 },
    { uv: 50.29 },
    { uv: 45.1 },
    { uv: 58.07 },
    { uv: 53.66 },
    { uv: 64.29 },
  ];

  return (
    <>
      <div className="videos">
        <span>
          <video ref={remoteVideo} autoPlay playsInline />
        </span>
        <span>
          <PoseEstimation socket={props.socket} roomId={roomId}/>
        </span>
        <span>
        <div className="title">Live Statistics</div>
        <div className="statistics">
          <div className="performance">
            <p className="title">Avg Performance</p>
            <p className="description">Based off similarity</p>
            <p className="score">76</p>
            <AreaChart width={239} height={100} data={data} margin={{top: 0, left: 0, right: 0, bottom: 0}} >
              <Area type="monotone" dataKey="uv" stroke="#FFA768" fill="#FFA768" dot />
            </AreaChart>
          </div>
          <div className="workout">
            <p className="title">Workout Count</p>
            <div className="split">
              <p className="col-name">Type</p>
              <p className="col-name">Reps</p>
            </div>
            <div className="split">
              <p className="data-name">Arm Stretch</p>
              <p className="data-value">15x</p>
            </div>
            <div className="divider" />
            <div className="split">
              <p className="data-name">Bicep Curls</p>
              <p className="data-value">12x</p>
            </div>
            <div className="divider" />
            <div className="split">
              <p className="data-name">Jumping Jacks</p>
              <p className="data-value">32x</p>
            </div>
            <div className="divider" />
            <div className="split">
              <p className="data-name">Pushups</p>
              <p className="data-value">50x</p>
            </div>
          </div>
          <div className="row">
            <div className="active">
              <p className="title">Active Time</p>
              <p className="description">This Session</p>
              <p className="time">42m</p>
            </div>
            <div className="calories">
              <p className="title">Calories Burned</p>
              <p className="description">This Session</p>
              <p className="count">312cal</p>
            </div>
          </div>
          <div className="areas">
            <p className="title">Top Set Scores</p>
            <div className="items">
              <div className="item">
                <img src={Biceps} alt="Biceps" />
                <div>
                  <p className="rank">#1</p>
                  <p className="name">Biceps</p>
                </div>
              </div>
              <div className="item">
                <img src={Legs} alt="Legs" />
                <div>
                  <p className="rank">#2</p>
                  <p className="name">Legs</p>
                </div>
              </div>
              <div className="item">
                <img src={Shoulders} alt="Shoulders" />
                <div>
                  <p className="rank">#3</p>
                  <p className="name">Shoulders</p>
                </div>
              </div>
            </div>
            </div>
        </div>
        </span>
      </div>
    </>
  );
};

export default VideoCall;