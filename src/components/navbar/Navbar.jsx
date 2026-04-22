import React, { useEffect, useState } from "react";
import "./Navbar.css";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assests/logo2.png";
import { RiMenu3Line, RiCloseLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "../../redux/actions/authaction";

const NavItems = ({ className, onClick }) => {
  const { accessToken } = useSelector((state) => state.auth);
  
  return (
    <div className={className}>
      <p><NavLink to="/" end onClick={onClick}>Home</NavLink></p>
      <p><NavLink to="/detect" onClick={onClick}>Learn</NavLink></p>
      <p><NavLink to="/detection" onClick={onClick}>Sign AI</NavLink></p>
      <p><NavLink to="/objectdetection" onClick={onClick}>Object AI</NavLink></p>
      {accessToken && (
        <p><NavLink to="/dashboard" onClick={onClick}>Dashboard</NavLink></p>
      )}
    </div>
  );
};

const Navbar = ({ notifyMsg }) => {
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const user = useSelector((state) => state.auth?.user);
  const { accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogin = () => {
    dispatch(login());
    setToggle(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    notifyMsg?.("success", "Logged Out Successfully!");
    setToggle(false);
  };

  return (
    <div className={`signlang_navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="signlang_navbar-container">
        <div className="signlang_navbar-logo">
          <Link to="/">
            <img src={logo} alt="logo" />
            <span className="logo-text">SignSight</span>
          </Link>
        </div>

        <NavItems className="signlang_navbar-links" />

        <div className="signlang_navbar-auth">
          {accessToken ? (
            <div className="user-profile">
              <img src={user?.photoURL} alt="user" className="user-avatar" />
              <button className="auth-btn logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button className="auth-btn login-btn" onClick={handleLogin}>Login</button>
          )}
        </div>

        <div className="signlang_navbar-mobile-toggle">
          {toggle 
            ? <RiCloseLine color="#fff" size={28} onClick={() => setToggle(false)} />
            : <RiMenu3Line color="#fff" size={28} onClick={() => setToggle(true)} />
          }
        </div>
      </div>

      {toggle && (
        <div className="signlang_navbar-mobile-menu slide-bottom">
          <NavItems className="mobile-links" onClick={() => setToggle(false)} />
          <div className="mobile-auth">
            {accessToken ? (
              <button className="auth-btn logout-btn full-width" onClick={handleLogout}>Logout</button>
            ) : (
              <button className="auth-btn login-btn full-width" onClick={handleLogin}>Login</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
