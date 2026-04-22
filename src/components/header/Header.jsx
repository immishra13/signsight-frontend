import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import SignHand from "../../assests/SignHand.png";

const Header = () => {
  return (
    <header className="signlang__header section__padding" id="home">
      <div className="hero-grid">
        <div className="signlang__header-content">
          <h1 className="gradient__text">
            Master Sign Language <br /> with AI Precision.
          </h1>
          <p className="hero-sub">
            Bridging communication gaps with real-time hand-tracking & object detection.
            Practice gestures, translate signs, and explore the environment — all powered by advanced machine learning.
          </p>

          <div className="hero-actions">
            <Link to="/detect" className="cta-btn cta-btn--primary">
              🚀 Explore Sign AI
            </Link>
            <Link to="/objectdetection" className="cta-btn cta-btn--ghost">
              🔎 Explore Object AI
            </Link>
            <a 
              href="https://immishra13.github.io/signsightppt/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="cta-btn cta-btn--outline"
            >
              📊 View PPT
            </a>
          </div>

          <div className="hero-mini">
            <span className="mini-item">No Downloads</span>
            <span className="dot">•</span>
            <span className="mini-item">Privacy Focused</span>
            <span className="dot">•</span>
            <span className="mini-item">Powered by MediaPipe</span>
          </div>
        </div>

        <div className="signlang__header-image">
          <img src={SignHand} alt="SIGN-HAND" />
        </div>
      </div>
    </header>
  );
};

export default Header;
