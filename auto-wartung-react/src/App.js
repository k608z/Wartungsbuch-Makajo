import React, { useState, useEffect } from 'react';
import './App.css';
import TabNavigation from './components/TabNavigation';
import Overview from './components/Overview';
import Calendar from './components/Calendar';
import Cars from './components/Cars';
import Maintenance from './components/Maintanance';
import Maps from './components/Maps';
import Alert from './components/Alert';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cars, setCars] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [showCarModal, setShowCarModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Beispieldaten laden (später durch API-Calls ersetzen)
  useEffect(() => {
    // Beispiel-Autos
    setCars([
      {
        id: 1,
        model: 'BMW 320i',
        year: 2020,
        mileage: 45000,
        selected: true
      },
      {
        id: 2,
        model: 'Audi A4',
        year: 2018,
        mileage: 78000,
        selected: false
      }
    ]);

    // Beispiel-Wartungen
    setMaintenances([
      {
        id: 1,
        car_id: 1,
        type: 'Ölwechsel',
        last_date: '2024-06-01',
        next_date: '2024-12-01',
        interval_value: 6,
        interval_type: 'months',
        mileage_interval: 15000,
        completed: false,
        status: 'due'
      }
    ]);
  }, []);

  // Hilfsfunktionen
  const getSelectedCar = () => cars.find(car => car.selected);
  
  const getCarMaintenances = () => {
    const selectedCar = getSelectedCar();
    return selectedCar ? maintenances.filter(m => m.car_id === selectedCar.id) : [];
  };

  const selectCar = (carId) => {
    setCars(cars.map(car => ({
      ...car,
      selected: car.id === carId
    })));
  };

  const getMaintenanceStatus = (maintenance) => {
    if (maintenance.completed) return 'completed';
    const today = new Date();
    const nextDate = new Date(maintenance.next_date);
    const diffTime = nextDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 30) return 'due';
    return 'upcoming';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'overdue': return 'Überfällig';
      case 'due': return 'Fällig';
      case 'upcoming': return 'Anstehend';
      case 'completed': return 'Erledigt';
      default: return 'Unbekannt';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'overdue': return 'bi-exclamation-triangle-fill';
      case 'due': return 'bi-clock-fill';
      case 'upcoming': return 'bi-calendar-check';
      case 'completed': return 'bi-check-circle-fill';
      default: return 'bi-question-circle';
    }
  };

  const handleEditCar = (carId) => {
    // TODO: Implementieren
    console.log('Edit car:', carId);
  };

  const handleDeleteCar = (carId) => {
    if (window.confirm('Fahrzeug wirklich löschen?')) {
      setCars(cars.filter(car => car.id !== carId));
    }
  };

  const handleEditMaintenance = (maintenanceId) => {
    // TODO: Implementieren
    console.log('Edit maintenance:', maintenanceId);
  };

  const handleCompleteMaintenance = (maintenanceId) => {
    setMaintenances(maintenances.map(m => 
      m.id === maintenanceId 
        ? { ...m, completed: !m.completed }
        : m
    ));
  };

  const deleteMaintenance = (maintenanceId) => {
    if (window.confirm('Wartung wirklich löschen?')) {
      setMaintenances(maintenances.filter(m => m.id !== maintenanceId));
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Dark Mode Klasse auf body setzen
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : '';
  }, [isDarkMode]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Overview
            cars={cars}
            getSelectedCar={getSelectedCar}
            getCarMaintenances={getCarMaintenances}
            selectCar={selectCar}
            handleEditMaintenance={handleEditMaintenance}
            handleCompleteMaintenance={handleCompleteMaintenance}
            deleteMaintenance={deleteMaintenance}
            getMaintenanceStatus={getMaintenanceStatus}
            getStatusText={getStatusText}
            getStatusIcon={getStatusIcon}
          />
        );
      case 'calendar':
        return (
          <Calendar
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            maintenances={maintenances}
            getMaintenanceStatus={getMaintenanceStatus}
          />
        );
      case 'cars':
        return (
          <Cars
            cars={cars}
            selectCar={selectCar}
            handleEditCar={handleEditCar}
            handleDeleteCar={handleDeleteCar}
            setShowCarModal={setShowCarModal}
          />
        );
      case 'maintenance':
        return (
          <Maintenance
            getCarMaintenances={getCarMaintenances}
            handleEditMaintenance={handleEditMaintenance}
            deleteMaintenance={deleteMaintenance}
            getMaintenanceStatus={getMaintenanceStatus}
            getStatusText={getStatusText}
            getStatusIcon={getStatusIcon}
            setShowMaintenanceModal={setShowMaintenanceModal}
          />
        );
      case 'maps':
        return <Maps onShowWorkshopDetails={() => {}} />;
      default:
        return <Overview {...{}} />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="container-fluid">
          <h1>
            <i className="bi bi-car-front-fill me-2"></i>
            Auto Wartungsplaner
          </h1>
        </div>
      </header>

      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <main className="main-content">
        {renderActiveTab()}
      </main>

      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
}

export default App;