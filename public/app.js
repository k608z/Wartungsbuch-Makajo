// Auto Wartungs-Manager - Mit MySQL Backend
class AutoWartungApp {
    constructor() {
        this.activeTab = 'overview';
        this.currentDate = new Date();
        this.editingCarId = null;
        this.editingMaintenanceId = null;
        this.carToDelete = null;
        this.completingMaintenanceId = null;
        this.completingRecommendationType = null;
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
        await this.loadData();
        this.renderContent();
    }
    
    // ========== API METHODS ==========
    
    async loadData() {
        try {
            await this.loadCars();
            await this.loadMaintenances();
        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
            this.showError('Fehler beim Laden der Daten. Ist der Server gestartet?');
        }
    }
    
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
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCarModal'));
            modal.hide();
            document.getElementById('addCarForm').reset();
            
            await this.loadData();
            this.renderContent();
            this.showSuccess('Fahrzeug erfolgreich hinzugefügt!');
            
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Fahrzeugs:', error);
            this.showError('Fehler beim Hinzufügen des Fahrzeugs.');
        }
    }
    
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
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('editCarModal'));
            modal.hide();
            this.editingCarId = null;
            
            await this.loadData();
            this.renderContent();
            this.showSuccess('Fahrzeug erfolgreich bearbeitet!');
            
        } catch (error) {
            console.error('Fehler beim Bearbeiten des Fahrzeugs:', error);
            this.showError('Fehler beim Bearbeiten des Fahrzeugs.');
        }
    }
    
    async deleteCar() {
        if (!this.carToDelete) return;
        
        try {
            const response = await fetch(`${this.API_BASE}/cars/${this.carToDelete}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Fehler beim Löschen des Fahrzeugs');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteCarModal'));
            modal.hide();
            this.carToDelete = null;
            
            await this.loadData();
            this.renderContent();
            this.showSuccess('Fahrzeug erfolgreich gelöscht!');
            
        } catch (error) {
            console.error('Fehler beim Löschen des Fahrzeugs:', error);
            this.showError('Fehler beim Löschen des Fahrzeugs.');
        }
    }
    
    async selectCar(carId) {
        try {
            const response = await fetch(`${this.API_BASE}/cars/${carId}/select`, {
                method: 'POST'
            });
            
            if (!response.ok) throw new Error('Fehler beim Auswählen des Fahrzeugs');
            
            await this.loadData();
            this.renderContent();
            
        } catch (error) {
            console.error('Fehler beim Auswählen des Fahrzeugs:', error);
            this.showError('Fehler beim Auswählen des Fahrzeugs.');
        }
    }
    
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
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMaintenanceModal'));
            modal.hide();
            document.getElementById('addMaintenanceForm').reset();
            
            await this.loadMaintenances();
            this.renderContent();
            this.showSuccess('Wartung erfolgreich hinzugefügt!');
            
        } catch (error) {
            console.error('Fehler beim Hinzufügen der Wartung:', error);
            this.showError('Fehler beim Hinzufügen der Wartung.');
        }
    }
    
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
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('editMaintenanceModal'));
            modal.hide();
            this.editingMaintenanceId = null;
            
            await this.loadMaintenances();
            this.renderContent();
            this.showSuccess('Wartung erfolgreich bearbeitet!');
            
        } catch (error) {
            console.error('Fehler beim Bearbeiten der Wartung:', error);
            this.showError('Fehler beim Bearbeiten der Wartung.');
        }
    }
    
    async startDeleteMaintenance(maintenanceId) {
        const maintenance = this.maintenances.find(m => m.id === maintenanceId);
        if (maintenance) {
            if (confirm(`Sind Sie sicher, dass Sie die Wartung "${maintenance.type}" löschen möchten?`)) {
                try {
                    const response = await fetch(`${this.API_BASE}/maintenances/${maintenanceId}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) throw new Error('Fehler beim Löschen der Wartung');
                    
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
    
    // ERSETZEN SIE DIESE KOMPLETTE FUNKTION

async confirmCompleteMaintenance() {
    const createNew = document.getElementById('createNewMaintenance').checked;
    const nextDate = document.getElementById('nextMaintenanceDate').value;
    const modal = bootstrap.Modal.getInstance(document.getElementById('completeMaintenanceModal'));

    try {
        // Fall 1: Eine bestehende Wartung wird abgeschlossen (bleibt unverändert)
        if (this.completingMaintenanceId) {
            const response = await fetch(`${this.API_BASE}/maintenances/${this.completingMaintenanceId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ createNew, nextDate })
            });
            if (!response.ok) throw new Error('Fehler beim Abschließen der Wartung');

        // Fall 2: Eine Empfehlung wird direkt als erledigt protokolliert (NEUE, ROBUSTERE LOGIK)
        } else if (this.completingRecommendationType) {
            const selectedCar = this.getSelectedCar();
            const preset = this.maintenancePresets.find(p => p.type === this.completingRecommendationType);
            if (!preset || !selectedCar) throw new Error("Fahrzeug oder Wartungstyp nicht gefunden.");

            // SCHRITT A: Erstelle einen neuen, anstehenden Wartungseintrag für die Zukunft
            const createResponse = await fetch(`${this.API_BASE}/maintenances`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    car_id: selectedCar.id,
                    type: preset.type,
                    last_date: new Date().toISOString().split('T')[0], // Heute als "letzter Service"
                    next_date: nextDate, // Das in der Zukunft liegende Datum aus dem Modal
                    interval_value: preset.interval,
                    interval_type: preset.intervalType,
                    mileage_interval: preset.mileageInterval || null
                })
            });
            if (!createResponse.ok) throw new Error('Fehler beim Erstellen des neuen Eintrags.');
            
            const newMaintenance = await createResponse.json();
            
            // SCHRITT B: Markiere diesen neuen Eintrag sofort als erledigt.
            // Das Backend wird daraus den erledigten Eintrag machen und den NÄCHSTEN anlegen.
            const completeResponse = await fetch(`${this.API_BASE}/maintenances/${newMaintenance.id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ createNew: true, nextDate: nextDate }) // Sag dem Backend, es soll den nächsten Eintrag erstellen
            });
            if (!completeResponse.ok) throw new Error('Fehler beim Abschließen des neuen Eintrags.');
        }

        // Aufräumen und UI aktualisieren
        modal.hide();
        this.completingMaintenanceId = null;
        this.completingRecommendationType = null;

        await this.loadData();
        this.renderContent();
        this.showSuccess('Wartung erfolgreich protokolliert!');

    } catch (error) {
        console.error('Fehler beim Abschließen der Wartung:', error);
        this.showError(error.message);
        if (modal) modal.hide();
    }
}
    
    // ========== HELPER METHODS ==========
    
    showSuccess(message) {
        this.showAlert(message, 'success');
    }
    
    showError(message) {
        this.showAlert(message, 'danger');
    }
    
    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
    
    // ========== UI & EVENT METHODS ==========


// FÜGEN SIE DIESE 5 FUNKTIONEN HINZU

bindMaintenanceTypeEvents() {
    const typeInput = document.getElementById('maintenanceType');
    const suggestionsDiv = document.getElementById('maintenanceSuggestions');

    if (!typeInput || !suggestionsDiv) return;

    this.renderMaintenancePresets();

    // Alte Event-Listener sicher entfernen
    typeInput.removeEventListener('input', this.handleTypeInput);
    typeInput.removeEventListener('focus', this.handleTypeInput); // Auch bei Fokus suchen

    this.handleTypeInput = (e) => {
        const value = e.target.value.toLowerCase();
        if (value.length > 0) {
            const filtered = this.maintenancePresets
                .filter(preset => preset.type.toLowerCase().includes(value))
                .sort((a, b) => a.type.localeCompare(b.type)); // NEU: Alphabetische Sortierung
            this.showSuggestions(filtered);
        } else {
            this.hideSuggestions();
        }
    };

    typeInput.addEventListener('input', this.handleTypeInput);
    typeInput.addEventListener('focus', this.handleTypeInput);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.position-relative')) {
            this.hideSuggestions();
        }
    });
}

renderMaintenancePresets() {
    const presetsDiv = document.getElementById('maintenancePresets');
    if (!presetsDiv) return;

    presetsDiv.innerHTML = this.maintenancePresets.slice(0, 6).map(preset => `
        <button type="button" class="btn btn-outline-secondary btn-sm preset-btn" 
                onclick="app.selectMaintenancePreset('${preset.type}')">
            <i class="${preset.icon} me-1"></i>
            ${preset.type}
        </button>
    `).join('');
}

showSuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('maintenanceSuggestions');
    if (!suggestionsDiv) return;

    if (suggestions.length > 0) {
        suggestionsDiv.innerHTML = suggestions.map(preset => `
            <button type="button" class="suggestion-item" 
                    onclick="app.selectMaintenancePreset('${preset.type}')">
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

selectMaintenancePreset(type) {
    const preset = this.maintenancePresets.find(p => p.type === type);
    if (!preset) return;

    document.getElementById('maintenanceType').value = preset.type;
    if (preset.interval) document.getElementById('interval').value = preset.interval;
    if (preset.intervalType) document.getElementById('intervalType').value = preset.intervalType;
    if (preset.mileageInterval) document.getElementById('mileageInterval').value = preset.mileageInterval;

    this.hideSuggestions();
}

    
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
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveTab(e.target.closest('.tab-btn').dataset.tab);
            });
        });
        
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }
        
        const saveCarBtn = document.getElementById('saveCarBtn');
        if (saveCarBtn) saveCarBtn.addEventListener('click', () => this.addCar());
        
        const saveEditCarBtn = document.getElementById('saveEditCarBtn');
        if (saveEditCarBtn) saveEditCarBtn.addEventListener('click', () => this.editCar());
        
        const saveMaintenanceBtn = document.getElementById('saveMaintenanceBtn');
        if (saveMaintenanceBtn) saveMaintenanceBtn.addEventListener('click', () => this.addMaintenance());

        const saveEditMaintenanceBtn = document.getElementById('saveEditMaintenanceBtn');
        if (saveEditMaintenanceBtn) saveEditMaintenanceBtn.addEventListener('click', () => this.editMaintenance());
        
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => this.deleteCar());
        
        const confirmCompleteBtn = document.getElementById('confirmCompleteBtn');
        if (confirmCompleteBtn) confirmCompleteBtn.addEventListener('click', () => this.confirmCompleteMaintenance());
    }
    
    bindMaintenanceTypeEvents() {
        const typeInput = document.getElementById('maintenanceType');
        const suggestionsDiv = document.getElementById('maintenanceSuggestions');
        const presetsDiv = document.getElementById('maintenancePresets');
        
        if (!typeInput || !suggestionsDiv || !presetsDiv) return;
        
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

    // ========== DATA PROCESSING & STATUS LOGIC ==========

    getSelectedCar() {
        return this.cars.find(car => car.selected);
    }
    
    getCarMaintenances() {
        const selectedCar = this.getSelectedCar();
        return selectedCar ? this.maintenances.filter(m => m.car_id === selectedCar.id) : [];
    }

    generateMileageRecommendations(car, existingMaintenances) {
        if (!car) return [];

        const existingTypes = new Set(existingMaintenances.map(m => m.type));

        return this.maintenancePresets
            .filter(preset => 
                preset.mileageInterval && 
                !existingTypes.has(preset.type)
            )
            .map(preset => ({
                ...preset,
                status: 'recommended',
                car_id: car.id
            }));
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
    
    // ========== MODAL & INTERACTION HANDLERS ==========
    
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
    
    // ERSETZEN SIE DIESE FUNKTION
showAddMaintenanceModal() {
    const selectedCar = this.getSelectedCar();
    if (selectedCar) {
        document.getElementById('selectedCarInfo').textContent = `Für: ${selectedCar.model}`;
        document.getElementById('addMaintenanceForm').reset(); // Formular zurücksetzen
        const modal = new bootstrap.Modal(document.getElementById('addMaintenanceModal'));
        modal.show();

        // Wichtig: Aktiviert die Logik für das Suchfeld und die Icons
        setTimeout(() => {
            this.bindMaintenanceTypeEvents();
        }, 150);
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
            this.showCompleteMaintenanceModal(maintenanceId);
        }
    }
    
    showCompleteMaintenanceModal(maintenanceId) {
        const maintenance = this.maintenances.find(m => m.id === maintenanceId);
        if (maintenance) {
            this.completingMaintenanceId = maintenanceId;
            this.completingRecommendationType = null;
            
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
            if (!maintenance.interval_value) {
                newMaintenanceDateDiv.style.display = 'none';
                document.getElementById('createNewMaintenance').checked = false;
            } else {
                newMaintenanceDateDiv.style.display = 'block';
                document.getElementById('createNewMaintenance').checked = true;
                document.getElementById('nextMaintenanceDate').value = nextDate.toISOString().split('T')[0];
            }
            
            const modal = new bootstrap.Modal(document.getElementById('completeMaintenanceModal'));
            modal.show();
        }
    }

    showCompleteModalForRecommendation(type) {
        const preset = this.maintenancePresets.find(p => p.type === type);
        if (!preset) return;

        this.completingMaintenanceId = null;
        this.completingRecommendationType = type;

        const today = new Date();
        const nextDate = new Date(today);

        if (preset.intervalType === 'months') {
            nextDate.setMonth(nextDate.getMonth() + preset.interval);
        } else if (preset.intervalType === 'years') {
            nextDate.setFullYear(nextDate.getFullYear() + preset.interval);
        }

        document.getElementById('completeMaintenanceText').textContent = 
            `Wartung "${preset.type}" als erledigt markieren?`;
        
        const newMaintenanceDateDiv = document.getElementById('newMaintenanceDate');
        newMaintenanceDateDiv.style.display = 'block';
        document.getElementById('createNewMaintenance').checked = true;
        document.getElementById('nextMaintenanceDate').value = nextDate.toISOString().split('T')[0];

        const modal = new bootstrap.Modal(document.getElementById('completeMaintenanceModal'));
        modal.show();
    }
    
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderContent();
    }
    
    // ========== RENDER METHODS ==========

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
    
    // ERSETZEN SIE DIESE KOMPLETTE FUNKTION

renderOverview() {
    const selectedCar = this.getSelectedCar();
    let carMaintenances = [];

    if (selectedCar) {
        carMaintenances = this.getCarMaintenances();
    }

    const pendingMaintenances = carMaintenances.filter(m => !m.completed); // Zeigt wieder ALLE anstehenden
    const completedMaintenances = carMaintenances.filter(m => m.completed);
    const recommendations = this.generateMileageRecommendations(selectedCar, pendingMaintenances);

    const content = document.getElementById('main-content');
    content.innerHTML = `
        <div class="container-fluid">
            ${this.cars.length > 1 ? this.renderCarSelector() : ''}

            <div class="card mb-4">
                <div class="card-header"><h4 class="card-title mb-0"><i class="bi bi-car-front-fill me-2"></i>Aktuelles Fahrzeug</h4></div>
                <div class="card-body">
                    ${selectedCar ? `
                        <div class="car-info-box">
                            <h4>${selectedCar.model}</h4>
                            <p><strong>Baujahr:</strong> ${selectedCar.year}</p>
                            <p><strong>Laufleistung:</strong> ${selectedCar.mileage.toLocaleString()} km</p>
                        </div>
                    ` : `
                        <div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>Kein Fahrzeug ausgewählt.</div>
                    `}
                </div>
            </div>

            ${recommendations.length > 0 ? `
            <div class="card mb-4">
                <div class="card-header"><h4 class="card-title mb-0"><i class="bi bi-lightbulb-fill me-2"></i>Empfohlene Wartungen</h4></div>
                <div class="card-body">
                    ${recommendations.map(rec => this.renderMaintenanceItem(rec, false, false, true)).join('')}
                </div>
            </div>
            ` : ''}

            <div class="card mb-4">
                <div class="card-header"><h4 class="card-title mb-0"><i class="bi bi-tools me-2"></i>Anstehende Wartungen</h4></div>
                <div class="card-body">
                    ${pendingMaintenances.length > 0 ? 
                        pendingMaintenances.map(maintenance => this.renderMaintenanceItem(maintenance)).join('') :
                        '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Keine anstehenden Wartungen.</div>'
                    }
                </div>
            </div>

            <div class="accordion" id="completedMaintenanceAccordion">
              <div class="accordion-item">
                <h2 class="accordion-header" id="headingOne">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    Erledigte Wartungen (${completedMaintenances.length})
                  </button>
                </h2>
                <div id="collapseOne" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    ${completedMaintenances.length > 0 ? 
                        completedMaintenances.map(maintenance => this.renderMaintenanceItem(maintenance, false, false, false, true)).join('') :
                        '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Keine erledigten Wartungen</div>'
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
                    <button class="btn btn-outline-primary dropdown-toggle car-selector-dropdown" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-car-front me-2"></i>
                        ${this.getSelectedCar()?.model || 'Fahrzeug auswählen'}
                    </button>
                    <ul class="dropdown-menu">
                        ${this.cars.map(car => `
                            <li>
                                <button class="car-option ${car.selected ? 'active' : ''}" onclick="app.selectCar(${car.id})">
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
    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const currentYear = this.currentDate.getFullYear();
    const currentMonth = this.currentDate.getMonth();

    // Jahre für die Auswahl generieren (z.B. 5 Jahre in Vergangenheit und Zukunft)
    let yearOptions = '';
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        yearOptions += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
    }

    // Monate für die Auswahl generieren
    const monthOptions = monthNames.map((name, index) => 
        `<option value="${index}" ${index === currentMonth ? 'selected' : ''}>${name}</option>`
    ).join('');

    content.innerHTML = `
        <div class="container-fluid">
            <div class="card">
                <div class="card-header">
                    <div class="calendar-header">
                        <h4 class="card-title mb-0"><i class="bi bi-calendar3 me-2"></i>Wartungskalender</h4>
                        <div class="calendar-nav">
                            <button class="btn btn-outline-primary btn-sm" id="prevMonth"><i class="bi bi-chevron-left"></i></button>
                            <div class="d-flex gap-2">
                                <select class="form-select form-select-sm" id="monthSelector">${monthOptions}</select>
                                <select class="form-select form-select-sm" id="yearSelector">${yearOptions}</select>
                            </div>
                            <button class="btn btn-outline-primary btn-sm" id="nextMonth"><i class="bi bi-chevron-right"></i></button>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">${this.renderCalendarGrid()}</div>
            </div>
        </div>
    `;

    // Event Listeners für die neue Navigation
    document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));
    document.getElementById('monthSelector').addEventListener('change', () => this.jumpToDate());
    document.getElementById('yearSelector').addEventListener('change', () => this.jumpToDate());
}
    
   // ERSETZEN SIE DIESE KOMPLETTE FUNKTION

renderCalendarGrid() {
    const currentMonth = this.currentDate.getMonth();
    const currentYear = this.currentDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Woche beginnt Montag

    // 1. Hole alle relevanten Wartungen (nicht erledigt, keine Empfehlungen)
    const carMaintenances = this.getCarMaintenances().filter(m => !m.completed && m.status !== 'recommended');
    const maintenancesByDate = {};
    
    // 2. Gruppiere Wartungen nach Datum für schnellen Zugriff
    carMaintenances.forEach(maintenance => {
        const date = new Date(maintenance.next_date);
        // Beachte: Wir normalisieren das Datum ohne Zeitzone, um Fehler zu vermeiden
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        const dateKey = utcDate.toDateString();
        if (!maintenancesByDate[dateKey]) maintenancesByDate[dateKey] = [];
        maintenancesByDate[dateKey].push(maintenance);
    });
    
    let html = '<div class="calendar-grid">';
    
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(day => {
        html += `<div class="calendar-header-cell">${day}</div>`;
    });
    
    for (let i = 0; i < startingDay; i++) {
        html += '<div class="calendar-day other-month"></div>';
    }
    
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateKey = date.toDateString();
        const dayMaintenances = maintenancesByDate[dateKey] || [];
        const isToday = date.toDateString() === today.toDateString();
        
        // 3. Füge die gefundenen Wartungen für den jeweiligen Tag dem HTML hinzu
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}">
                <div class="calendar-day-number">${day}</div>
                <div class="calendar-events">
                    ${dayMaintenances.map(m => `
                        <div class="calendar-maintenance status-${this.getMaintenanceStatus(m)}" 
                             title="${m.type}">
                            ${m.type}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    const totalCells = (startingDay + daysInMonth) > 35 ? 42 : 35;
    for (let i = (startingDay + daysInMonth); i < totalCells; i++) {
        html += '<div class="calendar-day other-month"></div>';
    }

    html += '</div>';
    return html;
}
    

jumpToDate() {
    const newMonth = parseInt(document.getElementById('monthSelector').value);
    const newYear = parseInt(document.getElementById('yearSelector').value);
    this.currentDate = new Date(newYear, newMonth, 1);
    this.renderContent();
}

    renderCars() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="container-fluid">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h4 class="card-title mb-0"><i class="bi bi-car-front-fill me-2"></i>Meine Fahrzeuge</h4>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addCarModal">
                            <i class="bi bi-plus-lg me-2"></i>Fahrzeug hinzufügen
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            ${this.cars.map(car => `
                                <div class="col-md-6 col-lg-4 mb-3">
                                    <div class="card car-card ${car.selected ? 'selected' : ''}" onclick="app.selectCar(${car.id})">
                                        <div class="card-body">
                                            ${car.selected ? '<span class="selected-badge"><i class="bi bi-check-lg"></i> Ausgewählt</span>' : ''}
                                            <h5 class="card-title">${car.model}</h5>
                                            <p class="card-text text-muted mb-1"><strong>Baujahr:</strong> ${car.year}</p>
                                            <p class="card-text text-muted"><strong>Laufleistung:</strong> ${car.mileage.toLocaleString()} km</p>
                                            <div class="car-actions">
                                                <button class="btn btn-icon btn-edit" onclick="event.stopPropagation(); app.startEditCar(${car.id})" title="Bearbeiten"><i class="bi bi-pencil"></i></button>
                                                <button class="btn btn-icon btn-delete" onclick="event.stopPropagation(); app.startDeleteCar(${car.id})" title="Löschen"><i class="bi bi-trash"></i></button>
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
        const pendingMaintenances = carMaintenances.filter(m => !m.completed);

        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="container-fluid">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h4 class="card-title mb-0"><i class="bi bi-tools me-2"></i>Wartungen verwalten</h4>
                        <button class="btn btn-primary" onclick="app.showAddMaintenanceModal()">
                            <i class="bi bi-plus-lg me-2"></i>Wartung hinzufügen
                        </button>
                    </div>
                    <div class="card-body">
                        ${pendingMaintenances.length > 0 ? 
                            pendingMaintenances.map(m => this.renderMaintenanceItem(m, true, true)).join('') :
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
                    <h4 class="card-title mb-0"><i class="bi bi-geo-alt-fill me-2"></i>Werkstätten in der Nähe</h4>
                </div>
                <div class="card-body">
                    <div class="maps-controls">
                        <div class="search-radius-control">
                            <label for="searchRadius" class="form-label">Suchradius:</label>
                            <select class="form-select" id="searchRadius" onchange="app.changeSearchRadius(this.value)">
                                <option value="2000">2 km</option>
                                <option value="5000" selected>5 km</option>
                                <option value="10000">10 km</option>
                                <option value="20000">20 km</option>
                            </select>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="useCurrentLocationBtn" onclick="app.useCurrentLocation()">
                            <i class="bi bi-cursor-fill me-1"></i> Meinen Standort verwenden
                        </button>
                        <div class="location-status loading" id="locationStatus">
                            <i class="bi bi-geo-alt"></i><span>Standort wird ermittelt...</span>
                        </div>
                    </div>

                    <div class="alert alert-info d-flex align-items-center mt-3">
                        <i class="bi bi-mouse me-2"></i>
                        <div>Klicken Sie auf die Karte, um einen manuellen Standort für die Suche festzulegen.</div>
                    </div>

                    <div class="maps-container mt-3">
                        <div id="map" class="maps-loading"><div class="loading-spinner"></div><p>Karte wird geladen...</p></div>
                    </div>

                    <div class="workshop-list" id="workshopsList" style="display: none;"></div>
                </div>
            </div>
        </div>
    `;
}


   renderMaintenanceItem(maintenance, detailed = false, showManagementButtons = false, isRecommendation = false, showDeleteOnly = false) {
    const status = this.getMaintenanceStatus(maintenance);
    const statusText = this.getStatusText(status);
    const statusIcon = this.getStatusIcon(status);

    const recommendationText = `Empfohlen alle ${maintenance.mileageInterval?.toLocaleString()} km.`;

    return `
        <div class="card maintenance-card status-${status} mb-3">
            <div class="maintenance-item">
                <div class="maintenance-info">
                    <h5>
                        <i class="bi ${maintenance.icon || statusIcon} me-2"></i>
                        ${maintenance.type}
                    </h5>
                    ${isRecommendation ? `
                        <small>${recommendationText}</small>
                        <small>Klicken Sie auf "Erledigt", um diese Wartung zu protokollieren.</small>
                    ` : `
                        <small>Letzter Service: ${maintenance.last_date ? new Date(maintenance.last_date).toLocaleDateString('de-DE') : 'Unbekannt'}</small>
                        <small>Nächster Service: ${maintenance.next_date ? new Date(maintenance.next_date).toLocaleDateString('de-DE') : 'N/A'}</small>
                        ${detailed && maintenance.interval_value ? `<small>Intervall: ${maintenance.interval_value} ${maintenance.interval_type === 'months' ? 'Monate' : 'Jahre'}</small>` : ''}
                        ${detailed && maintenance.mileage_interval ? `<small>Oder alle ${maintenance.mileage_interval.toLocaleString()} km</small>` : ''}
                    `}
                </div>
                <div class="maintenance-actions">
                    <span class="badge status-badge status-${status}">${statusText}</span>
                    ${isRecommendation ? `
                        <button class="btn btn-sm btn-primary" onclick="app.showCompleteModalForRecommendation('${maintenance.type}')">
                            <i class="bi bi-check-lg me-1"></i> Erledigt
                        </button>
                    ` : showDeleteOnly ? `
                        <button class="btn btn-sm btn-icon btn-delete" data-maintenance-id="${maintenance.id}" title="Löschen">
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : showManagementButtons ? `
                        <button class="btn btn-sm btn-icon btn-edit" data-maintenance-id="${maintenance.id}" title="Bearbeiten"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-icon btn-delete" data-maintenance-id="${maintenance.id}" title="Löschen"><i class="bi bi-trash"></i></button>
                    ` : `
                        <button class="btn btn-sm btn-primary" onclick="app.toggleMaintenanceCompleted(${maintenance.id})">
                            ${maintenance.completed ? 'Rückgängig' : 'Erledigt'}
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}
    
    // ========== GOOGLE MAPS METHODS ==========
    
  

    
    
    initializeMapsTab() {
        if (typeof google === 'undefined' || typeof google.maps.places === 'undefined') {
            this.showMapsError('Google Maps API nicht verfügbar. Prüfen Sie Ihren API-Key.');
            return;
        }
        this.getCurrentLocation();
    }
    
    getCurrentLocation() {
        if (navigator.geolocation) {
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
                () => {
                    this.showLocationError('Standortzugriff verweigert. Nutze manuellen Standort.');
                }
            );
        } else {
            this.showLocationError('Geolocation nicht unterstützt. Nutze manuellen Standort.');
        }
    }

// FÜGEN SIE DIESE NEUE FUNKTION HINZU

useCurrentLocation() {
    this.getCurrentLocation();
}


    initializeMap() {
        const mapElement = document.getElementById('map');
        if (!mapElement || !this.userLocation) return;

        mapElement.innerHTML = ''; // Ladeanzeige entfernen
        mapElement.classList.remove('maps-loading');

        this.map = new google.maps.Map(mapElement, {
            center: this.userLocation,
            zoom: 12,
            styles: this.isDarkMode ? this.getDarkMapStyles() : []
        });

        this.userMarker = new google.maps.Marker({
            position: this.userLocation,
            map: this.map,
            title: 'Aktueller Suchstandort'
        });
        
        // NEU: Event Listener für Klick auf die Karte
        this.map.addListener('click', (e) => {
            this.setManualLocation(e.latLng);
        });

        this.placesService = new google.maps.places.PlacesService(this.map);
        this.searchWorkshops();
        this.drawSearchCircle();
    }
    
    // NEUE FUNKTION: Setzt den Standort manuell
    setManualLocation(latLng) {
        this.userLocation = { lat: latLng.lat(), lng: latLng.lng() };
        
        // Marker an die neue Position verschieben
        this.userMarker.setPosition(latLng);
        this.map.panTo(latLng); // Karte auf neuen Punkt zentrieren
        
        this.updateLocationStatus('info', 'Manueller Standort gesetzt');
        
        // Suche vom neuen Standort aus neu starten
        this.searchWorkshops();
        this.drawSearchCircle();
    }

    searchWorkshops() {
        if (!this.placesService || !this.userLocation) return;
        
        const request = {
            location: this.userLocation,
            radius: this.searchRadius,
            type: 'car_repair'
        };
        
        this.placesService.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                this.displayWorkshops(results);
            } else {
                this.showMapsError('Keine Werkstätten gefunden oder Fehler bei der Suche.');
            }
        });
    }

    drawSearchCircle() {
        if (this.searchCircle) {
            this.searchCircle.setMap(null);
        }
        
        this.searchCircle = new google.maps.Circle({
            strokeColor: '#0d6efd',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#0d6efd',
            fillOpacity: 0.15,
            map: this.map,
            center: this.userLocation,
            radius: parseInt(this.searchRadius)
        });
    }

    displayWorkshops(workshops) {
        this.workshopsMarkers.forEach(marker => marker.setMap(null));
        this.workshopsMarkers = [];

        workshops.forEach(workshop => {
            const marker = new google.maps.Marker({
                position: workshop.geometry.location,
                map: this.map,
                title: workshop.name
            });
            this.workshopsMarkers.push(marker);
        });

        this.renderWorkshopsList(workshops);
    }

  


showWorkshopDetails(placeId) {
    const workshopModal = new bootstrap.Modal(document.getElementById('workshopModal'));
    const modalTitle = document.getElementById('workshopModalTitle');
    const modalBody = document.getElementById('workshopModalBody');
    const modalFooter = document.getElementById('workshopModalFooter');
    const websiteBtn = document.getElementById('workshopWebsiteBtn');
    const directionsBtn = document.getElementById('workshopDirectionsBtn');

    // Modal zurücksetzen und Ladeanzeige zeigen
    modalTitle.textContent = 'Lade Details...';
    modalBody.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    modalFooter.style.display = 'none';
    websiteBtn.style.display = 'none';
    
    workshopModal.show();

    const request = {
        placeId: placeId,
        fields: ['name', 'vicinity', 'website', 'geometry', 'formatted_phone_number']
    };

    this.placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            modalTitle.textContent = place.name;
            
            let detailsHtml = `<p><i class="bi bi-geo-alt me-2"></i>${place.vicinity}</p>`;
            if (place.formatted_phone_number) {
                detailsHtml += `<p><i class="bi bi-telephone me-2"></i><a href="tel:${place.formatted_phone_number}">${place.formatted_phone_number}</a></p>`;
            }
            modalBody.innerHTML = detailsHtml;

            if (place.website) {
                websiteBtn.href = place.website;
                websiteBtn.style.display = 'inline-block';
            }
            
            // --- FINALE KORREKTUR HIER ---
            // Dies ist die korrekte URL für Google Maps-Wegbeschreibungen
            const origin = `${this.userLocation.lat},${this.userLocation.lng}`;
            const destination = `${place.geometry.location.lat()},${place.geometry.location.lng()}`;
            directionsBtn.href = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
            
            modalFooter.style.display = 'flex';
        } else {
            modalTitle.textContent = 'Fehler';
            modalBody.innerHTML = 'Details konnten nicht geladen werden.';
        }
    });
}




renderWorkshopsList(workshops) {
    const workshopsList = document.getElementById('workshopsList');
    if (!workshopsList) return;

    if (workshops.length === 0) {
        workshopsList.innerHTML = '<div class="p-3 text-center text-muted">Keine Werkstätten in diesem Radius gefunden.</div>';
    } else {
        // Jedes Element bekommt einen onclick-Handler
        workshopsList.innerHTML = workshops.map(w => {
            const distance = this.calculateDistance(this.userLocation.lat, this.userLocation.lng, w.geometry.location.lat(), w.geometry.location.lng());
            return `
                <div class="workshop-item" onclick="app.showWorkshopDetails('${w.place_id}')">
                    <div class="workshop-info">
                        <h6>${w.name}</h6>
                        <p class="text-muted mb-0">${w.vicinity}</p>
                    </div>
                    <div class="workshop-distance">
                        ${distance.toFixed(1)} km
                    </div>
                </div>
            `;
        }).join('');
    }
    workshopsList.style.display = 'block';
}

    changeSearchRadius(radius) {
        this.searchRadius = parseInt(radius);
        if (this.map && this.userLocation) {
            this.drawSearchCircle();
            this.searchWorkshops();
        }
    }

    showLocationError(message) {
        this.updateLocationStatus('error', message);
        this.userLocation = { lat: 52.5200, lng: 13.4050 }; // Fallback auf Berlin
        this.initializeMap();
    }

    updateLocationStatus(type, message) {
        const statusElement = document.getElementById('locationStatus');
        if (statusElement) {
            statusElement.className = `location-status ${type}`;
            statusElement.innerHTML = `
                <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-exclamation-triangle' : 'bi-info'}"></i>
                <span>${message}</span>
            `;
        }
    }

    showMapsError(message) {
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = `<div class="maps-error"><p>${message}</p></div>`;
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius der Erde in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    getDarkMapStyles() {
        return [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
            { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
            { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
            { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
            { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
            { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
            { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
            { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
            { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
            { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
            { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
            { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
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