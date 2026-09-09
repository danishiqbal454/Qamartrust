import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Get all admins/users
router.get('/users', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT Id, Username, Email, Status, CreatedBy, CreatedAt, UpdatedAt
            FROM Users
            ORDER BY CreatedAt DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['Active', 'Inactive'].includes(status)) {
            return res.status(400).json({ error: 'Valid status is required (Active or Inactive)' });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, status)
            .query(`
                UPDATE Users 
                SET Status = @status, UpdatedAt = GETDATE()
                OUTPUT INSERTED.Id, INSERTED.Username, INSERTED.Email, INSERTED.Status, INSERTED.CreatedBy, INSERTED.CreatedAt, INSERTED.UpdatedAt
                WHERE Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
    try {
        const pool = await getConnection();
        
        // Get various statistics
        const doneeCount = await pool.request().query('SELECT COUNT(*) as count FROM Donees WHERE Status = \'Active\'');
        const donationCount = await pool.request().query('SELECT COUNT(*) as count FROM Donations');
        const totalDonationAmount = await pool.request().query('SELECT ISNULL(SUM(Amount), 0) as total FROM Donations WHERE Status = \'Completed\'');
        const pendingInquiries = await pool.request().query('SELECT COUNT(*) as count FROM Inquiries WHERE Status = \'Open\'');
        const activeCases = await pool.request().query('SELECT COUNT(*) as count FROM CaseTracking WHERE Status = \'Open\'');

        const stats = {
            totalDonees: doneeCount.recordset[0].count,
            totalDonations: donationCount.recordset[0].count,
            totalDonationAmount: totalDonationAmount.recordset[0].total,
            pendingInquiries: pendingInquiries.recordset[0].count,
            activeCases: activeCases.recordset[0].count
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

export default router;
