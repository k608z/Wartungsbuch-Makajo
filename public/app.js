// Auto Wartungs-Manager - Mit MySQL Backend
class AutoWartungApp {
    constructor() {
        this.activeTab = 'overview';
        this.currentDate = new Date();
        this.editingCarId = null;
        this.editingMaintenanceId = null;
        this.carToDelete = null;
        this.completingMaintenanceId = null;
        this.isDarkMode = false;
        
        // API Base URL
        this.API_BASE = 'http://localhost:3000/api';
        
        // Maps related properties
        this.map = null;
        this.userLocation = null;
        this.workshopsMarkers = [];
        this.userMarker = null;
        this.placesService = null;
        this.searchRadius = 5000;
        this.currentWorkshops = [];
        this.searchCircle = null;
        
        // Daten aus der Datenbank
        this.cars = [];
        this.maintenances = [];
        
        // Wartungstyp-Vorschläge (bleiben gleich)
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
            { type: 'Keilriemen', icon: 'bi-arrow-repeat', interval: 36, intervalType: 'months' }
        ];
        
        this.init();
    }
    
    async init() {
        this.loadDarkModePreference();
        this.bindEvents();
        await this.loadData(); // Daten aus der Datenbank laden
        this.renderContent();
    }
    
    // ========== API METHODS ==========
    
    // Alle Daten aus der Datenbank laden
    async loadData() {
        try {
            await this.loadCars();
            await this.loadMaintenances();
        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
            this.showError('Fehler beim Laden der Daten. Ist der Server gestartet?');
        }
    }
    
    // Alle Fahrzeuge laden
    async loadCars() {
        try {
            const response = await fetch(`${this.API_BASE}/cars`);
            if (!response.ok) throw new Error('Fehler beim Laden der Fahrzeuge');
            this.cars = await response.json();
        } catch (error) {
            console.error('Fehler beim Laden der Fahrzeuge:', error);
            throw error;
        }
    }
    
    // Wartungen für das ausgewählte Fahrzeug laden
    async loadMaintenances() {
        const selectedCar = this.getSelectedCar();
        if (!selectedCar) {
            this.maintenances = [];
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE}/cars/${selectedCar.id}/maintenances`);
            if (!response.ok) throw new Error('Fehler beim Laden der Wartungen');
            this.maintenances = await response.json();
        } catch (error) {
            console.error('Fehler beim Laden der Wartungen:', error);
            throw error;
        }
    }
    
    // Neues Fahrzeug hinzufügen
    async addCar() {
        const model = document.getElementById('carModel').value.trim();
        const year = parseInt(document.getElementById('carYear').value);
        const mileage = parseInt(document.getElementById('carMileage').value);
        
        if (!model || !year || !mileage) {
            this.showError('Bitte füllen Sie alle Felder aus.');
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE}/cars`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, year, mileage })
            });
            
            if (!response.ok) throw new Error('Fehler beim Hinzufügen des Fahrzeugs');
            
            // Modal schließen und Formular zurücksetzen
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCarModal'));
            modal.hide();
            document.getElementById('addCarForm').reset();
            
            // Daten neu laden und anzeigen
            await this.loadData();
            this.renderContent();
            this.showSuccess('Fahrzeug erfolgreich hinzugefügt!');
            
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Fahrzeugs:', error);
            this.showError('Fehler beim Hinzufügen des Fahrzeugs.');
        }
    }
    
    // Fahrzeug bearbeiten
    async editCar() {
        const model = document.getElementById('editCarModel').value.trim();
        const year = parseInt(document.getElementById('editCarYear').value);
        const mileage = parseInt(document.getElementById('editCarMileage').value);
        
        if (!model || !year || !mileage || !this.editingCarId) {
            this.showError('Bitte füllen Sie alle Felder aus.');
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE}/cars/${this.editingCarId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, year, mileage })
            });
            
            if (!response.ok) throw new Error('Fehler beim Bearbeiten des Fahrzeugs');
            
            // Modal schließen
            const modal = bootstrap.Modal.getInstance(document.getElementById('editCarModal'));
            modal.hide();
            this.editingCarId = null;
            
            // Daten neu laden und anzeigen
            await this.loadData();
            this.renderContent();
            this.showSuccess('Fahrzeug erfolgreich bearbeitet!');
            
        } catch (error) {
            console.error('Fehler beim Bearbeiten des Fahrzeugs:', error);
            this.showError('Fehler beim Bearbeiten des Fahrzeugs.');
        }
    }
    
    // Fahrzeug löschen
    async deleteCar() {
        if (!this.carToDelete) return;
        
        try {
            const response = await fetch(`${this.API_BASE}/cars/${this.carToDelete}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Fehler beim Löschen des Fahrzeugs');
            
            // Modal schließen
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteCarModal'));
            modal.hide();
            this.carToDelete = null;
            
            // Daten neu laden und anzeigen
            await this.loadData();
            this.renderContent();
            this.showSuccess('Fahrzeug erfolgreich gelöscht!');
            
        } catch (error) {
            console.error('Fehler beim Löschen des Fahrzeugs:', error);
            this.showError('Fehler beim Löschen des Fahrzeugs.');
        }
    }
    
    // Fahrzeug auswählen
    async selectCar(carId) {
        try {
            const response = await fetch(`${this.API_BASE}/cars/${carId}/select`, {
                method: 'POST'
            });
            
            if (!response.ok) throw new Error('Fehler beim Auswählen des Fahrzeugs');
            
            // Daten neu laden und anzeigen
            await this.loadData();
            this.renderContent();
            
        } catch (error) {
            console.error('Fehler beim Auswählen des Fahrzeugs:', error);
            this.showError('Fehler beim Auswählen des Fahrzeugs.');
        }
    }
    
    // Neue Wartung hinzufügen
    async addMaintenance() {
        const selectedCar = this.getSelectedCar();
        const type = document.getElementById('maintenanceType').value.trim();
        const lastDate = document.getElementById('lastDate').value;
        const interval = parseInt(document.getElementById('interval').value);
        const intervalType = document.getElementById('intervalType').value;
        const mileageInterval = document.getElementById('mileageInterval').value;
        
        if (!type || !lastDate || !interval || !selectedCar) {
            this.showError('Bitte füllen Sie alle Pflichtfelder aus.');
            return;
        }
        
        // Nächstes Datum berechnen
        const lastDateObj = new Date(lastDate);
        const nextDate = new Date(lastDateObj);
        
        if (intervalType === 'months') {
            nextDate.setMonth(nextDate.getMonth() + interval);
        } else {
            nextDate.setFullYear(nextDate.getFullYear() + interval);
        }
        
        try {
            const response = await fetch(`${this.API_BASE}/maintenances`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    car_id: selectedCar.id,
                    type: type,
                    last_date: lastDate,
                    next_date: nextDate.toISOString().split('T')[0],
                    interval_value: interval,
                    interval_type: intervalType,
                    mileage_interval: mileageInterval ? parseInt(mileageInterval) : null
                })
            });
            
            if (!response.ok) throw new Error('Fehler beim Hinzufügen der Wartung');
            
            // Modal schließen und Formular zurücksetzen
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMaintenanceModal'));
            modal.hide();
            document.getElementById('addMaintenanceForm').reset();
            
            // Daten neu laden und anzeigen
            await this.loadMaintenances();
            this.renderContent();
            this.showSuccess('Wartung erfolgreich hinzugefügt!');
            
        } catch (error) {
            console.error('Fehler beim Hinzufügen der Wartung:', error);
            this.showError('Fehler beim Hinzufügen der Wartung.');
        }
    }
    
    // Wartung bearbeiten
    async editMaintenance() {
        if (!this.editingMaintenanceId) return;
        
        const type = document.getElementById('editMaintenanceType').value.trim();
        const lastDate = document.getElementById('editLastDate').value;
        const nextDate = document.getElementById('editNextDate').value;
        const interval = parseInt(document.getElementById('editInterval').value);
        const intervalType = document.getElementById('editIntervalType').value;
        const mileageInterval = document.getElementById('editMileageInterval').value;
        
        if (!type || !lastDate || !nextDate || !interval) {
            this.showError('Bitte füllen Sie alle Pflichtfelder aus.');
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE}/maintenances/${this.editingMaintenanceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    last_date: lastDate,
                    next_date: nextDate,
                    interval_value: interval,
                    interval_type: intervalType,
                    mileage_interval: mileageInterval ? parseInt(mileageInterval) : null
                })
            });
            
            if (!response.ok) throw new Error('Fehler beim Bearbeiten der Wartung');
            
            // Modal schließen
            const modal = bootstrap.Modal.getInstance(document.getElementById('editMaintenanceModal'));
            modal.hide();
            this.editingMaintenanceId = null;
            
            // Daten neu laden und anzeigen
            await this.loadMaintenances();
            this.renderContent();
            this.showSuccess('Wartung erfolgreich bearbeitet!');
            
        } catch (error) {
            console.error('Fehler beim Bearbeiten der Wartung:', error);
            this.showError('Fehler beim Bearbeiten der Wartung.');
        }
    }
    
    // Wartung löschen
    async startDeleteMaintenance(maintenanceId) {
        const maintenance = this.maintenances.find(m => m.id === maintenanceId);
        if (maintenance) {
            if (confirm(`Sind Sie sicher, dass Sie die Wartung "${maintenance.type}" löschen möchten?`)) {
                try {
                    const response = await fetch(`${this.API_BASE}/maintenances/${maintenanceId}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) throw new Error('Fehler beim Löschen der Wartung');
                    
                    // Daten neu laden und anzeigen
                    await this.loadMaintenances();
                    this.renderContent();
                    this.showSuccess('Wartung erfolgreich gelöscht!');
                    
                } catch (error) {
                    console.error('Fehler beim Löschen der Wartung:', error);
                    this.showError('Fehler beim Löschen der Wartung.');
                }
            }
        }
    }
    
    // Wartung abschließen
    async confirmCompleteMaintenance() {
        if (!this.completingMaintenanceId) return;
        
        const createNew = document.getElementById('createNewMaintenance').checked;
        const nextDate = document.getElementById('nextMaintenanceDate').value;
        
        try {
            const response = await fetch(`${this.API_BASE}/maintenances/${this.completingMaintenanceId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    createNew: createNew,
                    nextDate: nextDate
                })
            });
            
            if (!response.ok) throw new Error('Fehler beim Abschließen der Wartung');
            
            // Modal schließen
            const modal = bootstrap.Modal.getInstance(document.getElementById('completeMaintenanceModal'));
            modal.hide();
            this.completingMaintenanceId = null;
            
            // Formular zurücksetzen
            document.getElementById('createNewMaintenance').checked = true;
            document.getElementById('nextMaintenanceDate').value = '';
            
            // Daten neu laden und anzeigen
            await this.loadMaintenances();
            this.renderContent();
            this.showSuccess('Wartung erfolgreich abgeschlossen!');
            
        } catch (error) {
            console.error('Fehler beim Abschließen der Wartung:', error);
            this.showError('Fehler beim Abschließen der Wartung.');
        }
    }
    
    // ========== HELPER METHODS ==========
    
    // Erfolgs-Nachricht anzeigen
    showSuccess(message) {
        this.showAlert(message, 'success');
    }
    
    // Fehler-Nachricht anzeigen
    showError(message) {
        this.showAlert(message, 'danger');
    }
    
    // Alert anzeigen
    showAlert(message, type) {
        // Erstelle ein temporäres Alert-Element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Nach 5 Sekunden automatisch entfernen
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
    
    // ========== EXISTING METHODS (angepasst) ==========
    
    loadDarkModePreference() {
        this.isDarkMode = false;
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
        
        // Modal events
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

        const saveEditMaintenanceBtn = document.getElementById('saveEditMaintenanceBtn');
        if (saveEditMaintenanceBtn) {
            saveEditMaintenanceBtn.addEventListener('click', () => this.editMaintenance());
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
        
        if (!typeInput || !suggestionsDiv || !presetsDiv) {
            return;
        }
        
        this.renderMaintenancePresets();
        
        typeInput.removeEventListener('input', this.handleTypeInput);
        typeInput.removeEventListener('focus', this.handleTypeFocus);
        
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
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.position-relative')) {
                this.hideSuggestions();
            }
        });
    }
    
    renderMaintenancePresets() {
        const presetsDiv = document.getElementById('maintenancePresets');
        if (!presetsDiv) return;
        
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
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        this.renderContent();
        
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
    
    // Utility methods
    getSelectedCar() {
        return this.cars.find(car => car.selected);
    }
    
    getCarMaintenances() {
        const selectedCar = this.getSelectedCar();
        return selectedCar ? this.maintenances.filter(m => m.car_id === selectedCar.id) : [];
    }
    
    getMaintenanceStatus(maintenance) {
        if (maintenance.completed) return 'completed';
        if (maintenance.status === 'recommended') return 'recommended';

        const today = new Date();
        const nextDate = new Date(maintenance.next_date);
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
        const deleteButtons = document.querySelectorAll('.maintenance-actions .btn-delete');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const maintenanceId = parseInt(button.getAttribute('data-maintenance-id'));
                this.startDeleteMaintenance(maintenanceId);
            });
        });

        const editButtons = document.querySelectorAll('.maintenance-actions .btn-edit');
        editButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const maintenanceId = parseInt(button.getAttribute('data-maintenance-id'));
                this.startEditMaintenance(maintenanceId);
            });
        });
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
    
    showAddMaintenanceModal() {
        const selectedCar = this.getSelectedCar();
        if (selectedCar) {
            document.getElementById('selectedCarInfo').textContent = `Für: ${selectedCar.model}`;
            const modal = new bootstrap.Modal(document.getElementById('addMaintenanceModal'));
            modal.show();
            
            setTimeout(() => {
                this.bindMaintenanceTypeEvents();
            }, 100);
        } else {
            this.showError('Bitte wählen Sie zuerst ein Fahrzeug aus.');
        }
    }
    
    startEditMaintenance(maintenanceId) {
        const maintenance = this.maintenances.find(m => m.id === maintenanceId);
        if (maintenance) {
            this.editingMaintenanceId = maintenanceId;

            const selectedCar = this.cars.find(c => c.id === maintenance.car_id);
            document.getElementById('editMaintenanceCarInfo').textContent = `Für: ${selectedCar.model}`;
            document.getElementById('editMaintenanceType').value = maintenance.type;
            document.getElementById('editLastDate').value = maintenance.last_date;
            document.getElementById('editNextDate').value = maintenance.next_date;
            document.getElementById('editInterval').value = maintenance.interval_value;
            document.getElementById('editIntervalType').value = maintenance.interval_type;
            document.getElementById('editMileageInterval').value = maintenance.mileage_interval || '';

            const modal = new bootstrap.Modal(document.getElementById('editMaintenanceModal'));
            modal.show();
        }
    }
    
    toggleMaintenanceCompleted(maintenanceId) {
        const maintenance = this.maintenances.find(m => m.id === maintenanceId);
        if (maintenance) {
            if (maintenance.completed) {
                // Direktes umschalten zurück zu nicht erledigt
                this.confirmCompleteMaintenance();
            } else {
                this.showCompleteMaintenanceModal(maintenanceId);
            }
        }
    }
    
    showCompleteMaintenanceModal(maintenanceId) {
        const maintenance = this.maintenances.find(m => m.id === maintenanceId);
        if (maintenance) {
            this.completingMaintenanceId = maintenanceId;
            
            const today = new Date();
            const nextDate = new Date(today);
            
            if (maintenance.interval_type === 'months') {
                nextDate.setMonth(nextDate.getMonth() + maintenance.interval_value);
            } else {
                nextDate.setFullYear(nextDate.getFullYear() + maintenance.interval_value);
            }
            
            document.getElementById('completeMaintenanceText').textContent = 
                `Wartung "${maintenance.type}" als erledigt markieren?`;
            
            const newMaintenanceDateDiv = document.getElementById('newMaintenanceDate');
            if (maintenance.status === 'recommended' || !maintenance.interval_value) {
                newMaintenanceDateDiv.style.display = 'none';
                document.getElementById('createNewMaintenance').checked = false;
            } else {
                newMaintenanceDateDiv.style.display = 'block';
                document.getElementById('createNewMaintenance').checked = true;
                document.getElementById('nextMaintenanceDate').value = nextDate.toISOString().split('T')[0];
            }
            
            const modal = new bootstrap.Modal(document.getElementById('completeMaintenanceModal'));
            modal.show();
            
            const checkbox = document.getElementById('createNewMaintenance');
            
            checkbox.removeEventListener('change', this.handleCheckboxChange);
            
            this.handleCheckboxChange = function() {
                newMaintenanceDateDiv.style.display = this.checked ? 'block' : 'none';
            };
            
            checkbox.addEventListener('change', this.handleCheckboxChange);
        }
    }
    
    // Calendar navigation
    navigateMonth(direction) {
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        this.currentDate = newDate;
        this.renderContent();
    }
    
    // Alle Render-Methoden bleiben unverändert, da sie bereits die this.cars und this.maintenances Arrays verwenden
    renderOverview() {
        const selectedCar = this.getSelectedCar();
        let carMaintenances = [];

        if (selectedCar) {
            carMaintenances = this.getCarMaintenances();
        }
        
        const pendingMaintenances = carMaintenances.filter(m => !m.completed);
        const completedMaintenances = carMaintenances.filter(m => m.completed);

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
                        
                        <div class="card mb-4">
                            <div class="card-header">
                                <h4 class="card-title mb-0">
                                    <i class="bi bi-tools me-2"></i>
                                    Anstehende Wartungen
                                </h4>
                            </div>
                            <div class="card-body">
                                ${pendingMaintenances.length > 0 ? 
                                    pendingMaintenances.map(maintenance => this.renderMaintenanceItem(maintenance)).join('') :
                                    '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Keine anstehenden Wartungen</div>'
                                }
                            </div>
                        </div>

                        <div class="accordion" id="completedMaintenanceAccordion">
                          <div class="accordion-item">
                            <h2 class="accordion-header" id="headingOne">
                              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
                                <i class="bi bi-check-circle-fill me-2"></i>
                                Erledigte Wartungen (${completedMaintenances.length})
                              </button>
                            </h2>
                            <div id="collapseOne" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#completedMaintenanceAccordion">
                              <div class="accordion-body">
                                ${completedMaintenances.length > 0 ? 
                                    completedMaintenances.map(maintenance => this.renderMaintenanceItem(maintenance)).join('') :
                                    '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Keine erledigten Wartungen</div>'
                                }
                              </div>
                            </div>
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
            const date = new Date(maintenance.next_date);
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            if (!maintenancesByDate[dateKey]) maintenancesByDate[dateKey] = [];
            maintenancesByDate[dateKey].push(maintenance);
        });
        
        let html = '<div class="calendar-grid">';
        
        ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].forEach(day => {
            html += `<div class="calendar-header-cell">${day}</div>`;
        });
        
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
                             title="${m.type} - ${new Date(m.next_date).toLocaleDateString('de-DE')}">
                            ${m.type}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
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
                             title="${m.type} - ${new Date(m.next_date).toLocaleDateString('de-DE')}">
                            ${m.type}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
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
                             title="${m.type} - ${new Date(m.next_date).toLocaleDateString('de-DE')}">
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
        const carMaintenances = this.getCarMaintenances();
        const selectedCar = this.getSelectedCar();
        
        const pendingMaintenances = carMaintenances.filter(m => !m.completed);

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
                        ${pendingMaintenances.length > 0 ? 
                            pendingMaintenances.map(maintenance => this.renderMaintenanceItem(maintenance, true, true)).join('') :
                            '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Keine anstehenden Wartungen für dieses Fahrzeug</div>'
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
                        
                        <div class="row g-2 mb-3">
                            <div class="col-md-6">
                                <select class="form-select" id="serviceType" onchange="app.searchWorkshops()">
                                    <option value="autowerkstatt">Allgemeine Werkstatt</option>
                                    <option value="reifen">Reifenservice</option>
                                    <option value="karosserie">Karosseriewerkstatt</option>
                                    <option value="klimaservice">Klimaservice</option>
                                    <option value="getriebereparatur">Getriebereparatur</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <button class="btn btn-outline-secondary w-100" id="sortWorkshopsBtn" onclick="app.sortWorkshops()">
                                    <i class="bi bi-sort-down me-2"></i>Nach Entfernung sortieren
                                </button>
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
    
   renderMaintenanceItem(maintenance, detailed = false, showManagementButtons = false) {
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
                    <small>Letzter Service: ${maintenance.last_date ? new Date(maintenance.last_date).toLocaleDateString('de-DE') : 'Unbekannt'}</small>
                    <small>Nächster Service: ${maintenance.next_date ? new Date(maintenance.next_date).toLocaleDateString('de-DE') : 'N/A'}</small>
                    ${detailed && maintenance.interval_value ? `
                        <small>Intervall: ${maintenance.interval_value} ${maintenance.interval_type === 'months' ? 'Monate' : 'Jahre'}</small>
                    ` : ''}
                    ${detailed && maintenance.mileage_interval ? `<small>Oder alle ${maintenance.mileage_interval.toLocaleString()} km</small>` : ''}
                </div>
                <div class="maintenance-actions">
                    <span class="badge status-badge status-${status}">${statusText}</span>
                    ${!showManagementButtons ? `
                        <button class="btn btn-sm btn-primary" onclick="app.toggleMaintenanceCompleted(${maintenance.id})">
                            ${maintenance.completed ? 'Rückgängig' : 'Erledigt'}
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-icon btn-edit" data-maintenance-id="${maintenance.id}" title="Bearbeiten">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-icon btn-delete" data-maintenance-id="${maintenance.id}" title="Löschen">
                            <i class="bi bi-trash"></i>
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

    // Google Maps Integration (bleibt unverändert)
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
                maximumAge: 300000
            }
        );
    }
    
    initializeMap() {
        if (!this.userLocation) return;
        
        const mapElement = document.getElementById('map');
        if (!mapElement) return;
        
        mapElement.innerHTML = '';
        
        this.map = new google.maps.Map(mapElement, {
            center: this.userLocation,
            zoom: 13,
            styles: this.isDarkMode ? this.getDarkMapStyles() : []
        });
        
        this.userMarker = new google.maps.Marker({
            position: this.userLocation,
            map: this.map,
            title: 'Ihr Standort',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="%230d6efd" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8"/><circle cx="8" cy="8" r="4" fill="white"/></svg>',
                scaledSize: new google.maps.Size(24, 24)
            }
        });
        
        this.placesService = new google.maps.places.PlacesService(this.map);
        this.searchWorkshops();
        this.drawSearchCircle();
    }
    
    searchWorkshops() {
        if (!this.placesService || !this.userLocation) return;
        
        const serviceType = document.getElementById('serviceType').value;
        const request = {
            location: this.userLocation,
            radius: this.searchRadius,
            type: 'car_repair',
            keyword: serviceType
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

    sortWorkshops() {
        if (this.currentWorkshops.length === 0) return;
        
        const sorted = [...this.currentWorkshops].map(workshop => {
            const distance = this.calculateDistance(
                this.userLocation.lat, this.userLocation.lng,
                workshop.geometry.location.lat(), workshop.geometry.location.lng()
            );
            return { ...workshop, distance };
        }).sort((a, b) => a.distance - b.distance);
    
        this.renderWorkshopsList(sorted);
    }
    
    drawSearchCircle() {
        if (this.searchCircle) {
            this.searchCircle.setMap(null);
        }
        
        if (this.userLocation) {
            this.searchCircle = new google.maps.Circle({
                strokeColor: '#0d6efd',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#0d6efd',
                fillOpacity: 0.15,
                map: this.map,
                center: this.userLocation,
                radius: this.searchRadius
            });
            this.map.fitBounds(this.searchCircle.getBounds());
        }
    }
    
    displayWorkshops(workshops) {
        this.workshopsMarkers.forEach(marker => marker.setMap(null));
        this.workshopsMarkers = [];
        this.currentWorkshops = workshops;
        
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
            
            marker.addListener('click', () => {
                this.showWorkshopDetails(workshop);
            });
            
            this.workshopsMarkers.push(marker);
        });
        
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
        
        const sortedWorkshops = workshops.map(workshop => {
            const distance = this.calculateDistance(
                this.userLocation.lat, this.userLocation.lng,
                workshop.geometry.location.lat(), workshop.geometry.location.lng()
            );
            return { ...workshop, distance };
        }).sort((a, b) => a.distance - b.distance);
        
        workshopsList.innerHTML = sortedWorkshops.map(workshop => `
            <div class="workshop-item" onclick="app.showWorkshopDetails(${JSON.stringify(workshop).replace(/"/g, '\'')})">
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
            this.drawSearchCircle();
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
        this.userLocation = { lat: 51.1657, lng: 10.4515 };
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
        const R = 6371;
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
    console.log('Google Maps API loaded');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new AutoWartungApp();
});