import React from 'react';

const Maps = ({ onShowWorkshopDetails }) => {
  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header">
          <h4 className="card-title mb-0">
            <i className="bi bi-geo-alt-fill me-2"></i>
            Werkstätten in der Nähe
          </h4>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            Karten-Funktion wird später implementiert.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maps;