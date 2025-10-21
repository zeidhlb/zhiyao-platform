const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001;

const dbPath = path.resolve(__dirname, 'zhiyao.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Successfully connected to the SQLite database.');
    }
});

app.use(cors());

app.get('/api/drugs', (req, res) => {
    db.all("SELECT * FROM drugs", [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/interactions', (req, res) => {
    const query = `
        SELECT 
            i.id, 
            i.description, 
            i.risk_level, 
            GROUP_CONCAT(idr.drug_id) as drugs
        FROM interactions i
        JOIN interaction_drugs idr ON i.id = idr.interaction_id
        GROUP BY i.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        const interactions = rows.map(row => ({
            ...row,
            drugs: row.drugs.split(',')
        }));
        res.json(interactions);
    });
});

app.listen(PORT, () => {
    console.log(`后端服务已启动，正在监听 http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
