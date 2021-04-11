import { Button } from 'antd';
import { Link } from 'react-router-dom';

import rect from '../../assets/rectangecol.svg';
import person from '../../assets/circlegirl.png';
import logo from '../../assets/logo.svg';

import './style.scss';

const Landing = () => {
  return (
    <div className="Landing">
      <div className="text">
        <h1 className="outlined">ACHIEVE A</h1>
        <h1 className="filled">PERFECT</h1>
        <h1 className="outlined">WORKOUT</h1>
        <div className="fit">
          <p>Fitness powered by machine learning</p>
          <p>based pose estimation and realtime video</p>
          <p>with trained trainers across the world.</p>
        </div>
        <div className="button-row">
          <Link to="/home">
            <Button className="demo">Start Demo</Button>
          </Link>
          <h2>Instructor Demo</h2>
        </div>
      </div>
      <img src={logo} alt="logo" className="logo" />
      <img src={rect} alt="rect" className="rect" />
      <img src={person} alt="person" className="person" />
    </div>
  );
};

export default Landing;
