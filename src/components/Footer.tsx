
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-900/60 backdrop-blur-lg border-t border-gray-700/30 px-6 py-4 mt-8">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-gray-400 text-sm">
          © {currentYear} YouTube Converter. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
