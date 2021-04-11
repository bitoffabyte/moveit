import React from 'react';

import VideoCall from 'components/VideoCall';
import VideoNavBar from 'components/VideoNavBar';

const WorkoutPage  = () => { 

  const [currentTime, setCurrentTime] = React.useState(0);
  const startTimer = () => {
    setInterval(() => {
      setCurrentTime(time => time + 1);
    }, 1000);
  }
  return (
    <>
      <VideoNavBar currentTime={currentTime}/>
      <VideoCall startTimer={startTimer}/>
    </>
  )
}

export default WorkoutPage