import React from 'react';
import { HiPresentationChartBar } from 'react-icons/hi';
import './FloatingPPT.css';

const FloatingPPT = () => {
  return (
    <a 
      href="https://immishra13.github.io/signsightppt/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="floating-ppt-btn"
      title="View Presentation"
    >
      <div className="ppt-icon-wrapper">
        <HiPresentationChartBar size={32} />
      </div>
      <span className="ppt-text">View PPT</span>
    </a>
  );
};

export default FloatingPPT;
