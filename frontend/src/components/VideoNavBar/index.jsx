import './style.scss';
import logo from 'assets/logo.png';
import { NavLink } from 'react-router-dom'

const VideoNavBar = () => {
  return (
    <nav className="video-nav-bar">
      <NavLink to="/home">
        <img src={logo} alt="Logo" className="logo" />
      </NavLink>
      <span className="workout-name">
        Interval Training with Steven Steiner
      </span>
      <div className="right">
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