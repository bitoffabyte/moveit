import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import HomePage from 'pages/HomePage';
import LandingPage from 'pages/LandingPage';
import WorkoutPage from 'pages/WorkoutPage';
import 'index.scss';
import PoseEstimation from 'components/VideoCall/PoseEstimation';

import socketIOClient from 'socket.io-client';

const ENDPOINT = 'http://localhost:3001';
const socket = socketIOClient(ENDPOINT);

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Switch>
        <Route path="/pose-dev">
          <PoseEstimation />
        </Route>
        <Route path="/workout">
          <WorkoutPage socket={socket}/>
        </Route>
        <Route path="/home">
            <HomePage />
        </Route>
        <Route path="/">
          <LandingPage />
        </Route>
      </Switch>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
