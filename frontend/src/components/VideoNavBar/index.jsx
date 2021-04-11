import firebase from 'firebase/app';

import './style.scss';
import logo from 'assets/logo.svg';
import { NavLink } from 'react-router-dom'

//TO DO FORMAT CURRENT TIME
const VideoNavBar = (props) => {
  return (
    <nav className="video-nav-bar">
      <NavLink to="/home">
        <img src={logo} alt="Logo" className="logo" />
      </NavLink>
      <span className="workout-name">
        Interval Training with Steven Steiner
      </span>
      <div className="right">
        <span className="timer">{Math.floor(props.currentTime / 60)}m {props.currentTime % 60}s</span>
        <NavLink to="/home">
          <button className="end-session" onClick={() => {
              // firebase.firestore().collection('calls').listDocuments().then(val => {
              //     val.map((val) => {
              //         val.delete()
              //     })
              // })
          }}>
            End Session
          </button>
        </NavLink>
      </div>
    </nav>
  )
}

export default VideoNavBar;