const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'zhiyao.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTablesAndImportData();
    }
});

function createTablesAndImportData() {
    db.serialize(() => {
        // 1. 创建药品表 (drugs)
        db.run(`CREATE TABLE IF NOT EXISTS drugs (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            instruction TEXT,
            side_effects TEXT
        )`, (err) => {
            if (err) return console.error('Error creating drugs table', err.message);
            console.log('Table "drugs" created or already exists.');
            importJsonData('../data/drugs.json', 'drugs');
        });

        // 2. 创建相互作用表 (interactions)
        db.run(`CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            risk_level TEXT NOT NULL
        )`, (err) => {
            if (err) return console.error('Error creating interactions table', err.message);
            console.log('Table "interactions" created or already exists.');
        });

        // 3. 创建关联表 (interaction_drugs) 用于表示多对多关系
        db.run(`CREATE TABLE IF NOT EXISTS interaction_drugs (
            interaction_id INTEGER,
            drug_id TEXT,
            FOREIGN KEY (interaction_id) REFERENCES interactions(id),
            FOREIGN KEY (drug_id) REFERENCES drugs(id),
            PRIMARY KEY (interaction_id, drug_id)
        )`, (err) => {
            if (err) return console.error('Error creating interaction_drugs table', err.message);
            console.log('Table "interaction_drugs" created or already exists.');
            setTimeout(() => {
                 importJsonData('../data/interactions.json', 'interactions');
            }, 1000); 
        });
    });
}

function importJsonData(jsonPath, tableName) {
    const filePath = path.resolve(__dirname, jsonPath);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading ${jsonPath}`, err);
            return;
        }
        const jsonData = JSON.parse(data);

        db.serialize(() => {
            if (tableName === 'drugs') {
                const stmt = db.prepare("INSERT OR IGNORE INTO drugs (id, name, instruction, side_effects) VALUES (?, ?, ?, ?)");
                jsonData.forEach(drug => {
                    stmt.run(drug.id, drug.name, drug.instruction, JSON.stringify(drug.side_effects));
                });
                stmt.finalize((err) => {
                    if (err) return console.error('Error finalizing drug import', err.message);
                    console.log('Drug data imported successfully.');
                });
            }

            if (tableName === 'interactions') {
                const interactionStmt = db.prepare("INSERT INTO interactions (description, risk_level) VALUES (?, ?)");
                const assocStmt = db.prepare("INSERT OR IGNORE INTO interaction_drugs (interaction_id, drug_id) VALUES (?, ?)");

                function insertInteraction(index) {
                    if (index >= jsonData.length) {
                        interactionStmt.finalize();
                        assocStmt.finalize((err) => {
                            if (err) return console.error('Error finalizing interaction import', err.message);
                            console.log('Interaction data imported successfully.');
                            db.close((err) => {
                                if (err) console.error('Error closing database', err.message);
                                else console.log('Database connection closed.');
                            });
                        });
                        return;
                    }

                    const interaction = jsonData[index];
                    interactionStmt.run(interaction.description, interaction.risk_level, function(err) {
                        if (err) {
                            console.error('Error inserting interaction', err.message);
                            insertInteraction(index + 1);
                            return;
                        }
                        const interactionId = this.lastID;
                        interaction.drugs.forEach(drugId => {
                            assocStmt.run(interactionId, drugId);
                        });
                        insertInteraction(index + 1);
                    });
                }
                insertInteraction(0);
            }
        });
    });
}
