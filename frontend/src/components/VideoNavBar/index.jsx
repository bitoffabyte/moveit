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
        <span className="timer">0m {props.currentTime}s</span>
        <NavLink to="/home">
          <button className="end-session">
            End Session
          </button>
        </NavLink>
      </div>
    </nav>
  )
}

export default VideoNavBar;