const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool } = require('./db');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Test Route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server läuft!' });
});

// ========== FAHRZEUG ROUTES ==========

// Alle Fahrzeuge abrufen
app.get('/api/cars', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM cars ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Fehler beim Abrufen der Fahrzeuge:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Fahrzeuge' });
    }
});

// Neues Fahrzeug hinzufügen
app.post('/api/cars', async (req, res) => {
    const { model, year, mileage } = req.body;
    
    if (!model || !year || !mileage) {
        return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }
    
    try {
        // Prüfen ob es das erste Auto ist (dann wird es automatisch ausgewählt)
        const [existingCars] = await pool.execute('SELECT COUNT(*) as count FROM cars');
        const isFirstCar = existingCars[0].count === 0;
        
        const [result] = await pool.execute(
            'INSERT INTO cars (model, year, mileage, selected) VALUES (?, ?, ?, ?)',
            [model, year, mileage, isFirstCar]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            model, 
            year, 
            mileage, 
            selected: isFirstCar,
            message: 'Fahrzeug erfolgreich hinzugefügt' 
        });
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Fahrzeugs:', error);
        res.status(500).json({ error: 'Fehler beim Hinzufügen des Fahrzeugs' });
    }
});

// Fahrzeug bearbeiten
app.put('/api/cars/:id', async (req, res) => {
    const { id } = req.params;
    const { model, year, mileage } = req.body;
    
    try {
        await pool.execute(
            'UPDATE cars SET model = ?, year = ?, mileage = ? WHERE id = ?',
            [model, year, mileage, id]
        );
        
        res.json({ message: 'Fahrzeug erfolgreich aktualisiert' });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Fahrzeugs:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Fahrzeugs' });
    }
});

// Fahrzeug löschen
app.delete('/api/cars/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Prüfen ob es das ausgewählte Auto war
        const [selectedCar] = await pool.execute('SELECT selected FROM cars WHERE id = ?', [id]);
        const wasSelected = selectedCar[0]?.selected;
        
        // Auto löschen (Wartungen werden automatisch durch CASCADE gelöscht)
        await pool.execute('DELETE FROM cars WHERE id = ?', [id]);
        
        // Wenn das gelöschte Auto ausgewählt war, wähle das erste verfügbare aus
        if (wasSelected) {
            await pool.execute(
                'UPDATE cars SET selected = TRUE WHERE id = (SELECT id FROM (SELECT id FROM cars LIMIT 1) as temp)'
            );
        }
        
        res.json({ message: 'Fahrzeug erfolgreich gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen des Fahrzeugs:', error);
        res.status(500).json({ error: 'Fehler beim Löschen des Fahrzeugs' });
    }
});

// Fahrzeug auswählen
app.post('/api/cars/:id/select', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Alle anderen Fahrzeuge abwählen
        await pool.execute('UPDATE cars SET selected = FALSE');
        
        // Das gewählte Fahrzeug auswählen
        await pool.execute('UPDATE cars SET selected = TRUE WHERE id = ?', [id]);
        
        res.json({ message: 'Fahrzeug erfolgreich ausgewählt' });
    } catch (error) {
        console.error('Fehler beim Auswählen des Fahrzeugs:', error);
        res.status(500).json({ error: 'Fehler beim Auswählen des Fahrzeugs' });
    }
});

// ========== WARTUNG ROUTES ==========

// Alle Wartungen für ein Fahrzeug abrufen
app.get('/api/cars/:carId/maintenances', async (req, res) => {
    const { carId } = req.params;
    
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM maintenances WHERE car_id = ? ORDER BY next_date ASC',
            [carId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Fehler beim Abrufen der Wartungen:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Wartungen' });
    }
});

// Alle Wartungen abrufen (für Kalender)
app.get('/api/maintenances', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT m.*, c.model as car_model 
            FROM maintenances m 
            JOIN cars c ON m.car_id = c.id 
            ORDER BY m.next_date ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Fehler beim Abrufen aller Wartungen:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Wartungen' });
    }
});

// Neue Wartung hinzufügen
app.post('/api/maintenances', async (req, res) => {
    const { car_id, type, last_date, next_date, interval_value, interval_type, mileage_interval } = req.body;
    
    try {
        const [result] = await pool.execute(
            `INSERT INTO maintenances 
            (car_id, type, last_date, next_date, interval_value, interval_type, mileage_interval) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [car_id, type, last_date, next_date, interval_value, interval_type, mileage_interval]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Wartung erfolgreich hinzugefügt' 
        });
    } catch (error) {
        console.error('Fehler beim Hinzufügen der Wartung:', error);
        res.status(500).json({ error: 'Fehler beim Hinzufügen der Wartung' });
    }
});

// Wartung bearbeiten
app.put('/api/maintenances/:id', async (req, res) => {
    const { id } = req.params;
    const { type, last_date, next_date, interval_value, interval_type, mileage_interval } = req.body;
    
    try {
        await pool.execute(
            `UPDATE maintenances 
            SET type = ?, last_date = ?, next_date = ?, interval_value = ?, interval_type = ?, mileage_interval = ?
            WHERE id = ?`,
            [type, last_date, next_date, interval_value, interval_type, mileage_interval, id]
        );
        
        res.json({ message: 'Wartung erfolgreich aktualisiert' });
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Wartung:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren der Wartung' });
    }
});

// Wartung als erledigt markieren
app.post('/api/maintenances/:id/complete', async (req, res) => {
    const { id } = req.params;
    const { createNew, nextDate } = req.body;
    
    try {
        // Aktuelle Wartung als erledigt markieren
        await pool.execute(
            'UPDATE maintenances SET completed = TRUE, status = "completed" WHERE id = ?',
            [id]
        );
        
        // Wenn eine neue Wartung erstellt werden soll
        if (createNew && nextDate) {
            // Hole die Daten der aktuellen Wartung
            const [maintenance] = await pool.execute('SELECT * FROM maintenances WHERE id = ?', [id]);
            const current = maintenance[0];
            
            // Erstelle neue Wartung
            await pool.execute(
                `INSERT INTO maintenances 
                (car_id, type, last_date, next_date, interval_value, interval_type, mileage_interval, status) 
                VALUES (?, ?, CURDATE(), ?, ?, ?, ?, "ok")`,
                [current.car_id, current.type, nextDate, current.interval_value, current.interval_type, current.mileage_interval]
            );
        }
        
        res.json({ message: 'Wartung erfolgreich abgeschlossen' });
    } catch (error) {
        console.error('Fehler beim Abschließen der Wartung:', error);
        res.status(500).json({ error: 'Fehler beim Abschließen der Wartung' });
    }
});

// Wartung löschen
app.delete('/api/maintenances/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        await pool.execute('DELETE FROM maintenances WHERE id = ?', [id]);
        res.json({ message: 'Wartung erfolgreich gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen der Wartung:', error);
        res.status(500).json({ error: 'Fehler beim Löschen der Wartung' });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`🚗 Auto Wartungs-Manager Server läuft auf http://localhost:${PORT}`);
});