// Auto Wartungs-Manager - Vanilla JavaScript Version
class AutoWartungApp {
    constructor() {
        this.activeTab = 'overview';
        this.currentDate = new Date();
        this.editingCarId = null;
        this.carToDelete = null;
        
        // Initial data
        this.cars = [
            {
                id: 1,
                model: 'BMW 320i',
                year: 2019,
                mileage: 85000,
                selected: true
            }
        ];
        
        this.maintenances = [
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
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.renderContent();
    }
    
    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveTab(e.target.closest('.tab-btn').dataset.tab);
            });
        });
        
        // Modal events
        document.getElementById('saveCarBtn').addEventListener('click', () => this.addCar());
        document.getElementById('saveEditCarBtn').addEventListener('click', () => this.editCar());
        document.getElementById('saveMaintenanceBtn').addEventListener('click', () => this.addMaintenance());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.deleteCar());
        
        // Calendar navigation - will be bound dynamically
    }
    
    setActiveTab(tab) {
        this.activeTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        this.renderContent();
    }
    
    renderContent() {
        const content = document.getElementById('main-content');
        content.innerHTML = '';
        content.className = 'main-content fade-in';
        
        switch (this.activeTab) {
            case 'overview':
                this.renderOverview();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'cars':
                this.renderCars();
                break;
            case 'maintenance':
                this.renderMaintenance();
                break;
        }
    }
    
    renderOverview() {
        const selectedCar = this.getSelectedCar();
        const carMaintenances = this.getCarMaintenances();
        
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="container-fluid">
                <div class="row">
                    <div class="col-12">
                        <div class="card mb-4">
                            <div class="card-header">
                                <h4 class="card-title mb-0">
                                    <i class="bi bi-car-front-fill me-2"></i>
                                    Aktuelles Fahrzeug
                                </h4>
                            </div>
                            <div class="card-body">
                                ${selectedCar ? `
                                    <div class="car-info-box">
                                        <h4>${selectedCar.model}</h4>
                                        <p><strong>Baujahr:</strong> ${selectedCar.year}</p>
                                        <p><strong>Laufleistung:</strong> ${selectedCar.mileage.toLocaleString()} km</p>
                                    </div>
                                ` : `
                                    <div class="alert alert-warning">
                                        <i class="bi bi-exclamation-triangle me-2"></i>
                                        Kein Fahrzeug ausgewählt
                                    </div>
                                `}
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h4 class="card-title mb-0">
                                    <i class="bi bi-tools me-2"></i>
                                    Wartungsübersicht
                                </h4>
                            </div>
                            <div class="card-body">
                                ${carMaintenances.length > 0 ? 
                                    carMaintenances.map(maintenance => this.renderMaintenanceItem(maintenance)).join('') :
                                    '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Keine Wartungen für dieses Fahrzeug</div>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.bindMaintenanceEvents();
    }
    
    renderCalendar() {
        const content = document.getElementById('main-content');
        const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                           'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        
        content.innerHTML = `
            <div class="container-fluid">
                <div class="card">
                    <div class="card-header">
                        <div class="calendar-header">
                            <h4 class="card-title mb-0">
                                <i class="bi bi-calendar3 me-2"></i>
                                Wartungskalender
                            </h4>
                            <div class="calendar-nav">
                                <button class="btn btn-outline-primary btn-sm" id="prevMonth">
                                    <i class="bi bi-chevron-left"></i>
                                </button>
                                <div class="calendar-month-year">
                                    ${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}
                                </div>
                                <button class="btn btn-outline-primary btn-sm" id="nextMonth">
                                    <i class="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        ${this.renderCalendarGrid()}
                    </div>
                </div>
            </div>
        `;
        
        // Bind calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));
    }
    
    renderCalendarGrid() {
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        const carMaintenances = this.getCarMaintenances();
        const maintenancesByDate = {};
        
        carMaintenances.forEach(maintenance => {
            const date = new Date(maintenance.nextDate);
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            if (!maintenancesByDate[dateKey]) maintenancesByDate[dateKey] = [];
            maintenancesByDate[dateKey].push(maintenance);
        });
        
        let html = '<div class="calendar-grid">';
        
        // Header
        ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].forEach(day => {
            html += `<div class="calendar-header-cell">${day}</div>`;
        });
        
        // Previous month days
        const prevMonth = new Date(currentYear, currentMonth - 1, 0);
        const prevMonthDays = prevMonth.getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const dateKey = `${currentYear}-${currentMonth - 1}-${day}`;
            const dayMaintenances = maintenancesByDate[dateKey] || [];
            
            html += `
                <div class="calendar-day other-month">
                    <div class="calendar-day-number">${day}</div>
                    ${dayMaintenances.map(m => `
                        <div class="calendar-maintenance status-${this.getMaintenanceStatus(m)}" 
                             title="${m.type} - ${new Date(m.nextDate).toLocaleDateString('de-DE')}">
                            ${m.type}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Current month days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${currentYear}-${currentMonth}-${day}`;
            const dayMaintenances = maintenancesByDate[dateKey] || [];
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}">
                    <div class="calendar-day-number">${day}</div>
                    ${dayMaintenances.map(m => `
                        <div class="calendar-maintenance status-${this.getMaintenanceStatus(m)}" 
                             title="${m.type} - ${new Date(m.nextDate).toLocaleDateString('de-DE')}">
                            ${m.type}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Next month days
        const totalCells = Math.ceil((startingDay + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - (startingDay + daysInMonth);
        
        for (let day = 1; day <= remainingCells; day++) {
            const dateKey = `${currentYear}-${currentMonth + 1}-${day}`;
            const dayMaintenances = maintenancesByDate[dateKey] || [];
            
            html += `
                <div class="calendar-day other-month">
                    <div class="calendar-day-number">${day}</div>
                    ${dayMaintenances.map(m => `
                        <div class="calendar-maintenance status-${this.getMaintenanceStatus(m)}" 
                             title="${m.type} - ${new Date(m.nextDate).toLocaleDateString('de-DE')}">
                            ${m.type}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    renderCars() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="container-fluid">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h4 class="card-title mb-0">
                            <i class="bi bi-car-front-fill me-2"></i>
                            Meine Fahrzeuge
                        </h4>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addCarModal">
                            <i class="bi bi-plus-lg me-2"></i>
                            Fahrzeug hinzufügen
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            ${this.cars.map(car => `
                                <div class="col-md-6 col-lg-4 mb-3">
                                    <div class="card car-card ${car.selected ? 'selected' : ''}" 
                                         onclick="app.selectCar(${car.id})">
                                        <div class="card-body">
                                            ${car.selected ? '<span class="selected-badge"><i class="bi bi-check-lg"></i> Ausgewählt</span>' : ''}
                                            <h5 class="card-title">${car.model}</h5>
                                            <p class="card-text text-muted mb-1">
                                                <strong>Baujahr:</strong> ${car.year}
                                            </p>
                                            <p class="card-text text-muted">
                                                <strong>Laufleistung:</strong> ${car.mileage.toLocaleString()} km
                                            </p>
                                            <div class="car-actions">
                                                <button class="btn btn-icon btn-edit" 
                                                        onclick="event.stopPropagation(); app.startEditCar(${car.id})"
                                                        title="Bearbeiten">
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                                <button class="btn btn-icon btn-delete" 
                                                        onclick="event.stopPropagation(); app.startDeleteCar(${car.id})"
                                                        title="Löschen">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMaintenance() {
        const carMaintenances = this.getCarMaintenances();
        const selectedCar = this.getSelectedCar();
        
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="container-fluid">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h4 class="card-title mb-0">
                            <i class="bi bi-tools me-2"></i>
                            Wartungen verwalten
                        </h4>
                        <button class="btn btn-primary" onclick="app.showAddMaintenanceModal()">
                            <i class="bi bi-plus-lg me-2"></i>
                            Wartung hinzufügen
                        </button>
                    </div>
                    <div class="card-body">
                        ${carMaintenances.length > 0 ? 
                            carMaintenances.map(maintenance => this.renderMaintenanceItem(maintenance, true)).join('') :
                            '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Keine Wartungen für dieses Fahrzeug</div>'
                        }
                    </div>
                </div>
            </div>
        `;
        
        this.bindMaintenanceEvents();
    }
    
    renderMaintenanceItem(maintenance, detailed = false) {
        const status = this.getMaintenanceStatus(maintenance);
        const statusText = this.getStatusText(status);
        const statusIcon = this.getStatusIcon(status);
        
        return `
            <div class="card maintenance-card status-${status} mb-3">
                <div class="maintenance-item">
                    <div class="maintenance-info">
                        <h5>
                            <i class="bi ${statusIcon} me-2"></i>
                            ${maintenance.type}
                        </h5>
                        <small>Letzter Service: ${new Date(maintenance.lastDate).toLocaleDateString('de-DE')}</small>
                        <small>Nächster Service: ${new Date(maintenance.nextDate).toLocaleDateString('de-DE')}</small>
                        ${detailed ? `
                            <small>Intervall: ${maintenance.interval} ${maintenance.intervalType === 'months' ? 'Monate' : 'Jahre'}</small>
                            ${maintenance.mileageInterval ? `<small>Oder alle ${maintenance.mileageInterval.toLocaleString()} km</small>` : ''}
                        ` : ''}
                    </div>
                    <div class="maintenance-actions">
                        <span class="badge status-badge status-${status}">${statusText}</span>
                        <button class="btn btn-sm btn-primary" onclick="app.toggleMaintenanceCompleted(${maintenance.id})">
                            ${maintenance.completed ? 'Rückgängig' : 'Erledigt'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Utility methods
    getSelectedCar() {
        return this.cars.find(car => car.selected);
    }
    
    getCarMaintenances() {
        const selectedCar = this.getSelectedCar();
        return selectedCar ? this.maintenances.filter(m => m.carId === selectedCar.id) : [];
    }
    
    getMaintenanceStatus(maintenance) {
        const today = new Date();
        const nextDate = new Date(maintenance.nextDate);
        const diffTime = nextDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (maintenance.completed) return 'completed';
        if (diffDays < 0) return 'overdue';
        if (diffDays <= 30) return 'due-soon';
        return 'ok';
    }
    
    getStatusText(status) {
        switch (status) {
            case 'completed': return 'Erledigt';
            case 'overdue': return 'Überfällig';
            case 'due-soon': return 'Steht bald an';
            default: return 'OK';
        }
    }
    
    getStatusIcon(status) {
        switch (status) {
            case 'completed': return 'bi-check-circle-fill';
            case 'overdue': return 'bi-exclamation-triangle-fill';
            case 'due-soon': return 'bi-clock-fill';
            default: return 'bi-check-circle';
        }
    }
    
    // Event handlers
    bindMaintenanceEvents() {
        // Events are bound via onclick attributes in the HTML
    }
    
    // Car management
    addCar() {
        const model = document.getElementById('carModel').value.trim();
        const year = parseInt(document.getElementById('carYear').value);
        const mileage = parseInt(document.getElementById('carMileage').value);
        
        if (model && year && mileage) {
            const car = {
                id: Date.now(),
                model: model,
                year: year,
                mileage: mileage,
                selected: this.cars.length === 0
            };
            
            this.cars.push(car);
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCarModal'));
            modal.hide();
            document.getElementById('addCarForm').reset();
            
            this.renderContent();
        }
    }
    
    startEditCar(carId) {
        const car = this.cars.find(c => c.id === carId);
        if (car) {
            this.editingCarId = carId;
            document.getElementById('editCarModel').value = car.model;
            document.getElementById('editCarYear').value = car.year;
            document.getElementById('editCarMileage').value = car.mileage;
            
            const modal = new bootstrap.Modal(document.getElementById('editCarModal'));
            modal.show();
        }
    }
    
    editCar() {
        const model = document.getElementById('editCarModel').value.trim();
        const year = parseInt(document.getElementById('editCarYear').value);
        const mileage = parseInt(document.getElementById('editCarMileage').value);
        
        if (model && year && mileage && this.editingCarId) {
            const carIndex = this.cars.findIndex(c => c.id === this.editingCarId);
            if (carIndex !== -1) {
                this.cars[carIndex] = {
                    ...this.cars[carIndex],
                    model: model,
                    year: year,
                    mileage: mileage
                };
                
                // Close modal and reset
                const modal = bootstrap.Modal.getInstance(document.getElementById('editCarModal'));
                modal.hide();
                this.editingCarId = null;
                
                this.renderContent();
            }
        }
    }
    
    startDeleteCar(carId) {
        const car = this.cars.find(c => c.id === carId);
        if (car) {
            this.carToDelete = carId;
            document.getElementById('deleteCarText').textContent = 
                `Möchten Sie das Fahrzeug "${car.model}" wirklich löschen?`;
            
            const modal = new bootstrap.Modal(document.getElementById('deleteCarModal'));
            modal.show();
        }
    }
    
    deleteCar() {
        if (this.carToDelete) {
            // Remove car and its maintenances
            this.maintenances = this.maintenances.filter(m => m.carId !== this.carToDelete);
            const remainingCars = this.cars.filter(car => car.id !== this.carToDelete);
            
            // If deleted car was selected, select the first remaining car
            const deletedCar = this.cars.find(car => car.id === this.carToDelete);
            if (deletedCar && deletedCar.selected && remainingCars.length > 0) {
                remainingCars[0].selected = true;
            }
            
            this.cars = remainingCars;
            
            // Close modal and reset
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteCarModal'));
            modal.hide();
            this.carToDelete = null;
            
            this.renderContent();
        }
    }
    
    selectCar(carId) {
        this.cars = this.cars.map(car => ({
            ...car,
            selected: car.id === carId
        }));
        this.renderContent();
    }
    
    // Maintenance management
    showAddMaintenanceModal() {
        const selectedCar = this.getSelectedCar();
        if (selectedCar) {
            document.getElementById('selectedCarInfo').textContent = `Für: ${selectedCar.model}`;
            const modal = new bootstrap.Modal(document.getElementById('addMaintenanceModal'));
            modal.show();
        } else {
            alert('Bitte wählen Sie zuerst ein Fahrzeug aus.');
        }
    }
    
    addMaintenance() {
        const selectedCar = this.getSelectedCar();
        const type = document.getElementById('maintenanceType').value.trim();
        const lastDate = document.getElementById('lastDate').value;
        const interval = parseInt(document.getElementById('interval').value);
        const intervalType = document.getElementById('intervalType').value;
        const mileageInterval = document.getElementById('mileageInterval').value;
        
        if (type && lastDate && interval && selectedCar) {
            const lastDateObj = new Date(lastDate);
            const nextDate = new Date(lastDateObj);
            
            if (intervalType === 'months') {
                nextDate.setMonth(nextDate.getMonth() + interval);
            } else {
                nextDate.setFullYear(nextDate.getFullYear() + interval);
            }
            
            const maintenance = {
                id: Date.now(),
                carId: selectedCar.id,
                type: type,
                lastDate: lastDate,
                nextDate: nextDate.toISOString().split('T')[0],
                interval: interval,
                intervalType: intervalType,
                mileageInterval: mileageInterval ? parseInt(mileageInterval) : null,
                completed: false
            };
            
            this.maintenances.push(maintenance);
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMaintenanceModal'));
            modal.hide();
            document.getElementById('addMaintenanceForm').reset();
            
            this.renderContent();
        }
    }
    
    toggleMaintenanceCompleted(maintenanceId) {
        const maintenanceIndex = this.maintenances.findIndex(m => m.id === maintenanceId);
        if (maintenanceIndex !== -1) {
            this.maintenances[maintenanceIndex].completed = !this.maintenances[maintenanceIndex].completed;
            this.renderContent();
        }
    }
    
    // Calendar navigation
    navigateMonth(direction) {
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        this.currentDate = newDate;
        this.renderContent();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new AutoWartungApp();
});