import React from 'react';

const Cars = ({ cars, selectCar, handleEditCar, handleDeleteCar, setShowCarModal }) => {
  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title mb-0">
            <i className="bi bi-car-front-fill me-2"></i>
            Meine Fahrzeuge
          </h4>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCarModal(true)}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Fahrzeug hinzufügen
          </button>
        </div>
        <div className="card-body">
          <div className="row">
            {cars.map(car => (
              <div key={car.id} className="col-md-6 col-lg-4 mb-3">
                <div 
                  className={`card car-card ${car.selected ? 'selected' : ''}`} 
                  onClick={() => selectCar(car.id)}
                >
                  <div className="card-body">
                    {car.selected && (
                      <span className="selected-badge">
                        <i className="bi bi-check-lg"></i> Ausgewählt
                      </span>
                    )}
                    <h5 className="card-title">{car.model}</h5>
                    <p className="card-text text-muted mb-1">
                      <strong>Baujahr:</strong> {car.year}
                    </p>
                    <p className="card-text text-muted">
                      <strong>Laufleistung:</strong> {car.mileage.toLocaleString()} km
                    </p>
                    <div className="car-actions">
                      <button 
                        className="btn btn-icon btn-edit" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCar(car.id);
                        }}
                        title="Bearbeiten"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-icon btn-delete" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCar(car.id);
                        }}
                        title="Löschen"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cars;