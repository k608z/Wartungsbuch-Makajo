const { useState, useEffect } = React;

const AutoWartungApp = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [cars, setCars] = useState([
    {
      id: 1,
      model: 'BMW 320i',
      year: 2019,
      mileage: 85000,
      selected: true
    }
  ]);
  const [maintenances, setMaintenances] = useState([
    {
      id: 1,
      carId: 1,
      type: 'Ölwechsel',
      lastDate: '2024-06-15',
      nextDate: '2024-12-15',
      interval: 6,
      intervalType: 'months',
      mileageInterval: 10000,
      completed: false
    },
    {
      id: 2,
      carId: 1,
      type: 'TÜV',
      lastDate: '2023-08-20',
      nextDate: '2025-08-20',
      interval: 24,
      intervalType: 'months',
      completed: false
    },
    {
      id: 3,
      carId: 1,
      type: 'Inspektion',
      lastDate: '2024-03-10',
      nextDate: '2025-03-10',
      interval: 12,
      intervalType: 'months',
      mileageInterval: 15000,
      completed: false
    }
  ]);
  const [showAddCar, setShowAddCar] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [newCar, setNewCar] = useState({ model: '', year: '', mileage: '' });
  const [newMaintenance, setNewMaintenance] = useState({
    type: '',
    lastDate: '',
    interval: '',
    intervalType: 'months',
    mileageInterval: ''
  });

  const getSelectedCar = () => cars.find(car => car.selected);

  const getMaintenanceStatus = (maintenance) => {
    const today = new Date();
    const nextDate = new Date(maintenance.nextDate);
    const diffTime = nextDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (maintenance.completed) return 'completed';
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 30) return 'due-soon';
    return 'ok';
  };

  const getStatusClass = (status) => {
    return `maintenance-item status-${status}`;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Erledigt';
      case 'overdue': return 'Überfällig';
      case 'due-soon': return 'Steht bald an';
      default: return 'OK';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return React.createElement('span', { className: 'icon icon-check' });
      case 'overdue': return React.createElement('span', { className: 'icon icon-warning' });
      case 'due-soon': return React.createElement('span', { className: 'icon icon-clock' });
      default: return React.createElement('span', { className: 'icon icon-check' });
    }
  };

  const addCar = () => {
    if (newCar.model && newCar.year && newCar.mileage) {
      const car = {
        id: Date.now(),
        model: newCar.model,
        year: parseInt(newCar.year),
        mileage: parseInt(newCar.mileage),
        selected: cars.length === 0
      };
      setCars([...cars, car]);
      setNewCar({ model: '', year: '', mileage: '' });
      setShowAddCar(false);
    }
  };

  const addMaintenance = () => {
    const selectedCar = getSelectedCar();
    if (newMaintenance.type && newMaintenance.lastDate && newMaintenance.interval && selectedCar) {
      const lastDate = new Date(newMaintenance.lastDate);
      const nextDate = new Date(lastDate);
      
      if (newMaintenance.intervalType === 'months') {
        nextDate.setMonth(nextDate.getMonth() + parseInt(newMaintenance.interval));
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + parseInt(newMaintenance.interval));
      }

      const maintenance = {
        id: Date.now(),
        carId: selectedCar.id,
        type: newMaintenance.type,
        lastDate: newMaintenance.lastDate,
        nextDate: nextDate.toISOString().split('T')[0],
        interval: parseInt(newMaintenance.interval),
        intervalType: newMaintenance.intervalType,
        mileageInterval: newMaintenance.mileageInterval ? parseInt(newMaintenance.mileageInterval) : null,
        completed: false
      };
      
      setMaintenances([...maintenances, maintenance]);
      setNewMaintenance({
        type: '',
        lastDate: '',
        interval: '',
        intervalType: 'months',
        mileageInterval: ''
      });
      setShowAddMaintenance(false);
    }
  };

  const markAsCompleted = (id) => {
    setMaintenances(maintenances.map(m => 
      m.id === id ? { ...m, completed: !m.completed } : m
    ));
  };

  const selectCar = (carId) => {
    setCars(cars.map(car => ({ ...car, selected: car.id === carId })));
  };

  const getCarMaintenances = () => {
    const selectedCar = getSelectedCar();
    return selectedCar ? maintenances.filter(m => m.carId === selectedCar.id) : [];
  };

  const renderOverview = () => {
    const selectedCar = getSelectedCar();
    const carMaintenances = getCarMaintenances();
    
    return React.createElement('div', { className: 'main-content' },
      React.createElement('div', { className: 'card' },
        React.createElement('h2', { className: 'card-title' },
          React.createElement('span', { className: 'icon icon-car' }),
          'Aktuelles Fahrzeug'
        ),
        selectedCar ? 
          React.createElement('div', { className: 'car-info' },
            React.createElement('h3', null, selectedCar.model),
            React.createElement('p', null, `Baujahr: ${selectedCar.year}`),
            React.createElement('p', null, `Laufleistung: ${selectedCar.mileage.toLocaleString()} km`)
          ) :
          React.createElement('p', { style: { color: '#6b7280' } }, 'Kein Fahrzeug ausgewählt')
      ),
      React.createElement('div', { className: 'card' },
        React.createElement('h2', { className: 'card-title' },
          React.createElement('span', { className: 'icon icon-wrench' }),
          'Wartungsübersicht'
        ),
        React.createElement('div', null,
          carMaintenances.map(maintenance => {
            const status = getMaintenanceStatus(maintenance);
            return React.createElement('div', { 
              key: maintenance.id, 
              className: getStatusClass(status)
            },
              React.createElement('div', { className: 'maintenance-info' },
                React.createElement('h3', null,
                  getStatusIcon(status),
                  maintenance.type
                ),
                React.createElement('p', null, `Letzter Termin: ${new Date(maintenance.lastDate).toLocaleDateString('de-DE')}`),
                React.createElement('p', null, `Nächster Termin: ${new Date(maintenance.nextDate).toLocaleDateString('de-DE')}`)
              ),
              React.createElement('div', { className: 'maintenance-actions' },
                React.createElement('span', { className: 'status-badge' }, getStatusText(status)),
                React.createElement('button', {
                  onClick: () => markAsCompleted(maintenance.id),
                  className: 'btn btn-primary btn-small'
                }, maintenance.completed ? 'Rückgängig' : 'Erledigt')
              )
            );
          })
        )
      )
    );
  };

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const carMaintenances = getCarMaintenances();
    const maintenancesByDate = {};
    
    carMaintenances.forEach(maintenance => {
      const date = new Date(maintenance.nextDate);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate();
        if (!maintenancesByDate[day]) maintenancesByDate[day] = [];
        maintenancesByDate[day].push(maintenance);
      }
    });

    const days = [];
    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    // Empty cells for days before month start
    for (let i = 0; i < startingDay; i++) {
      days.push(React.createElement('div', { key: `empty-${i}`, className: 'calendar-day' }));
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayMaintenances = maintenancesByDate[day] || [];
      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      
      days.push(
        React.createElement('div', { 
          key: day, 
          className: `calendar-day ${isToday ? 'today' : ''}` 
        },
          React.createElement('div', { className: 'calendar-day-number' }, day),
          React.createElement('div', null,
            dayMaintenances.map(maintenance => {
              const status = getMaintenanceStatus(maintenance);
              return React.createElement('div', { 
                key: maintenance.id, 
                className: `calendar-maintenance status-${status}` 
              }, maintenance.type);
            })
          )
        )
      );
    }

    return React.createElement('div', { className: 'main-content' },
      React.createElement('div', { className: 'card' },
        React.createElement('h2', { className: 'card-title' },
          React.createElement('span', { className: 'icon icon-calendar' }),
          `Wartungskalender - ${monthNames[currentMonth]} ${currentYear}`
        ),
        React.createElement('div', { className: 'calendar-grid' },
          ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(day =>
            React.createElement('div', { key: day, className: 'calendar-header' }, day)
          ),
          ...days
        )
      )
    );
  };

  const renderCars = () => {
    return React.createElement('div', { className: 'main-content' },
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('h2', { className: 'card-title' },
            React.createElement('span', { className: 'icon icon-car' }),
            'Meine Fahrzeuge'
          ),
          React.createElement('button', {
            onClick: () => setShowAddCar(true),
            className: 'btn btn-primary'
          },
            React.createElement('span', { className: 'icon icon-plus' }),
            'Fahrzeug hinzufügen'
          )
        ),
        React.createElement('div', { className: 'cars-grid' },
          cars.map(car =>
            React.createElement('div', {
              key: car.id,
              className: `car-card ${car.selected ? 'selected' : ''}`,
              onClick: () => selectCar(car.id)
            },
              React.createElement('h3', null, car.model),
              React.createElement('p', null, `Baujahr: ${car.year}`),
              React.createElement('p', null, `Laufleistung: ${car.mileage.toLocaleString()} km`),
              car.selected && React.createElement('p', { className: 'selected-indicator' }, '✓ Ausgewählt')
            )
          )
        )
      ),
      showAddCar && React.createElement('div', { className: 'modal-overlay' },
        React.createElement('div', { className: 'modal' },
          React.createElement('h3', null, 'Neues Fahrzeug hinzufügen'),
          React.createElement('div', { className: 'modal-form' },
            React.createElement('input', {
              type: 'text',
              placeholder: 'Modell (z.B. BMW 320i)',
              value: newCar.model,
              onChange: (e) => setNewCar({...newCar, model: e.target.value}),
              className: 'form-input'
            }),
            React.createElement('input', {
              type: 'number',
              placeholder: 'Baujahr',
              value: newCar.year,
              onChange: (e) => setNewCar({...newCar, year: e.target.value}),
              className: 'form-input'
            }),
            React.createElement('input', {
              type: 'number',
              placeholder: 'Laufleistung (km)',
              value: newCar.mileage,
              onChange: (e) => setNewCar({...newCar, mileage: e.target.value}),
              className: 'form-input'
            })
          ),
          React.createElement('div', { className: 'modal-actions' },
            React.createElement('button', {
              onClick: () => setShowAddCar(false),
              className: 'btn-text'
            }, 'Abbrechen'),
            React.createElement('button', {
              onClick: addCar,
              className: 'btn btn-primary'
            }, 'Hinzufügen')
          )
        )
      )
    );
  };

  const renderMaintenance = () => {
    const carMaintenances = getCarMaintenances();
    
    return React.createElement('div', { className: 'main-content' },
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('h2', { className: 'card-title' },
            React.createElement('span', { className: 'icon icon-wrench' }),
            'Wartungen verwalten'
          ),
          React.createElement('button', {
            onClick: () => setShowAddMaintenance(true),
            className: 'btn btn-primary'
          },
            React.createElement('span', { className: 'icon icon-plus' }),
            'Wartung hinzufügen'
          )
        ),
        React.createElement('div', null,
          carMaintenances.map(maintenance => {
            const status = getMaintenanceStatus(maintenance);
            return React.createElement('div', { 
              key: maintenance.id, 
              className: getStatusClass(status)
            },
              React.createElement('div', { className: 'maintenance-info' },
                React.createElement('h3', null,
                  getStatusIcon(status),
                  maintenance.type
                ),
                React.createElement('p', null, `Letzter Service: ${new Date(maintenance.lastDate).toLocaleDateString('de-DE')}`),
                React.createElement('p', null, `Nächster Service: ${new Date(maintenance.nextDate).toLocaleDateString('de-DE')}`),
                React.createElement('p', null, `Intervall: ${maintenance.interval} ${maintenance.intervalType === 'months' ? 'Monate' : 'Jahre'}`),
                maintenance.mileageInterval && 
                  React.createElement('p', null, `Oder alle ${maintenance.mileageInterval.toLocaleString()} km`)
              ),
              React.createElement('div', { className: 'maintenance-actions' },
                React.createElement('span', { className: 'status-badge' }, getStatusText(status)),
                React.createElement('button', {
                  onClick: () => markAsCompleted(maintenance.id),
                  className: 'btn btn-primary btn-small'
                }, maintenance.