import React from 'react';

import Info from '../../assets/info.svg';

import './style.css';

const InstructorCard = ({name, description, image, color}) => {
    return (
    <div className={`instructor-card ${color}`}>
        <img src={Info} alt="Info" className="info" />
        <img src={image} alt={name} className="background" />
        <p className="name">{name}</p>
        <p className="description">{description}</p>
        <button className="button">Book Now</button>
    </div>
    );
}

export default InstructorCard;