import React from 'react';

const Calendar = ({ currentDate, setCurrentDate, maintenances, getMaintenanceStatus }) => {
  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                     'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header">
          <div className="calendar-header">
            <h4 className="card-title mb-0">
              <i className="bi bi-calendar3 me-2"></i>
              Wartungskalender
            </h4>
            <div className="calendar-nav">
              <button className="btn btn-outline-primary btn-sm" onClick={() => navigateMonth(-1)}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <div className="calendar-month-year">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <button className="btn btn-outline-primary btn-sm" onClick={() => navigateMonth(1)}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="p-3">
            <p>Kalender wird geladen...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;