import React from 'react';
import CarSelector from './CarSelector';
import MaintenanceItem from './MaintenanceItem';

const Overview = ({ 
  cars, 
  getSelectedCar, 
  getCarMaintenances,
  selectCar,
  handleEditMaintenance,
  handleCompleteMaintenance,
  deleteMaintenance,
  getMaintenanceStatus,
  getStatusText,
  getStatusIcon
}) => {
  const selectedCar = getSelectedCar();
  const carMaintenances = getCarMaintenances();
  
  const pendingMaintenances = carMaintenances.filter(m => !m.completed);
  const completedMaintenances = carMaintenances.filter(m => m.completed);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {cars.length > 1 && (
            <CarSelector 
              cars={cars}
              selectedCar={selectedCar}
              onSelectCar={selectCar}
            />
          )}
          
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-car-front-fill me-2"></i>
                Aktuelles Fahrzeug
              </h4>
            </div>
            <div className="card-body">
              {selectedCar ? (
                <div className="car-info-box">
                  <h4>{selectedCar.model}</h4>
                  <p><strong>Baujahr:</strong> {selectedCar.year}</p>
                  <p><strong>Laufleistung:</strong> {selectedCar.mileage.toLocaleString()} km</p>
                </div>
              ) : (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Kein Fahrzeug ausgewählt
                </div>
              )}
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-tools me-2"></i>
                Anstehende Wartungen
              </h4>
            </div>
            <div className="card-body">
              {pendingMaintenances.length > 0 ? 
                pendingMaintenances.map(maintenance => (
                  <MaintenanceItem
                    key={maintenance.id}
                    maintenance={maintenance}
                    onEdit={handleEditMaintenance}
                    onDelete={deleteMaintenance}
                    onComplete={handleCompleteMaintenance}
                    getMaintenanceStatus={getMaintenanceStatus}
                    getStatusText={getStatusText}
                    getStatusIcon={getStatusIcon}
                    showCompleteButton={true}
                  />
                )) :
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Keine anstehenden Wartungen
                </div>
              }
            </div>
          </div>

          <div className="accordion" id="completedMaintenanceAccordion">
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingOne">
                <button 
                  className="accordion-button collapsed" 
                  type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target="#collapseOne" 
                  aria-expanded="false" 
                  aria-controls="collapseOne"
                >
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Erledigte Wartungen ({completedMaintenances.length})
                </button>
              </h2>
              <div 
                id="collapseOne" 
                className="accordion-collapse collapse" 
                aria-labelledby="headingOne" 
                data-bs-parent="#completedMaintenanceAccordion"
              >
                <div className="accordion-body">
                  {completedMaintenances.length > 0 ? 
                    completedMaintenances.map(maintenance => (
                      <MaintenanceItem
                        key={maintenance.id}
                        maintenance={maintenance}
                        onEdit={handleEditMaintenance}
                        onDelete={deleteMaintenance}
                        onComplete={handleCompleteMaintenance}
                        getMaintenanceStatus={getMaintenanceStatus}
                        getStatusText={getStatusText}
                        getStatusIcon={getStatusIcon}
                        showCompleteButton={true}
                      />
                    )) :
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Keine erledigten Wartungen
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;