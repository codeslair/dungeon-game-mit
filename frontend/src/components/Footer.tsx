import React from 'react';
import './Footer.scss';

/**
 * Footer Component
 * Displays project information, developer credits, and professor attribution
 * This is an MIT group project
 */
const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Developers</h3>
          <p>Gabrielle Louis Valencia, Mark Amena, Mark Christian Yumul</p>
        </div>
        
        <div className="footer-section">
          <h3>Advisor</h3>
          <p>Dr. ARCELY P NAPALIT</p>
        </div>
        
        <div className="footer-section">
          <h3>Built With</h3>
          <p>
            <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">React</a> • 
            <a href="https://hardhat.org" target="_blank" rel="noopener noreferrer">Hardhat</a> • 
            <a href="https://web3js.org" target="_blank" rel="noopener noreferrer">Web3.js</a>
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Project</h3>
          <p>
            MIT Group Project © 2026 • 
            <a href="https://github.com/codeslair/dungeon-game-mit" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
