import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

import SessionCard from '../SessionCard';
import InstructorCard from '../InstructorCard';

import logo from '../../assets/logo.svg';
import Profile from '../../assets/profile.png';

import Biceps from '../../assets/biceps.svg';
import Legs from '../../assets/legs.svg';
import Shoulders from '../../assets/shoulders.svg';

import BookInstructors from '../../assets/bookinstructors.png';
import SarahLee from '../../assets/sarahlee.png';
import DrYash from '../../assets/dryash.png';

import WatchCatalog from '../../assets/watchcatalog.png';
import Instructor from '../../assets/instructor.png';

import './style.scss';

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
    startTime: "2:00PM",
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
        <div className="dashboard-float">
          <div className="dashboard">
            <div className="top">
              <p className="welcome">Welcome back,</p>
              <p className="name">Stanley!</p>
              <div className="online-status">
                <div className="online-count">
                  <p className="count">232</p>
                  <div className="indicator" />
                </div>
                <p className="title">Instructors<br />Online</p>
              </div>
              <div className="statistics">
                <div className="workout">
                  <p className="title">Workout Score</p>
                  <p className="description">Based off lifetime instructor comparisons</p>
                  <div className="scores">
                    <div className="lifetime">
                      <p className="score">79</p>
                      <p className="title">Lifetime<br />Score</p>
                    </div>
                    <div className="last">
                      <p className="score">83</p>
                      <p className="title">Score<br />Last Workout</p>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="active">
                    <p className="title">Active Time</p>
                    <p className="description">Lifetime Total</p>
                    <p className="time">23h 12m</p>
                  </div>
                  <div className="areas">
                  <p className="title">Suggested Areas</p>
                  <p className="description">Based on previous workouts</p>
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
                <div className="calendar">
                  <p className="title">Your Calendar</p>
                  <FullCalendar
                    plugins={[ dayGridPlugin ]}
                    initialView="dayGridWeek"
                    weekends={false}
                    events={[
                      { title: 'Int. Train', date: '2021-04-05' },
                      { title: 'Meditation', date: '2021-04-07' },
                      { title: 'Int. Train', date: '2021-04-09' }
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
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