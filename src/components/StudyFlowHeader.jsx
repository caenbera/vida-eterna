import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo01.png';

const StudyFlowHeader = ({ crumbs = [] }) => (
  <>
    <div className="study-flow-header">
      <Link to="/" className="brand">
        <img src={logo} alt="Vida Eterna" />
        <span className="brand-text">
          Vida Eterna
          <small>ESTUDIOS BÍBLICOS</small>
        </span>
      </Link>
      <Link to="/" className="back-link">
        <i className="fa-solid fa-arrow-left"></i> Biblioteca
      </Link>
    </div>
    {crumbs.length > 0 && (
      <div className="study-flow-breadcrumbs">
        {crumbs.map((c, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem' }}></i>}
            {c.to ? <Link to={c.to}>{c.label}</Link> : <span className="current">{c.label}</span>}
          </React.Fragment>
        ))}
      </div>
    )}
  </>
);

export default StudyFlowHeader;
