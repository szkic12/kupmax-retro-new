import { useState, useEffect } from 'react';

const useEra = () => {
  const [currentEra, setCurrentEra] = useState('modern');

  // Load era from localStorage on mount
  useEffect(() => {
    const savedEra = localStorage.getItem('kupmax-era');
    if (savedEra) {
      setCurrentEra(savedEra);
    }
  }, []);

  // Save era to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kupmax-era', currentEra);
  }, [currentEra]);

  const changeEra = (eraId) => {
    setCurrentEra(eraId);
    // You can add analytics or other side effects here
    console.log(`Era changed to: ${eraId}`);
  };

  const getEraStyles = () => {
    const eraStyles = {
      retro: {
        backgroundColor: '#ff6b6b',
        textColor: '#2d3748',
        accentColor: '#ff6b6b',
        fontFamily: '"Courier New", monospace'
      },
      web2: {
        backgroundColor: '#4ecdc4', 
        textColor: '#2d3748',
        accentColor: '#4ecdc4',
        fontFamily: '"Arial", sans-serif'
      },
      modern: {
        backgroundColor: '#45b7d1',
        textColor: '#2d3748',
        accentColor: '#45b7d1',
        fontFamily: '"Inter", system-ui, sans-serif'
      },
      future: {
        backgroundColor: '#96ceb4',
        textColor: '#2d3748',
        accentColor: '#96ceb4',
        fontFamily: '"SF Pro Display", system-ui, sans-serif'
      }
    };

    return eraStyles[currentEra] || eraStyles.modern;
  };

  return {
    currentEra,
    changeEra,
    getEraStyles
  };
};

export default useEra;
export { useEra };
