import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getConnection } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import doneeRoutes from './routes/donees.js';
import donationRoutes from './routes/donations.js';
import inquiryRoutes from './routes/inquiries.js';
import caseTrackingRoutes from './routes/caseTracking.js';
import adminRoutes from './routes/admin.js';
import systemSettingsRoutes from './routes/systemSettings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
app.get('/api/health', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT 1 as test');
        res.json({ 
            status: 'OK', 
            database: 'Connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'Error', 
            database: 'Disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donees', doneeRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/case-tracking', caseTrackingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system-settings', systemSettingsRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: error.message 
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
