import React, { useState, useEffect } from 'react';

const CarModal = ({ show, onClose, onSave, title, initialData = null }) => {
  const [formData, setFormData] = useState({
    model: '',
    year: '',
    mileage: ''
  });

  // Form mit initialen Daten füllen (für Edit-Modus)
  useEffect(() => {
    if (initialData) {
      setFormData({
        model: initialData.model || '',
        year: initialData.year || '',
        mileage: initialData.mileage || ''
      });
    } else {
      setFormData({
        model: '',
        year: '',
        mileage: ''
      });
    }
  }, [initialData, show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.model.trim() || !formData.year || !formData.mileage) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }

    onSave({
      model: formData.model.trim(),
      year: parseInt(formData.year),
      mileage: parseInt(formData.mileage)
    });

    // Form zurücksetzen
    setFormData({
      model: '',
      year: '',
      mileage: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClose = () => {
    setFormData({
      model: '',
      year: '',
      mileage: ''
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="model" className="form-label">Modell</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="z.B. BMW 320i" 
                  required 
                />
              </div>
              <div className="mb-3">
                <label htmlFor="year" className="form-label">Baujahr</label>
                <input 
                  type="number" 
                  className="form-control" 
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="mb-3">
                <label htmlFor="mileage" className="form-label">Laufleistung (km)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  id="mileage"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  required 
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              {initialData ? 'Speichern' : 'Hinzufügen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarModal;