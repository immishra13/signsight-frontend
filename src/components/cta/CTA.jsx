import React from 'react'
import "./CTA.css"
import { Link } from 'react-router-dom'

const CTA = () => {
    return (
        <section className='signlang_cta section__margin'>
            <div className="signlang_cta-content">
                <h3>Ready to experience the future of <br /> inclusive communication?</h3>
            </div>

            <div className="signlang_cta-button">
                <button>
                    <Link to="/detect">
                      Get Started Now
                    </Link>
                </button>
            </div>
        </section>
    )
}

export default CTA
