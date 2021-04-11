import React from 'react';
import { useHistory } from "react-router-dom";

import './style.scss';

const SessionCard = ({sessionName, sessionDuration, instructorName, startDate, startTime, prerecorded, starting, image, color}) => {
    const history = useHistory();
    return (
    <div className={`session-card ${color}`}>
        <img src={image} alt={sessionName} className="background" />
        <p className="name">{sessionName}</p>
        <p className="duration">{sessionDuration} minutes</p>
        <div className="info-flex">
            <p className="instructor"><span className="instructor-title">Instructor</span><br />{instructorName}</p>
            <p className="time">{starting ? <>Starting<br />Now</> : <>{startDate}<br />{startTime}</>}</p>
        </div>
        <div className="buttons">
            {prerecorded
                ? (<button className="button">Watch</button>)
                : (starting
                    ? (<><button className="button"
                    onClick={() => {
                        // I think this needs to be a button and not a link to count as an interaction
                        history.push("/workout");
                    }}
                    >Join Now</button><button className="button">Re-book</button></>)
                    : (<><button className="button">Watch</button><button className="button">Cancel</button></>)
            )}
        </div>
    </div>
    );
}

export default SessionCard;