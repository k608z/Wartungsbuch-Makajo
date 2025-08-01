// Auto Wartungs-Manager - Vanilla JavaScript Version mit Dark Mode und Google Maps
class AutoWartungApp {
    constructor() {
        this.activeTab = 'overview';
        this.currentDate = new Date();
        this.editingCarId = null;
        this.carToDelete = null;
        this.completingMaintenanceId = null;
        this.isDarkMode = false;
        
        // Maps related properties
        this.map = null;
        this.userLocation = null;
        this.workshopsMarkers = [];
        this.userMarker = null;
        this.placesService = null;
        this.searchRadius = 5000; // 5km default
        this.currentWorkshops = [];
        
        // Wartungstyp-Vorschläge
        this.maintenancePresets = [
            { type: 'Ölwechsel', icon: 'bi-droplet-fill', interval: 6, intervalType: 'months', mileageInterval: 10000 },
            { type: 'TÜV', icon: 'bi-shield-check', interval: 24, intervalType: 'months' },
            { type: 'AU (Abgas)', icon: 'bi-cloud-haze2', interval: 24, intervalType: 'months' },
            { type: 'Inspektion', icon: 'bi-tools', interval: 12, intervalType: 'months', mileageInterval: 15000 },
            { type: 'Reifen wechseln', icon: 'bi-circle', interval: 6, intervalType: 'months' },
            { type: 'Bremsflüssigkeit', icon: 'bi-droplet-half', interval: 24, intervalType: 'months' },
            { type: 'Kühlmittel', icon: 'bi-thermometer-snow', interval: 36, intervalType: 'months' },
            { type: 'Luftfilter', icon: 'bi-wind', interval: 12, intervalType: 'months', mileageInterval: 20000 },
            { type: 'Zündkerzen', icon: 'bi-lightning', interval: 24, intervalType: 'months', mileageInterval: 30000 },
            { type: 'Batteriecheck', icon: 'bi-battery', interval: 12, intervalType: 'months' },
            { type: 'Bremsen prüfen', icon: 'bi-disc', interval: 12, intervalType: 'months' },
            { type: 'Keilriemen', icon: 'bi-arrow-repeat', interval: 36, intervalType: 'months' },
            // NEUE EINTRÄGE FÜR VERSCHLEISSTEILE
            { type: 'Bremsbeläge prüfen', icon: 'bi-shield-fill-exclamation', mileageInterval: 25000 },
            { type: 'Bremsscheiben prüfen', icon: 'bi-disc-fill', mileageInterval: 50000 },
            { type: 'Traggelenke prüfen', icon: 'bi-gear-wide-connected', mileageInterval: 80000 },
            { type: 'Reifen prüfen', icon: 'bi-tire-fill', mileageInterval: 40000 }
        ];
        
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
        this.loadDarkModePreference();
        this.bindEvents();
        this.renderContent();
    }
    
    // Dark Mode Management
    loadDarkModePreference() {
        // In memory storage since localStorage is not available
        this.isDarkMode = false; // Default to light mode
        this.updateDarkMode();
    }
    
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        this.updateDarkMode();
    }
    
    updateDarkMode() {
        const body = document.body;
        const icon = document.getElementById('darkModeIcon');
        
        if (this.isDarkMode) {
            body.classList.add('dark-mode');
            if (icon) icon.className = 'bi bi-sun-fill';
        } else {
            body.classList.remove('dark-mode');
            if (icon) icon.className = 'bi bi-moon-fill';
        }
    }
    
    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveTab(e.target.closest('.tab-btn').dataset.tab);
            });
        });
        
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }
        
        // Modal events - bind safely
        const saveCarBtn = document.getElementById('saveCarBtn');
        if (saveCarBtn) {
            saveCarBtn.addEventListener('click', () => this.addCar());
        }
        
        const saveEditCarBtn = document.getElementById('saveEditCarBtn');
        if (saveEditCarBtn) {
            saveEditCarBtn.addEventListener('click', () => this.editCar());
        }
        
        const saveMaintenanceBtn = document.getElementById('saveMaintenanceBtn');
        if (saveMaintenanceBtn) {
            saveMaintenanceBtn.addEventListener('click', () => this.addMaintenance());
        }
        
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.deleteCar());
        }
        
        const confirmCompleteBtn = document.getElementById('confirmCompleteBtn');
        if (confirmCompleteBtn) {
            confirmCompleteBtn.addEventListener('click', () => this.confirmCompleteMaintenance());
        }
    }
    
    bindMaintenanceTypeEvents() {
        const typeInput = document.getElementById('maintenanceType');
        const suggestionsDiv = document.getElementById('maintenanceSuggestions');
        const presetsDiv = document.getElementById('maintenancePresets');
        
        // Check if elements exist before binding events
        if (!typeInput || !suggestionsDiv || !presetsDiv) {
            return;
        }
        
        // Render preset buttons
        this.renderMaintenancePresets();
        
        // Remove existing event listeners to prevent duplicates
        typeInput.removeEventListener('input', this.handleTypeInput);
        typeInput.removeEventListener('focus', this.handleTypeFocus);
        
        // Bind new event listeners
        this.handleTypeInput = (e) => {
            const value = e.target.value.toLowerCase();
            if (value.length > 0) {
                const filtered = this.maintenancePresets.filter(preset => 
                    preset.type.toLowerCase().includes(value)
                );
                this.showSuggestions(filtered);
            } else {
                this.hideSuggestions();
            }
        };
        
        this.handleTypeFocus = () => {
            if (typeInput.value.length > 0) {
                const filtered = this.maintenancePresets.filter(preset => 
                    preset.type.toLowerCase().includes(typeInput.value.toLowerCase())
                );
                this.showSuggestions(filtered);
            }
        };
        
        typeInput.addEventListener('input', this.handleTypeInput);
        typeInput.addEventListener('focus', this.handleTypeFocus);
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.position-relative')) {
                this.hideSuggestions();
            }
        });
    }
    
    renderMaintenancePresets() {
        const presetsDiv = document.getElementById('maintenancePresets');
        if (!presetsDiv) return;
        
        // Filter out presets without mileageInterval for the main suggestions
        const mileagePresets = this.maintenancePresets.filter(p => p.mileageInterval);

        presetsDiv.innerHTML = mileagePresets.slice(0, 6).map(preset => `
            <button type="button" class="btn btn-outline-secondary btn-sm preset-btn" 
                    onclick="app.selectMaintenancePreset('${preset.type}', ${preset.interval || 'null'}, '${preset.intervalType || 'null'}', ${preset.mileageInterval || 'null'})">
                <i class="${preset.icon} me-1"></i>
                ${preset.type}
            </button>
        `).join('');
    }
    
    selectMaintenancePreset(type, interval, intervalType, mileageInterval) {
        document.getElementById('maintenanceType').value = type;
        if (interval !== 'null') document.getElementById('interval').value = interval;
        if (intervalType !== 'null') document.getElementById('intervalType').value = intervalType;
        if (mileageInterval !== 'null') document.getElementById('mileageInterval').value = mileageInterval;
        this.hideSuggestions();
    }
    
    showSuggestions(suggestions) {
        const suggestionsDiv = document.getElementById('maintenanceSuggestions');
        if (!suggestionsDiv) return;
        
        if (suggestions.length > 0) {
            suggestionsDiv.innerHTML = suggestions.map(preset => `
                <button type="button" class="suggestion-item" 
                        onclick="app.selectMaintenancePreset('${preset.type}', ${preset.interval || 'null'}, '${preset.intervalType || 'null'}', ${preset.mileageInterval || 'null'})">
                    <i class="${preset.icon} me-2"></i>
                    ${preset.type}
                </button>
            `).join('');
            suggestionsDiv.style.display = 'block';
        } else {
            this.hideSuggestions();
        }
    }
    
    hideSuggestions() {
        const suggestionsDiv = document.getElementById('maintenanceSuggestions');
        if (suggestionsDiv) {
            suggestionsDiv.style.display = 'none';
        }
    }
    
    setActiveTab(tab) {
        this.activeTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        this.renderContent();
        
        // Initialize maps if maps tab is selected
        if (tab === 'maps') {
            setTimeout(() => {
                this.initializeMapsTab();
            }, 100);
        }
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
            case 'maps':
                this.renderMaps();
                break;
        }
    }
    
    renderOverview() {
        const selectedCar = this.getSelectedCar();
        let carMaintenances = [];

        if (selectedCar) {
            carMaintenances = this.getCarMaintenances();
            
            // Filter out completed recommended maintenances
            carMaintenances = carMaintenances.filter(m => m.status !== 'recommended' || !m.completed);
        }
        
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="container-fluid">
                <div class="row">
                    <div class="col-12">
                        ${this.cars.length > 1 ? this.renderCarSelector() : ''}
                        
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
    
    renderCarSelector() {
        return `
            <div class="car-selector mb-4">
                <div class="dropdown">
                    <button class="btn btn-outline-primary dropdown-toggle car-selector-dropdown" type="button" 
                            data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-car-front me-2"></i>
                        ${this.getSelectedCar()?.model || 'Fahrzeug auswählen'}
                    </button>
                    <ul class="dropdown-menu">
                        ${this.cars.map(car => `
                            <li>
                                <button class="car-option ${car.selected ? 'active' : ''}" 
                                        onclick="app.selectCar(${car.id})">
                                    <i class="bi ${car.selected ? 'bi-check-circle-fill' : 'bi-circle'} me-2"></i>
                                    <div>
                                        <div><strong>${car.model}</strong></div>
                                        <small class="text-muted">${car.year} • ${car.mileage.toLocaleString()} km</small>
                                    </div>
                                </button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
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
        
        const carMaintenances = this.getCarMaintenances().filter(m => m.status !== 'recommended');
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
                                                <strong>Laufleistung:</strong> ${car.mileage.toLocaleString()} km</p>
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
        const carMaintenances = this.getCarMaintenances().filter(m => m.status !== 'recommended');
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
    
    renderMaps() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="container-fluid">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title mb-0">
                            <i class="bi bi-geo-alt-fill me-2"></i>
                            Werkstätten in der Nähe
                        </h4>
                    </div>
                    <div class="card-body">
                        <div class="maps-controls">
                            <div class="search-radius-control">
                                <label for="searchRadius">Suchradius:</label>
                                <select class="form-select" id="searchRadius" onchange="app.changeSearchRadius(this.value)">
                                    <option value="2000">2 km</option>
                                    <option value="5000" selected>5 km</option>
                                    <option value="10000">10 km</option>
                                    <option value="20000">20 km</option>
                                    <option value="50000">50 km</option>
                                </select>
                            </div>
                            <div class="location-status loading" id="locationStatus">
                                <i class="bi bi-geo-alt"></i>
                                <span>Standort wird ermittelt...</span>
                            </div>
                        </div>
                        
                        <div class="maps-container">
                            <div id="map" class="maps-loading">
                                <div class="loading-spinner"></div>
                                <p>Karte wird geladen...</p>
                            </div>
                        </div>
                        
                        <div class="workshop-list" id="workshopsList" style="display: none;">
                            </div>
                    </div>
                </div>
            </div>
        `;
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
                            ${maintenance.status === 'recommended' ? '<span class="badge bg-warning text-dark ms-2">Empfohlen</span>' : ''}
                        </h5>
                        <small>Letzter Service: ${maintenance.lastDate ? new Date(maintenance.lastDate).toLocaleDateString('de-DE') : 'Unbekannt'}</small>
                        <small>Nächster Service: ${maintenance.nextDate ? new Date(maintenance.nextDate).toLocaleDateString('de-DE') : 'N/A'}</small>
                        ${detailed && maintenance.interval ? `
                            <small>Intervall: ${maintenance.interval} ${maintenance.intervalType === 'months' ? 'Monate' : 'Jahre'}</small>
                        ` : ''}
                        ${detailed && maintenance.mileageInterval ? `<small>Oder alle ${maintenance.mileageInterval.toLocaleString()} km</small>` : ''}
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
        if (maintenance.completed) return 'completed';
        if (maintenance.status === 'recommended') return 'recommended';

        const today = new Date();
        const nextDate = new Date(maintenance.nextDate);
        const diffTime = nextDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'overdue';
        if (diffDays <= 30) return 'due-soon';
        return 'ok';
    }
    
    getStatusText(status) {
        switch (status) {
            case 'completed': return 'Erledigt';
            case 'overdue': return 'Überfällig';
            case 'due-soon': return 'Steht bald an';
            case 'recommended': return 'Empfohlen';
            default: return 'OK';
        }
    }
    
    getStatusIcon(status) {
        switch (status) {
            case 'completed': return 'bi-check-circle-fill';
            case 'overdue': return 'bi-exclamation-triangle-fill';
            case 'due-soon': return 'bi-clock-fill';
            case 'recommended': return 'bi-lightbulb-fill';
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
            
            // NEUE LOGIK: Wartungsempfehlungen basierend auf der Laufleistung hinzufügen
            const today = new Date();
            this.maintenancePresets.forEach(preset => {
                if (preset.mileageInterval && mileage >= preset.mileageInterval) {
                    const existingMaintenance = this.maintenances.find(m => 
                        m.carId === car.id && m.type === preset.type
                    );
                    if (!existingMaintenance) {
                        const newMaintenance = {
                            id: Date.now() + Math.random(), // Unique ID
                            carId: car.id,
                            type: preset.type,
                            lastDate: null,
                            nextDate: today.toISOString().split('T')[0],
                            interval: preset.interval,
                            intervalType: preset.intervalType,
                            mileageInterval: preset.mileageInterval,
                            completed: false,
                            status: 'recommended'
                        };
                        this.maintenances.push(newMaintenance);
                    }
                }
            });
            
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
            
            // Re-bind events after modal is shown
            setTimeout(() => {
                this.bindMaintenanceTypeEvents();
            }, 100);
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
                completed: false,
                status: null
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
        const maintenance = this.maintenances.find(m => m.id === maintenanceId);
        if (maintenance) {
            if (maintenance.completed) {
                // Einfach rückgängig machen
                maintenance.completed = false;
                this.renderContent();
            } else {
                // Wartung als erledigt markieren mit Abfrage
                this.showCompleteMaintenanceModal(maintenanceId);
            }
        }
    }
    
    showCompleteMaintenanceModal(maintenanceId) {
        const maintenance = this.maintenances.find(m => m.id === maintenanceId);
        if (maintenance) {
            this.completingMaintenanceId = maintenanceId;
            
            // Calculate next maintenance date
            const today = new Date();
            const nextDate = new Date(today);
            
            if (maintenance.intervalType === 'months') {
                nextDate.setMonth(nextDate.getMonth() + maintenance.interval);
            } else {
                nextDate.setFullYear(nextDate.getFullYear() + maintenance.interval);
            }
            
            document.getElementById('completeMaintenanceText').textContent = 
                `Wartung "${maintenance.type}" als erledigt markieren?`;
            
            // Hide the next maintenance date field for recommended status
            const newMaintenanceDateDiv = document.getElementById('newMaintenanceDate');
            if (maintenance.status === 'recommended') {
                newMaintenanceDateDiv.style.display = 'none';
                document.getElementById('createNewMaintenance').checked = false;
            } else {
                newMaintenanceDateDiv.style.display = 'block';
                document.getElementById('createNewMaintenance').checked = true;
                document.getElementById('nextMaintenanceDate').value = nextDate.toISOString().split('T')[0];
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('completeMaintenanceModal'));
            modal.show();
            
            // Bind checkbox event for this specific modal instance
            const checkbox = document.getElementById('createNewMaintenance');
            
            // Remove existing event listener if any
            checkbox.removeEventListener('change', this.handleCheckboxChange);
            
            // Create new event handler
            this.handleCheckboxChange = function() {
                newMaintenanceDateDiv.style.display = this.checked ? 'block' : 'none';
            };
            
            // Bind the event
            checkbox.addEventListener('change', this.handleCheckboxChange);
        }
    }
    
    confirmCompleteMaintenance() {
        if (this.completingMaintenanceId) {
            const maintenance = this.maintenances.find(m => m.id === this.completingMaintenanceId);
            const createNew = document.getElementById('createNewMaintenance').checked;
            const nextDate = document.getElementById('nextMaintenanceDate').value;
            
            if (maintenance) {
                // Mark current maintenance as completed
                maintenance.completed = true;
                
                // Create new maintenance if requested and if not a recommended maintenance
                if (createNew && nextDate && maintenance.status !== 'recommended') {
                    const newMaintenance = {
                        id: Date.now(),
                        carId: maintenance.carId,
                        type: maintenance.type,
                        lastDate: new Date().toISOString().split('T')[0],
                        nextDate: nextDate,
                        interval: maintenance.interval,
                        intervalType: maintenance.intervalType,
                        mileageInterval: maintenance.mileageInterval,
                        completed: false,
                        status: null
                    };
                    
                    this.maintenances.push(newMaintenance);
                }
                
                // Close modal and reset
                const modal = bootstrap.Modal.getInstance(document.getElementById('completeMaintenanceModal'));
                modal.hide();
                this.completingMaintenanceId = null;
                
                // Reset form
                document.getElementById('createNewMaintenance').checked = true;
                document.getElementById('nextMaintenanceDate').value = '';
                
                this.renderContent();
            }
        }
    }
    
    // Calendar navigation
    navigateMonth(direction) {
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        this.currentDate = newDate;
        this.renderContent();
    }
    
    // Google Maps Integration
    initializeMapsTab() {
        if (typeof google === 'undefined') {
            this.showMapsError('Google Maps API nicht verfügbar. Bitte überprüfen Sie Ihren API-Key.');
            return;
        }
        
        this.getCurrentLocation();
    }
    
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showLocationError('Geolocation wird von diesem Browser nicht unterstützt.');
            return;
        }
        
        this.updateLocationStatus('loading', 'Standort wird ermittelt...');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                this.updateLocationStatus('success', 'Standort ermittelt');
                this.initializeMap();
            },
            (error) => {
                let errorMessage = 'Standort konnte nicht ermittelt werden.';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Standortzugriff wurde verweigert.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Standortinformationen nicht verfügbar.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Zeitüberschreitung bei Standortermittlung.';
                        break;
                }
                this.showLocationError(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    }
    
    initializeMap() {
        if (!this.userLocation) return;
        
        const mapElement = document.getElementById('map');
        if (!mapElement) return;
        
        // Remove loading content
        mapElement.innerHTML = '';
        
        // Initialize map
        this.map = new google.maps.Map(mapElement, {
            center: this.userLocation,
            zoom: 13,
            styles: this.isDarkMode ? this.getDarkMapStyles() : []
        });
        
        // Add user location marker
        this.userMarker = new google.maps.Marker({
            position: this.userLocation,
            map: this.map,
            title: 'Ihr Standort',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="%230d6efd" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8"/><circle cx="8" cy="8" r="4" fill="white"/></svg>',
                scaledSize: new google.maps.Size(24, 24)
            }
        });
        
        // Initialize Places service
        this.placesService = new google.maps.places.PlacesService(this.map);
        
        // Search for workshops
        this.searchWorkshops();
    }
    
    searchWorkshops() {
        if (!this.placesService || !this.userLocation) return;
        
        const request = {
            location: this.userLocation,
            radius: this.searchRadius,
            type: 'car_repair',
            keyword: 'autowerkstatt'
        };
        
        this.placesService.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                this.displayWorkshops(results);
            } else {
                console.error('Places search failed:', status);
                this.showMapsError('Fehler beim Suchen von Werkstätten.');
            }
        });
    }
    
    displayWorkshops(workshops) {
        // Clear existing markers
        this.workshopsMarkers.forEach(marker => marker.setMap(null));
        this.workshopsMarkers = [];
        this.currentWorkshops = workshops;
        
        // Add workshop markers
        workshops.forEach((workshop, index) => {
            const marker = new google.maps.Marker({
                position: workshop.geometry.location,
                map: this.map,
                title: workshop.name,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="%23dc3545" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/><circle cx="8" cy="6" r="2" fill="white"/></svg>',
                    scaledSize: new google.maps.Size(32, 32)
                }
            });
            
            // Add click listener for marker
            marker.addListener('click', () => {
                this.showWorkshopDetails(workshop);
            });
            
            this.workshopsMarkers.push(marker);
        });
        
        // Show workshop list
        this.renderWorkshopsList(workshops);
    }
    
    renderWorkshopsList(workshops) {
        const workshopsList = document.getElementById('workshopsList');
        if (!workshopsList) return;
        
        if (workshops.length === 0) {
            workshopsList.innerHTML = '<div class="p-3 text-center text-muted">Keine Werkstätten in der Nähe gefunden.</div>';
            workshopsList.style.display = 'block';
            return;
        }
        
        // Sort by distance
        const sortedWorkshops = workshops.map(workshop => {
            const distance = this.calculateDistance(
                this.userLocation.lat, this.userLocation.lng,
                workshop.geometry.location.lat(), workshop.geometry.location.lng()
            );
            return { ...workshop, distance };
        }).sort((a, b) => a.distance - b.distance);
        
        workshopsList.innerHTML = sortedWorkshops.map(workshop => `
            <div class="workshop-item" onclick="app.showWorkshopDetails(${JSON.stringify(workshop).replace(/"/g, '"')})">
                <div class="workshop-info">
                    <h6>${workshop.name}</h6>
                    <p><i class="bi bi-geo-alt me-1"></i>${workshop.vicinity}</p>
                    ${workshop.rating ? `
                        <div class="workshop-rating">
                            <span class="stars">${'★'.repeat(Math.floor(workshop.rating))}${'☆'.repeat(5 - Math.floor(workshop.rating))}</span>
                            <span class="rating-text">${workshop.rating} (${workshop.user_ratings_total || 0} Bewertungen)</span>
                        </div>
                    ` : ''}
                </div>
                <div class="workshop-distance">
                    ${workshop.distance.toFixed(1)} km
                </div>
            </div>
        `).join('');
        
        workshopsList.style.display = 'block';
    }
    
    showWorkshopDetails(workshop) {
        const modal = new bootstrap.Modal(document.getElementById('workshopModal'));
        const title = document.getElementById('workshopModalTitle');
        const body = document.getElementById('workshopModalBody');
        
        title.textContent = workshop.name;
        
        // Get additional details if available
        this.placesService.getDetails({
            placeId: workshop.place_id,
            fields: ['name', 'rating', 'formatted_phone_number', 'opening_hours', 'website', 'photos', 'reviews']
        }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                this.renderWorkshopModalContent(body, { ...workshop, ...place });
            } else {
                this.renderWorkshopModalContent(body, workshop);
            }
        });
        
        // Bind directions button
        const directionsBtn = document.getElementById('getDirectionsBtn');
        directionsBtn.onclick = () => {
            this.openDirections(workshop);
        };
        
        modal.show();
    }
    
    renderWorkshopModalContent(body, workshop) {
        const distance = this.calculateDistance(
            this.userLocation.lat, this.userLocation.lng,
            workshop.geometry.location.lat(), workshop.geometry.location.lng()
        );
        
        body.innerHTML = `
            <div class="workshop-modal-header">
                <i class="bi bi-tools me-2"></i>
                <span>${workshop.name}</span>
            </div>
            
            ${workshop.rating ? `
                <div class="workshop-modal-rating">
                    <span class="stars">${'★'.repeat(Math.floor(workshop.rating))}${'☆'.repeat(5 - Math.floor(workshop.rating))}</span>
                    <span>${workshop.rating} von 5 Sternen (${workshop.user_ratings_total || 0} Bewertungen)</span>
                </div>
            ` : ''}
            
            <div class="workshop-modal-info">
                <div class="workshop-modal-info-item">
                    <i class="bi bi-geo-alt me-2"></i>
                    <span>${workshop.vicinity}</span>
                </div>
                <div class="workshop-modal-info-item">
                    <i class="bi bi-arrow-right me-2"></i>
                    <span>${distance.toFixed(1)} km entfernt</span>
                </div>
                ${workshop.formatted_phone_number ? `
                    <div class="workshop-modal-info-item">
                        <i class="bi bi-telephone me-2"></i>
                        <a href="tel:${workshop.formatted_phone_number}">${workshop.formatted_phone_number}</a>
                    </div>
                ` : ''}
                ${workshop.website ? `
                    <div class="workshop-modal-info-item">
                        <i class="bi bi-globe me-2"></i>
                        <a href="${workshop.website}" target="_blank">Website besuchen</a>
                    </div>
                ` : ''}
            </div>
            
            ${workshop.opening_hours && workshop.opening_hours.weekday_text ? `
                <h6>Öffnungszeiten:</h6>
                <ul class="list-unstyled">
                    ${workshop.opening_hours.weekday_text.map(day => `<li><small>${day}</small></li>`).join('')}
                </ul>
            ` : ''}
            
            ${workshop.photos && workshop.photos.length > 0 ? `
                <h6>Fotos:</h6>
                <div class="workshop-photos">
                    ${workshop.photos.slice(0, 4).map(photo => `
                        <img src="${photo.getUrl({maxWidth: 100, maxHeight: 100})}" 
                             class="workshop-photo" 
                             onclick="window.open('${photo.getUrl({maxWidth: 800, maxHeight: 600})}', '_blank')">
                    `).join('')}
                </div>
            ` : ''}
        `;
    }
    
    openDirections(workshop) {
        const destination = `${workshop.geometry.location.lat()},${workshop.geometry.location.lng()}`;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        window.open(url, '_blank');
    }
    
    changeSearchRadius(radius) {
        this.searchRadius = parseInt(radius);
        if (this.placesService && this.userLocation) {
            this.searchWorkshops();
        }
    }
    
    updateLocationStatus(type, message) {
        const statusElement = document.getElementById('locationStatus');
        if (statusElement) {
            statusElement.className = `location-status ${type}`;
            statusElement.innerHTML = `
                <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-exclamation-triangle' : 'bi-geo-alt'}"></i>
                <span>${message}</span>
            `;
        }
    }
    
    showLocationError(message) {
        this.updateLocationStatus('error', message);
        // Try to use default location (Germany center) as fallback
        this.userLocation = { lat: 51.1657, lng: 10.4515 }; // Germany center
        this.initializeMap();
    }
    
    showMapsError(message) {
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = `
                <div class="maps-error">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h5>Fehler beim Laden der Karte</h5>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    getDarkMapStyles() {
        return [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
            },
            {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#263c3f' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#6b9a76' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#38414e' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#212a37' }]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#9ca5b3' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{ color: '#746855' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#1f2835' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#f3d19c' }]
            },
            {
                featureType: 'transit',
                elementType: 'geometry',
                stylers: [{ color: '#2f3948' }]
            },
            {
                featureType: 'transit.station',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#17263c' }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#515c6d' }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#17263c' }]
            }
        ];
    }
}

// Global function for Google Maps callback
function initMap() {
    // This function is called when Google Maps API is loaded
    // The actual initialization happens in the initializeMapsTab method
    console.log('Google Maps API loaded');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new AutoWartungApp();
});