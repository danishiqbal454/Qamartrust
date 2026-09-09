import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Get all donation cases
router.get('/donation-cases', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT * FROM DonationCases WHERE IsActive = 1 ORDER BY Name
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching donation cases:', error);
        res.status(500).json({ error: 'Failed to fetch donation cases' });
    }
});

// Update donee type
router.put('/donee-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description || null)
            .input('isActive', sql.Bit, isActive !== undefined ? isActive : true)
            .query(`
                UPDATE DoneeTypes 
                SET Name = @name,
                    Description = @description,
                    IsActive = @isActive,
                    UpdatedAt = GETDATE()
                OUTPUT INSERTED.*
                WHERE Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Donee type not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error updating donee type:', error);
        res.status(500).json({ error: 'Failed to update donee type' });
    }
});

// Delete donee type (soft delete)
router.delete('/donee-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE DoneeTypes SET IsActive = 0 WHERE Id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Donee type not found' });
        }

        res.json({ message: 'Donee type deleted successfully' });
    } catch (error) {
        console.error('Error deleting donee type:', error);
        res.status(500).json({ error: 'Failed to delete donee type' });
    }
});

// Create donation case
router.post('/donation-cases', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description || null)
            .query(`
                INSERT INTO DonationCases (Name, Description)
                OUTPUT INSERTED.*
                VALUES (@name, @description)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating donation case:', error);
        res.status(500).json({ error: 'Failed to create donation case' });
    }
});

// Update donation case
router.put('/donation-cases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description || null)
            .input('isActive', sql.Bit, isActive !== undefined ? isActive : true)
            .query(`
                UPDATE DonationCases 
                SET Name = @name, 
                    Description = @description, 
                    IsActive = @isActive,
                    UpdatedAt = GETDATE()
                OUTPUT INSERTED.*
                WHERE Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Donation case not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error updating donation case:', error);
        res.status(500).json({ error: 'Failed to update donation case' });
    }
});

// Delete donation case
router.delete('/donation-cases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE DonationCases SET IsActive = 0 WHERE Id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Donation case not found' });
        }

        res.json({ message: 'Donation case deleted successfully' });
    } catch (error) {
        console.error('Error deleting donation case:', error);
        res.status(500).json({ error: 'Failed to delete donation case' });
    }
});

// Get all donee types
router.get('/donee-types', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT * FROM DoneeTypes WHERE IsActive = 1 ORDER BY Name
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching donee types:', error);
        res.status(500).json({ error: 'Failed to fetch donee types' });
    }
});

// Create donee type
router.post('/donee-types', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description || null)
            .query(`
                INSERT INTO DoneeTypes (Name, Description)
                OUTPUT INSERTED.*
                VALUES (@name, @description)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating donee type:', error);
        res.status(500).json({ error: 'Failed to create donee type' });
    }
});

// Get all references
router.get('/references', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT * FROM [References] WHERE IsActive = 1 ORDER BY Name
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching references:', error);
        res.status(500).json({ error: 'Failed to fetch references' });
    }
});

// Create reference
router.post('/references', async (req, res) => {
    try {
        const { name, contactInfo } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('contactInfo', sql.NVarChar, contactInfo || null)
            .query(`
                INSERT INTO [References] (Name, ContactInfo)
                OUTPUT INSERTED.*
                VALUES (@name, @contactInfo)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating reference:', error);
        res.status(500).json({ error: 'Failed to create reference' });
    }
});

export default router;
