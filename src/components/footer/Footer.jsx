import React from "react";
import "./Footer.css";
import logo from "../../assests/logo2.png";

const year = new Date().getFullYear();

const Footer = () => {
  return (
    <footer
      className="slr-footer signlang__footer section__padding"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="slr-footer__inner">
        {/* Brand */}
        <div className="slr-footer__brand">
          <img
            src={logo}
            alt="SLR — Sign Language Recognition"
            className="slr-footer__logo"
            width={240}
            height={100}
            loading="lazy"
          />
          <p className="slr-footer__tag">
            Real-time sign language detection powered by MediaPipe & modern AI.
          </p>
        </div>

        {/* Navigation */}
        <nav className="slr-footer__nav" aria-label="Primary footer links">
          <h4 className="slr-footer__title">Explore</h4>
          <ul className="slr-footer__list">
            <li><a href="/detect">Live Detect</a></li>
            <li><a href="/docs">Docs</a></li>
            <li><a href="/tutorials">Tutorials</a></li>
            <li><a href="/faq">FAQ</a></li>
          </ul>
        </nav>

        {/* Resources */}
        <nav className="slr-footer__nav" aria-label="Resources">
          <h4 className="slr-footer__title">Resources</h4>
          <ul className="slr-footer__list">
            <li><a href="/changelog">Changelog</a></li>
            <li><a href="/privacy">Privacy</a></li>
            <li><a href="/terms">Terms</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>

        {/* Contact / Social */}
        <div className="slr-footer__contact">
          <h4 className="slr-footer__title">Connect</h4>
          <p className="slr-footer__text">
            For feedback & collaborations, reach out anytime.
          </p>
          <div className="slr-footer__social" aria-label="Social links">
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="slr-social__btn">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.42-1.35-1.8-1.35-1.8-1.1-.75.08-.73.08-.73 1.22.09 1.86 1.26 1.86 1.26 1.08 1.86 2.83 1.33 3.52 1.02.11-.79.42-1.33.76-1.63-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.25-3.22-.13-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.64.25 2.86.12 3.16.78.84 1.25 1.91 1.25 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.83.58A12 12 0 0 0 12 .5Z"/></svg>
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="slr-social__btn">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7 0h3.8v2.2h.06C12 8.9 13.7 8 15.9 8 20.3 8 24 10.7 24 16.1V24h-4v-7c0-1.7-.1-3.9-2.4-3.9-2.4 0-2.8 1.9-2.8 3.8V24h-4V8z"/></svg>
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X" className="slr-social__btn">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M18.9 1H22l-7.7 8.8L24 23h-7.4l-5.3-7.1L4.9 23H2l8.2-9.4L0 1h7.5l4.9 6.6L18.9 1Zm-1.3 20h2L6.6 3H4.5l13.1 18Z"/></svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="slr-social__btn">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .6 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.3.6 9.3.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.6-5.8ZM9.6 15.5v-7l6 3.5-6 3.5Z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="slr-footer__bottom">
        <p className="slr-footer__copy">
          © {year} <span className="slr-brand">SignSight</span>. All rights reserved.
        </p>
        <button
          className="slr-footer__top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          ↑ Back to top
        </button>
      </div>
    </footer>
  );
};

export default Footer;
