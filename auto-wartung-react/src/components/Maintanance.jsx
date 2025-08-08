import React from 'react';
import MaintenanceItem from './MaintenanceItem';

const Maintenance = ({ 
  getCarMaintenances, 
  handleEditMaintenance, 
  deleteMaintenance, 
  getMaintenanceStatus,
  getStatusText,
  getStatusIcon,
  setShowMaintenanceModal 
}) => {
  const carMaintenances = getCarMaintenances();
  const pendingMaintenances = carMaintenances.filter(m => !m.completed);

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title mb-0">
            <i className="bi bi-tools me-2"></i>
            Wartungen verwalten
          </h4>
          <button className="btn btn-primary" onClick={() => setShowMaintenanceModal(true)}>
            <i className="bi bi-plus-lg me-2"></i>
            Wartung hinzufügen
          </button>
        </div>
        <div className="card-body">
          {pendingMaintenances.length > 0 ? 
            pendingMaintenances.map(maintenance => (
              <MaintenanceItem
                key={maintenance.id}
                maintenance={maintenance}
                onEdit={handleEditMaintenance}
                onDelete={deleteMaintenance}
                getMaintenanceStatus={getMaintenanceStatus}
                getStatusText={getStatusText}
                getStatusIcon={getStatusIcon}
                detailed={true}
                showManagementButtons={true}
              />
            )) :
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Keine anstehenden Wartungen für dieses Fahrzeug
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default Maintenance;