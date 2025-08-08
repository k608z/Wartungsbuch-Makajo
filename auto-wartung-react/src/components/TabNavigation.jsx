import React from 'react';

const TabNavigation = ({ activeTab, setActiveTab, isDarkMode, setIsDarkMode }) => {
  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: 'bi-house-fill' },
    { id: 'calendar', label: 'Kalender', icon: 'bi-calendar3' },
    { id: 'cars', label: 'Fahrzeuge', icon: 'bi-car-front-fill' },
    { id: 'maintenance', label: 'Wartungen', icon: 'bi-tools' },
    { id: 'maps', label: 'Werkstätten', icon: 'bi-geo-alt-fill' }
  ];

  return (
    <nav className="tab-nav">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
          data-tab={tab.id}
        >
          <i className={tab.icon}></i> {tab.label}
        </button>
      ))}
      
      <button 
        className="dark-mode-toggle" 
        onClick={() => setIsDarkMode(!isDarkMode)}
        title="Dark Mode umschalten"
      >
        <i className={`bi ${isDarkMode ? 'bi-sun-fill' : 'bi-moon-fill'}`} id="darkModeIcon"></i>
      </button>
    </nav>
  );
};

export default TabNavigation;