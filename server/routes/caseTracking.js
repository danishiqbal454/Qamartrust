import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Get all case tracking records
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                ct.*,
                d.Name as DoneeName,
                u1.Username as AssignedToUsername,
                u2.Username as CreatedByUsername
            FROM CaseTracking ct
            LEFT JOIN Donees d ON ct.DoneeId = d.Id
            LEFT JOIN Users u1 ON ct.AssignedTo = u1.Id
            LEFT JOIN Users u2 ON ct.CreatedBy = u2.Id
            ORDER BY ct.CreatedAt DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching case tracking records:', error);
        res.status(500).json({ error: 'Failed to fetch case tracking records' });
    }
});

// Create new case tracking record
router.post('/', async (req, res) => {
    try {
        const { doneeId, caseNumber, title, description, priority, assignedTo, createdBy } = req.body;

        if (!doneeId || !caseNumber || !title) {
            return res.status(400).json({ error: 'Donee ID, Case Number, and Title are required' });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('doneeId', sql.Int, doneeId)
            .input('caseNumber', sql.NVarChar, caseNumber)
            .input('title', sql.NVarChar, title)
            .input('description', sql.NVarChar, description || null)
            .input('priority', sql.NVarChar, priority || 'Medium')
            .input('assignedTo', sql.Int, assignedTo || null)
            .input('createdBy', sql.Int, createdBy || null)
            .query(`
                INSERT INTO CaseTracking (DoneeId, CaseNumber, Title, Description, Priority, AssignedTo, CreatedBy)
                OUTPUT INSERTED.*
                VALUES (@doneeId, @caseNumber, @title, @description, @priority, @assignedTo, @createdBy)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating case tracking record:', error);
        res.status(500).json({ error: 'Failed to create case tracking record' });
    }
});

export default router;
