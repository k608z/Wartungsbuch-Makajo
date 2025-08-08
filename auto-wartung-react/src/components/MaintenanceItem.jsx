import React from 'react';

const MaintenanceItem = ({ 
  maintenance, 
  onEdit, 
  onDelete, 
  onComplete,
  getMaintenanceStatus,
  getStatusText,
  getStatusIcon,
  detailed = false,
  showManagementButtons = false,
  showCompleteButton = false
}) => {
  const status = getMaintenanceStatus(maintenance);
  const statusText = getStatusText(status);
  const statusIcon = getStatusIcon(status);

  return (
    <div className={`card maintenance-card status-${status} mb-3`}>
      <div className="maintenance-item">
        <div className="maintenance-info">
          <h5>
            <i className={`bi ${statusIcon} me-2`}></i>
            {maintenance.type}
            {maintenance.status === 'recommended' && (
              <span className="badge bg-warning text-dark ms-2">Empfohlen</span>
            )}
          </h5>
          <small>
            Letzter Service: {maintenance.last_date ? 
              new Date(maintenance.last_date).toLocaleDateString('de-DE') : 
              'Unbekannt'
            }
          </small>
          <small>
            Nächster Service: {maintenance.next_date ? 
              new Date(maintenance.next_date).toLocaleDateString('de-DE') : 
              'N/A'
            }
          </small>
          {detailed && maintenance.interval_value && (
            <small>
              Intervall: {maintenance.interval_value} {
                maintenance.interval_type === 'months' ? 'Monate' : 'Jahre'
              }
            </small>
          )}
          {detailed && maintenance.mileage_interval && (
            <small>Oder alle {maintenance.mileage_interval.toLocaleString()} km</small>
          )}
        </div>
        <div className="maintenance-actions">
          <span className={`badge status-badge status-${status}`}>{statusText}</span>
          {showCompleteButton && (
            <button 
              className="btn btn-sm btn-primary" 
              onClick={() => onComplete(maintenance.id)}
            >
              {maintenance.completed ? 'Rückgängig' : 'Erledigt'}
            </button>
          )}
          {showManagementButtons && (
            <>
              <button 
                className="btn btn-sm btn-icon btn-edit" 
                onClick={() => onEdit(maintenance.id)}
                title="Bearbeiten"
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button 
                className="btn btn-sm btn-icon btn-delete" 
                onClick={() => onDelete(maintenance.id)}
                title="Löschen"
              >
                <i className="bi bi-trash"></i>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceItem;