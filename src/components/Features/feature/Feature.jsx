import React from "react";
import "./Feature.css";

const Feature = ({ title, text }) => {
  return (
    <div className="signlang__features-container__feature glass-card">
      <div className="signlang__features-container__feature-title">
        <div className="title-bar" />
        <h1>{title}</h1>
      </div>
      <div className="signlang__features-container_feature-text">
        <p>{text}</p>
      </div>
    </div>
  );
};

export default Feature;
