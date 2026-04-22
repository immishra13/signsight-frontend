import React from 'react'
import "./Working.css"
import WorkingImg from "../../assests/Working.png";

const Working = () => {
  return (
    <section className='signlang_working section__padding' id="working">
        <div className="signlang_working-img">
          <img src={WorkingImg} alt="working" />
        </div>

        <div className="signlang_working-content">
          <h1 className="gradient__text">How it Works</h1>
          <p>
            Our system leverages cutting-edge computer vision to bridge communication gaps. 
            By analyzing hand landmarks in real-time using MediaPipe, the AI interprets your gestures 
            and translates them into text or speech instantaneously.
          </p>
          <p>
            Simply face the camera, perform your sign, and watch as the model predicts the meaning 
            with high accuracy. Whether you're learning or practicing, SignSight makes the experience 
            seamless, accessible, and interactive for everyone.
          </p>
        </div>
    </section>
  )
}

export default Working