import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Get all donees
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                d.*,
                dt.Name as DoneeTypeName,
                r.Name as ReferenceName
            FROM Donees d
            LEFT JOIN DoneeTypes dt ON d.DoneeTypeId = dt.Id
            LEFT JOIN References r ON d.ReferenceId = r.Id
            ORDER BY d.CreatedAt DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching donees:', error);
        res.status(500).json({ error: 'Failed to fetch donees' });
    }
});

// Get single donee
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    d.*,
                    dt.Name as DoneeTypeName,
                    r.Name as ReferenceName
                FROM Donees d
                LEFT JOIN DoneeTypes dt ON d.DoneeTypeId = dt.Id
                LEFT JOIN References r ON d.ReferenceId = r.Id
                WHERE d.Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Donee not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching donee:', error);
        res.status(500).json({ error: 'Failed to fetch donee' });
    }
});

// Create new donee
router.post('/', async (req, res) => {
    try {
        const { name, fatherName, cnic, phoneNumber, address, doneeTypeId, referenceId } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('fatherName', sql.NVarChar, fatherName || null)
            .input('cnic', sql.NVarChar, cnic || null)
            .input('phoneNumber', sql.NVarChar, phoneNumber || null)
            .input('address', sql.NVarChar, address || null)
            .input('doneeTypeId', sql.Int, doneeTypeId || null)
            .input('referenceId', sql.Int, referenceId || null)
            .query(`
                INSERT INTO Donees (Name, FatherName, CNIC, PhoneNumber, Address, DoneeTypeId, ReferenceId)
                OUTPUT INSERTED.*
                VALUES (@name, @fatherName, @cnic, @phoneNumber, @address, @doneeTypeId, @referenceId)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating donee:', error);
        res.status(500).json({ error: 'Failed to create donee' });
    }
});

// Update donee
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, fatherName, cnic, phoneNumber, address, doneeTypeId, referenceId, status } = req.body;

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('fatherName', sql.NVarChar, fatherName || null)
            .input('cnic', sql.NVarChar, cnic || null)
            .input('phoneNumber', sql.NVarChar, phoneNumber || null)
            .input('address', sql.NVarChar, address || null)
            .input('doneeTypeId', sql.Int, doneeTypeId || null)
            .input('referenceId', sql.Int, referenceId || null)
            .input('status', sql.NVarChar, status || 'Active')
            .query(`
                UPDATE Donees 
                SET Name = @name, 
                    FatherName = @fatherName, 
                    CNIC = @cnic, 
                    PhoneNumber = @phoneNumber, 
                    Address = @address, 
                    DoneeTypeId = @doneeTypeId, 
                    ReferenceId = @referenceId,
                    Status = @status,
                    UpdatedAt = GETDATE()
                OUTPUT INSERTED.*
                WHERE Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Donee not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error updating donee:', error);
        res.status(500).json({ error: 'Failed to update donee' });
    }
});

// Delete donee
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Donees WHERE Id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Donee not found' });
        }

        res.json({ message: 'Donee deleted successfully' });
    } catch (error) {
        console.error('Error deleting donee:', error);
        res.status(500).json({ error: 'Failed to delete donee' });
    }
});

export default router;
