import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Get all inquiries
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                i.*,
                d.Name as DoneeName,
                u1.Username as AssignedToUsername,
                u2.Username as CreatedByUsername
            FROM Inquiries i
            LEFT JOIN Donees d ON i.DoneeId = d.Id
            LEFT JOIN Users u1 ON i.AssignedTo = u1.Id
            LEFT JOIN Users u2 ON i.CreatedBy = u2.Id
            ORDER BY i.CreatedAt DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

// Create new inquiry
router.post('/', async (req, res) => {
    try {
        const { doneeId, subject, description, priority, assignedTo, createdBy } = req.body;

        if (!doneeId || !subject) {
            return res.status(400).json({ error: 'Donee ID and Subject are required' });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('doneeId', sql.Int, doneeId)
            .input('subject', sql.NVarChar, subject)
            .input('description', sql.NVarChar, description || null)
            .input('priority', sql.NVarChar, priority || 'Medium')
            .input('assignedTo', sql.Int, assignedTo || null)
            .input('createdBy', sql.Int, createdBy || null)
            .query(`
                INSERT INTO Inquiries (DoneeId, Subject, Description, Priority, AssignedTo, CreatedBy)
                OUTPUT INSERTED.*
                VALUES (@doneeId, @subject, @description, @priority, @assignedTo, @createdBy)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating inquiry:', error);
        res.status(500).json({ error: 'Failed to create inquiry' });
    }
});

export default router;
