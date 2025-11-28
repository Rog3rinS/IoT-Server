const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const PORT = process.env.PORT || 8080;
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'sensors.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH, (err) => {
	if (err) {
		console.error('Failed to open database', err);
		process.exit(1);
	}
});

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_type TEXT,
  value REAL,
  unit TEXT,
  timestamp TEXT,
  raw_json TEXT
);
`;

db.serialize(() => {
	db.run(CREATE_TABLE_SQL);
});

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

function insertReading(reading, cb) {
	const sensorType = reading.type || reading.sensor || reading.sensorType || reading.sensor_type || null;
	const value = (reading.value !== undefined) ? reading.value : (reading.v !== undefined ? reading.v : null);
	const unit = reading.unit || reading.u || null;
	const timestamp = reading.timestamp || reading.time || new Date().toISOString();
	const raw = JSON.stringify(reading);

	const sql = `INSERT INTO readings (sensor_type, value, unit, timestamp, raw_json) VALUES (?, ?, ?, ?, ?)`;
	db.run(sql, [sensorType, value, unit, timestamp, raw], function(err) {
		if (err) return cb(err);
		cb(null, { id: this.lastID });
	});
}

app.post('/api/sensor/data', async (req, res) => {
	const payload = req.body;

	if (Array.isArray(payload)) {
		const results = [];
		let pending = payload.length;
		if (pending === 0) return res.status(400).json({ error: 'Empty array' });

		payload.forEach((r, i) => {
			insertReading(r, (err, info) => {
				if (err) results[i] = { error: err.message };
				else results[i] = info;
				pending -= 1;
				if (pending === 0) res.json({ inserted: results });
			});
		});
	} else if (typeof payload === 'object' && payload !== null) {
		insertReading(payload, (err, info) => {
			if (err) return res.status(500).json({ error: err.message });
			res.json({ inserted: info });
		});
	} else {
		res.status(400).json({ error: 'Payload must be an object or array of objects' });
	}
});

app.get('/readings', (req, res) => {
	const limit = parseInt(req.query.limit || '50', 10);
	db.all('SELECT * FROM readings ORDER BY id DESC LIMIT ?', [limit], (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows);
	});
});

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
	console.log(`Database file: ${DB_PATH}`);
});

process.on('SIGINT', () => {
	console.log('Shutting down...');
	db.close(() => process.exit(0));
});
