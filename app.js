const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const config = require('./config');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Create MySQL connection
const db = mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.message);
        process.exit(1); // Exit the process if database connection fails
    }
    console.log('Connected to MySQL database.');
});

// Create a new user
app.post('/api/users', (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    const values = [username, password, role];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error creating user:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ status: 'User created', userId: result.insertId });
    });
});

// Delete a user
app.delete('/api/users/:userId', (req, res) => {
    const { userId } = req.params;

    const sql = 'DELETE FROM users WHERE id = ?';
    const values = [userId];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error deleting user:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ status: 'User deleted' });
    });
});

// Log user activity
app.post('/api/users/:userId/activity', (req, res) => {
    const { userId } = req.params;
    const { action_type, ip_address, browser_info } = req.body;

    if (!action_type || !ip_address || !browser_info) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const sql = 'INSERT INTO user_activity (user_id, action_type, ip_address, browser_info) VALUES (?, ?, ?, ?)';
    const values = [userId, action_type, ip_address, browser_info];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error logging activity:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ status: 'Activity logged' });
    });
});

// Retrieve user activity
app.get('/api/users/:userId/activity', (req, res) => {
    const { userId } = req.params;
    const { action_type, start_timestamp, end_timestamp } = req.query;

    let sql = 'SELECT * FROM user_activity WHERE user_id = ?';
    const values = [userId];

    if (action_type) {
        sql += ' AND action_type = ?';
        values.push(action_type);
    }
    if (start_timestamp) {
        sql += ' AND timestamp >= ?';
        values.push(start_timestamp);
    }
    if (end_timestamp) {
        sql += ' AND timestamp <= ?';
        values.push(end_timestamp);
    }

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error retrieving activities:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// Update user activity
app.put('/api/users/:userId/activity/:activityId', (req, res) => {
    const { userId, activityId } = req.params;
    const { action_type, ip_address, browser_info } = req.body;

    if (!action_type || !ip_address || !browser_info) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const sql = 'UPDATE user_activity SET action_type = ?, ip_address = ?, browser_info = ? WHERE id = ? AND user_id = ?';
    const values = [action_type, ip_address, browser_info, activityId, userId];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating activity:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ status: 'Activity updated' });
    });
});

// Delete user activity
app.delete('/api/users/:userId/activity/:activityId', (req, res) => {
    const { userId, activityId } = req.params;

    const sql = 'DELETE FROM user_activity WHERE id = ? AND user_id = ?';
    const values = [activityId, userId];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error deleting activity:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ status: 'Activity deleted' });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});