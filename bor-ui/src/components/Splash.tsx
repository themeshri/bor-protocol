import React, { useEffect } from 'react';
import './Splash.css';  // Create this file for the styles

const Splash = () => {
  useEffect(() => {
    const createHeart = () => {
      const heart = document.createElement('div');
      heart.innerHTML = `
        <svg class="heart" width="20" height="20" viewBox="0 0 20 20" style="left: ${Math.random() * 100}%;">
          <path d="M10 19.5L8.55 18.15C3.4 13.36 0 10.28 0 6.5C0 3.42 2.42 1 5.5 1C7.24 1 8.91 1.81 10 3.09C11.09 1.81 12.76 1 14.5 1C17.58 1 20 3.42 20 6.5C20 10.28 16.6 13.36 11.45 18.15L10 19.5Z"
                fill="#FFB7D5"/>
        </svg>
      `;
      heart.style.animation = `floatHeart ${6 + Math.random() * 4}s linear infinite`;
      heart.style.left = `${Math.random() * 100}%`;
      heart.style.animationDelay = `${Math.random() * 5}s`;
      
      heart.addEventListener('animationend', () => {
        heart.remove();
      });
      
      document.getElementById('hearts')?.appendChild(heart);
    };

    const createHearts = () => {
      const numberOfHearts = 20;
      for (let i = 0; i < numberOfHearts; i++) {
        createHeart();
      }
    };

    createHearts();
  }, []);

  return (
    <div className="splash-container">
      <div className="hearts" id="hearts" />
      <div className="logo-container">
        <img src="/bow1.svg" alt="Borp Logo" />
      </div>
      <svg className="secondary-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 628 183">
        {/* Your secondary SVG path data */}
        <img src="/icons/borptext.svg" alt="Borp Logo" />
      </svg>
    </div>
  );
};

export default Splash;