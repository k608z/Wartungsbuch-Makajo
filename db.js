
const mysql = require('mysql2/promise');

// Datenbank-Konfiguration
const dbConfig = {
    host: 'localhost',
    user: 'root',        // Der Benutzer aus unserem SQL-Setup
    password: '', // Das Passwort aus unserem SQL-Setup
    database: 'autowartung_db',   // Die Datenbank aus unserem SQL-Setup
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Connection Pool erstellen (effiziente Verbindungsverwaltung)
const pool = mysql.createPool(dbConfig);

// Test-Funktion für die Datenbankverbindung
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Erfolgreich mit MySQL verbunden!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Fehler bei MySQL-Verbindung:', error.message);
        return false;
    }
}

// Verbindung beim Start testen
testConnection();

module.exports = { pool };