import React from 'react';

import SessionCard from '../SessionCard';
import InstructorCard from '../InstructorCard';

import logo from '../../assets/logo.png';
import Profile from '../../assets/profile.png';

import BookInstructors from '../../assets/bookinstructors.png';
import SarahLee from '../../assets/sarahlee.png';
import DrYash from '../../assets/dryash.png';

import WatchCatalog from '../../assets/watchcatalog.png';
import Instructor from '../../assets/instructor.png';

import './style.css';

const Home  = () => {
  const upcomingSessions = [{
    sessionName: "Interval Training",
    sessionDuration: 120,
    instructorName: "Sarah Lee",
    startDate: "",
    starTime: "",
    prerecorded: false,
    starting: true,
    image: SarahLee,
    color: "orange"
  },
  {
    sessionName: "Meditation",
    sessionDuration: 45,
    instructorName: "Dr. Yash",
    startDate: "Thursday",
    startTime: "4:30PM",
    prerecorded: false,
    starting: false,
    image: DrYash,
    color: "pink"
  }];

  const recordedSessions = [{
    sessionName: "Interval Training",
    sessionDuration: 120,
    instructorName: "Sarah Lee",
    startDate: "4/01",
    starTime: "2:00PM",
    prerecorded: false,
    starting: false,
    image: SarahLee,
    color: "blue"
  },
  {
    sessionName: "Meditation",
    sessionDuration: 45,
    instructorName: "Dr. Yash",
    startDate: "3/12",
    startTime: "2:30pm",
    prerecorded: false,
    starting: false,
    image: DrYash,
    color: "pink"
  },
  {
    sessionName: "Meditation",
    sessionDuration: 45,
    instructorName: "Dr. Yash",
    startDate: "3/12",
    startTime: "2:30pm",
    prerecorded: false,
    starting: false,
    image: DrYash,
    color: "pink"
  }];

  const instructors = [{
    name: 'Jane Smith',
    description: 'Physical Trainer',
    image: Instructor,
    color: "pink"
  },{
    name: 'Jane Smith',
    description: 'Physical Trainer',
    image: Instructor,
    color: "purple"
  },{
    name: 'Jane Smith',
    description: 'Physical Trainer',
    image: Instructor,
    color: "blue"
  },{
    name: 'Jane Smith',
    description: 'Physical Trainer',
    image: Instructor,
    color: "green"
  }]


  return (
    <div className="home">
      <div className="header">
        <a href="/home">
          <img src={logo} alt="Logo" className="logo" />
        </a>
        <div className="right">
          <div>
            <a href="/instructors" className="link">Instructors</a>
            <a href="/profile" className="link">Profile</a>
            <a href="/settings" className="link">Settings</a>
          </div>
          <img src={Profile} alt="Profile" className="profile"/>
        </div>
      </div>
      <div className="content">
        <div className="booking">
          <div className="sessions">
            <p className="title">Your Upcoming Sessions</p>
            <div className="container">
              <img src={BookInstructors} alt="" className="starter"/>
              {upcomingSessions.map((session) => (
                <SessionCard {...session}/>
              ))}
            </div>
          </div>
          <div className="sessions">
            <p className="title">Pre-Recorded Sessions</p>
            <div className="container">
              <img src={WatchCatalog} alt="" className="starter"/>
              {recordedSessions.map((session) => (
                <SessionCard {...session}/>
              ))}
            </div>
          </div>
          <div className="sessions">
            <p className="title">Book Instructors</p>
            <div className="container">
            {instructors.map((instructor) => (
                <InstructorCard {...instructor}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Home;