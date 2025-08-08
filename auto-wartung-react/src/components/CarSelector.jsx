import React from 'react';

const CarSelector = ({ cars, selectedCar, onSelectCar }) => {
  return (
    <div className="car-selector mb-4">
      <div className="dropdown">
        <button 
          className="btn btn-outline-primary dropdown-toggle car-selector-dropdown" 
          type="button" 
          data-bs-toggle="dropdown" 
          aria-expanded="false"
        >
          <i className="bi bi-car-front me-2"></i>
          {selectedCar?.model || 'Fahrzeug auswählen'}
        </button>
        <ul className="dropdown-menu">
          {cars.map(car => (
            <li key={car.id}>
              <button 
                className={`car-option ${car.selected ? 'active' : ''}`} 
                onClick={() => onSelectCar(car.id)}
              >
                <i className={`bi ${car.selected ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i>
                <div>
                  <div><strong>{car.model}</strong></div>
                  <small className="text-muted">{car.year} • {car.mileage.toLocaleString()} km</small>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CarSelector;