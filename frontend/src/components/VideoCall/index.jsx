import React from 'react';
import firebase from 'firebase/app';
import 'firebase/firestore';
import PoseEstimation from './PoseEstimation';
import { AreaChart, Area } from 'recharts';

import Biceps from '../../assets/biceps.svg';
import Legs from '../../assets/legs.svg';
import Shoulders from '../../assets/shoulders.svg';
import Profile from '../../assets/profile.svg';
import Microphone from '../../assets/microphone.svg';
import Video from '../../assets/video.svg';

import './style.scss';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSENGER_SENDER,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

const average = arr => arr.reduce((sume, el) => sume + el.uv, 0) / arr.length;

const exerciseCount = {};
let interval = null;
const VideoCall = (props) => {
  const [currentExercise, setCurrentExercise] = React.useState('Resting');
  const [remoteExercise, setRemoteExercise] = React.useState('Resting');
  const [calories, setCalories] = React.useState(0);
  const [time, setTime] = React.useState(0);
  const [chartData, setChartData] = React.useState([
    { uv: 50 },
    { uv: 50 },
    { uv: 50 },
    { uv: 50 },
    { uv: 50 },
  ]);

  const setCurrentExerciseTwo = (exercise) => {
    if (exercise !== 'Resting') {
      interval=setInterval(() => {
        setTime(time => time + 0.1);
      }, 100);
      if (exercise in exerciseCount) {
        exerciseCount[exercise] += 1
      } else {
        exerciseCount[exercise] = 0;
      }
      if (exercise === 'Jumping Jack') {
        setCalories(calories + 0.5);
      } else if (exercise === 'Squat') {
        setCalories(calories + 0.24);
      }
    } else if (interval) {
      clearInterval(interval);
    }
    setCurrentExercise(exercise);
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const firestore = firebase.firestore();

  const servers = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const pc = new RTCPeerConnection(servers);
  let localStream = null;
  let remoteStream = null;

  const webcamVideo = React.createRef();
  const remoteVideo = React.useRef();
  const [roomId, setRoomId] = React.useState('');

  React.useEffect(async () => {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
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

    if (remoteVideo.current) {
      remoteVideo.current.srcObject = remoteStream;
    }

    // Check if we should create or join a call
    firestore
      .collection('calls')
      .get()
      .then(async (querySnapshot) => {
        // If there is no ongoing call, go ahead and create a new call.
        if (querySnapshot.empty) {
          const callDoc = firestore.collection('calls').doc();
          const offerCandidates = callDoc.collection('offerCandidates');
          const answerCandidates = callDoc.collection('answerCandidates');

          props.socket.emit('joinRoom', callDoc.id);
          setRoomId((id) => callDoc.id);

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
            await pc.setRemoteDescription(
              new RTCSessionDescription(offerDescription)
            );

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
            setRoomId((id) => doc.id);
          });
        }
      });
      props.socket.on('newExercise', data => {
        console.log('detected new exercise')
        setRemoteExercise(exercise => data);
        console.log(data);
      })
      props.socket.on('confidenceScore', data => {
        console.log('found new score');
        console.log(data);
        const newChartData = [...chartData];
        newChartData.push({uv: data});
        setChartData(chart => newChartData);
      })
  }, []);

  const performacePoints = [
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

  const scores = [
    {message: 'NOT VISIBLE', value: 10},
    {message: 'NOT VISIBLE', value: 20},
    {message: 'Harder!', value: 31},
    {message: 'Work on it more!', value: 73},
    {message: 'You’re on fire!', value: 93},
  ];

  const generateScores = (chartDataScores) => {
    console.log(chartDataScores);
    const newChartData = chartDataScores.slice(chartDataScores.length - 3, chartDataScores.length);
    const newScores = [];
    let message = '';
    for (let i = 0; i < newChartData.length; i += 1) {
      if(newChartData[i].uv < 30) {
        message = "That's it?";
      } else if (newChartData[i].uv < 50) {
        message ='Harder!';
      } else if (newChartData[i].uv < 75) {
        message = "That's it!";
      } else {
        message = "You're on fire!";
      }
      newScores.push({
        message: message,
        value: Math.floor(newChartData[i].uv)
      })
    }
    return newScores;
  }
  
  return (
    <>
      <div className="videos">
        <div style={{ display: 'flex' }}>
          <div className="local-video">
            <div className="instructor-tag">
              <img src={Profile} alt="Profile" className="icon" />
              <div>
                <p className="title">Instructor</p>
                <p className="name">Sarah Lee</p>
              </div>
            </div>
            <div className="microphone-button">
              <img src={Microphone} alt="Microphone" className="icon" />
            </div>
            <div className="video-button">
              <img src={Video} alt="Video" className="icon" />
            </div>
            <video ref={remoteVideo} autoPlay playsInline />
            <div className={`local-exercise ${remoteExercise === "Resting" ? ' resting' : ' active'}`}>
              <p>Current Exercise</p>
              <p className="current-exercise">{remoteExercise}</p>
            </div>
          </div>
          <div className="remote-video">
            <div className="scores">
              {generateScores(chartData.slice(5, chartData.length)).map((score) => (
                <div className="score">
                  <div className="col"> 
                    <p className="value">{score.value}</p>
                    <p className="word">Score</p>
                  </div>
                  <p className="message">{score.message}</p>
                </div>
              ))}
            </div>
            <div className="microphone-button">
              <img src={Microphone} alt="Microphone" className="icon" />
            </div>
            <div className="video-button">
              <img src={Video} alt="Video" className="icon" />
            </div>

            <div className={`local-exercise ${currentExercise === "Resting" ? ' resting' : ' active'}`}>
              <p>Current Exercise</p>
              <p className="current-exercise">{currentExercise}</p>
            </div>
            <PoseEstimation socket={props.socket} roomId={roomId} setCurrentExercise={setCurrentExerciseTwo}/>
          </div>
        </div>
        <div className="stats-container">
          <div className="title">Live Statistics</div>
          <div className="statistics">
            <div className="performance">
              <p className="title">Avg Performance</p>
              <p className="description">Based off similarity</p>
              <p className="score">{
                average(chartData.slice(5, chartData.length)) || 0
              }</p>
              <AreaChart
                width={450}
                height={125}
                data={chartData.slice(chartData.length - 5, chartData.length)}
                margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
              >
                <Area
                  type="monotone"
                  dataKey="uv"
                  stroke="#FFA768"
                  fill="#FFA768"
                  dot
                />
              </AreaChart>
            </div>
            <div className="workout">
              <p className="title">Workout Count</p>
              <div className="split">
                <p className="col-name">Type</p>
                <p className="col-name">Reps</p>
              </div>
              {
                Object.keys(exerciseCount).map(function(key) {
                  return (
                    <>
                    <div className="split">
                      <p className="data-name">{key}</p>
                      <p className="data-value">{exerciseCount[key]}x</p>
                    </div>
                    <div className="divider" /> 
                    </>
                  )
                })
              }
            </div>
            <div className="row">
              <div className="active">
                <p className="title">Active Time</p>
                <p className="description">This Session</p>
                <p className="time">{Math.floor(time)}s</p>
              </div>
              <div className="calories">
                <p className="title">Calories Burned</p>
                <p className="description">This Session</p>
                <p className="count">{Math.floor(calories)} cal</p>
              </div>
            </div>
            <div className="areas">
              <p className="title">Personal Records</p>
              <div className="items">
                <div className="item">
                  <img src={Biceps} alt="Biceps" />
                  <div>
                    <p className="rank">93</p>
                    <p className="name">Biceps</p>
                  </div>
                </div>
                <div className="item">
                  <img src={Legs} alt="Legs" />
                  <div>
                    <p className="rank">81</p>
                    <p className="name">Legs</p>
                  </div>
                </div>
                <div className="item">
                  <img src={Shoulders} alt="Shoulders" />
                  <div>
                    <p className="rank">72</p>
                    <p className="name">Shoulders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoCall;
