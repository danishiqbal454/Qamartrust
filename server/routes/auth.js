import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT u.*, e.FirstName, e.LastName, e.EmployeeCode, e.Department, e.Designation FROM Users u LEFT JOIN Employees e ON u.EmployeeID = e.EmployeeID WHERE u.Username = @username AND u.Status = \'Active\'');

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.recordset[0];
        
        // Compare the provided password with the stored password
        // For demo, passwords are stored in plain text
        const isValidPassword = password === user.PasswordHash;

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await pool.request()
            .input('userID', sql.Int, user.UserID)
            .query('UPDATE Users SET LastLogin = GETUTCDATE() WHERE UserID = @userID');

        const token = jwt.sign(
            { userId: user.UserID, username: user.Username, role: user.Role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.UserID,
                username: user.Username,
                email: user.Email,
                role: user.Role,
                status: user.Status,
                firstName: user.FirstName,
                lastName: user.LastName,
                employeeCode: user.EmployeeCode,
                department: user.Department,
                designation: user.Designation
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const pool = await getConnection();
        
        // Check if user already exists
        const existingUser = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Username = @username OR Email = @email');

        if (existingUser.recordset.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('passwordHash', sql.NVarChar, hashedPassword)
            .query(`
                INSERT INTO Users (Username, Email, PasswordHash, CreatedBy) 
                OUTPUT INSERTED.Id, INSERTED.Username, INSERTED.Email, INSERTED.Status
                VALUES (@username, @email, @passwordHash, 'System')
            `);

        const newUser = result.recordset[0];

        const token = jwt.sign(
            { userId: newUser.Id, username: newUser.Username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser.Id,
                username: newUser.Username,
                email: newUser.Email,
                status: newUser.Status
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

export default router;
