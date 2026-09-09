import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Get all donations
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                don.*,
                donee.Name as DoneeName,
                dc.Name as DonationCaseName,
                u.Username as CreatedByUsername
            FROM Donations don
            LEFT JOIN Donees donee ON don.DoneeId = donee.Id
            LEFT JOIN DonationCases dc ON don.DonationCaseId = dc.Id
            LEFT JOIN Users u ON don.CreatedBy = u.Id
            ORDER BY don.CreatedAt DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({ error: 'Failed to fetch donations' });
    }
});

// Get single donation
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    don.*,
                    donee.Name as DoneeName,
                    dc.Name as DonationCaseName,
                    u.Username as CreatedByUsername
                FROM Donations don
                LEFT JOIN Donees donee ON don.DoneeId = donee.Id
                LEFT JOIN DonationCases dc ON don.DonationCaseId = dc.Id
                LEFT JOIN Users u ON don.CreatedBy = u.Id
                WHERE don.Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching donation:', error);
        res.status(500).json({ error: 'Failed to fetch donation' });
    }
});

// Create new donation
router.post('/', async (req, res) => {
    try {
        const { doneeId, donationCaseId, amount, description, createdBy } = req.body;

        if (!doneeId || !donationCaseId || !amount) {
            return res.status(400).json({ error: 'Donee ID, Donation Case ID, and Amount are required' });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('doneeId', sql.Int, doneeId)
            .input('donationCaseId', sql.Int, donationCaseId)
            .input('amount', sql.Decimal(10, 2), amount)
            .input('description', sql.NVarChar, description || null)
            .input('createdBy', sql.Int, createdBy || null)
            .query(`
                INSERT INTO Donations (DoneeId, DonationCaseId, Amount, Description, CreatedBy)
                OUTPUT INSERTED.*
                VALUES (@doneeId, @donationCaseId, @amount, @description, @createdBy)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error('Error creating donation:', error);
        res.status(500).json({ error: 'Failed to create donation' });
    }
});

// Update donation
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { doneeId, donationCaseId, amount, description, status } = req.body;

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('doneeId', sql.Int, doneeId)
            .input('donationCaseId', sql.Int, donationCaseId)
            .input('amount', sql.Decimal(10, 2), amount)
            .input('description', sql.NVarChar, description || null)
            .input('status', sql.NVarChar, status || 'Pending')
            .query(`
                UPDATE Donations 
                SET DoneeId = @doneeId,
                    DonationCaseId = @donationCaseId,
                    Amount = @amount,
                    Description = @description,
                    Status = @status,
                    UpdatedAt = GETDATE()
                OUTPUT INSERTED.*
                WHERE Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error updating donation:', error);
        res.status(500).json({ error: 'Failed to update donation' });
    }
});

// Delete donation
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Donations WHERE Id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        res.json({ message: 'Donation deleted successfully' });
    } catch (error) {
        console.error('Error deleting donation:', error);
        res.status(500).json({ error: 'Failed to delete donation' });
    }
});

// Get donation statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as TotalDonations,
                SUM(Amount) as TotalAmount,
                AVG(Amount) as AverageAmount,
                COUNT(CASE WHEN Status = 'Pending' THEN 1 END) as PendingDonations,
                COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as CompletedDonations
            FROM Donations
        `);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching donation statistics:', error);
        res.status(500).json({ error: 'Failed to fetch donation statistics' });
    }
});

export default router;
