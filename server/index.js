// Minimal Express API connecting to SQL Server (CharityDB)
// Reads env from process.env. Do NOT commit secrets. Create a .env.server file and run with dotenv if desired.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Normalize server/instance/port
const envServerRaw = process.env.DB_SERVER || 'DESKTOP-ODVOV0B';
let host = envServerRaw;
let instanceFromServer = undefined;
if (envServerRaw.includes('\\')) {
  const parts = envServerRaw.split('\\');
  host = parts[0];
  instanceFromServer = parts[1];
}
const instanceName = process.env.DB_INSTANCE || instanceFromServer || 'SQLSERVER2019';
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined; // optional if you use a fixed port

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'sa2019',
  server: host,
  database: process.env.DB_NAME || 'QamarTrustDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: port ? undefined : instanceName, // use instanceName if port not provided
    port: port,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise;
async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config);
  }
  return poolPromise;
}

function mapDoneeRow(r) {
  // Map DB columns to frontend Donee shape
  return {
    id: r.Id,
    sNo: r.SNo !== null ? String(r.SNo) : '',
    status: r.Status || 'Active',
    gender: r.Gender || '',
    name: r.Name,
    relation: r.Relation || '',
    relationType: r.RelationType || '',
    cnic: r.CNIC,
    mobile: r.Mobile || '',
    payment: r.Payment || 'Cash',
    count: r.Count || 0,
    type: r.DoneeType || '',
    caseType: r.CaseType || '',
    amount: Number(r.Amount || 0),
    regDate: r.RegDate ? new Date(r.RegDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    familyMembers: r.FamilyMembers || 0,
    // Optional fields left blank for now
    profilePicture: undefined,
    attachments: [],
    dob: r.Dob ? new Date(r.Dob).toISOString().slice(0,10) : undefined,
    street: r.Street || '',
    village: r.Village || '',
    tehsil: r.Tehsil || '',
    district: r.District || '',
    province: r.Province || '',
    bank: r.Bank || '',
    accountNo: r.AccountNo || '',
    referredBy: r.ReferredBy || '',
    remarks: r.Remarks || '',
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// System Settings: Donee Types
app.get('/api/donee-types', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DoneeTypes' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.DoneeTypes (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL UNIQUE
        );
        INSERT INTO dbo.DoneeTypes (Name)
        VALUES (N'Factory Worker'), (N'Outdoor Worker');
      END;
      SELECT Id, Name FROM dbo.DoneeTypes ORDER BY Id ASC;
    `);
    res.json((result.recordset || []).map(r => ({ id: r.Id, name: r.Name })));
  } catch (err) {
    console.error('GET /api/donee-types error', err);
    res.status(500).json({ error: 'Failed to fetch donee types' });
  }
});

// System Configuration (single row)
app.get('/api/system-config', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemConfig' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.SystemConfig (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          TrustName NVARCHAR(200) NOT NULL DEFAULT N'',
          ContactNumber NVARCHAR(50) NOT NULL DEFAULT N'',
          SystemEmail NVARCHAR(255) NOT NULL DEFAULT N'',
          Address NVARCHAR(MAX) NOT NULL DEFAULT N'',
          TrustProfilePicture NVARCHAR(MAX) NULL,
          UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
        INSERT INTO dbo.SystemConfig (TrustName, ContactNumber, SystemEmail, Address, TrustProfilePicture)
        VALUES (N'', N'', N'', N'', NULL);
      END;
      SELECT TOP 1 * FROM dbo.SystemConfig ORDER BY Id ASC;
    `);
    res.json(r.recordset?.[0] || {});
  } catch (err) {
    console.error('GET /api/system-config error', err);
    res.status(500).json({ error: 'Failed to fetch system config' });
  }
});

app.put('/api/system-config', async (req, res) => {
  try {
    const b = req.body || {};
    const pool = await getPool();
    const r = await pool.request()
      .input('TrustName', sql.NVarChar(200), b.trustName || '')
      .input('ContactNumber', sql.NVarChar(50), b.contactNumber || '')
      .input('SystemEmail', sql.NVarChar(255), b.systemEmail || '')
      .input('Address', sql.NVarChar(sql.MAX), b.address || '')
      .input('TrustProfilePicture', sql.NVarChar(sql.MAX), b.trustProfilePicture || null)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemConfig' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.SystemConfig (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            TrustName NVARCHAR(200) NOT NULL DEFAULT N'',
            ContactNumber NVARCHAR(50) NOT NULL DEFAULT N'',
            SystemEmail NVARCHAR(255) NOT NULL DEFAULT N'',
            Address NVARCHAR(MAX) NOT NULL DEFAULT N'',
            TrustProfilePicture NVARCHAR(MAX) NULL,
            UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
          );
          INSERT INTO dbo.SystemConfig (TrustName, ContactNumber, SystemEmail, Address, TrustProfilePicture)
          VALUES (N'', N'', N'', N'', NULL);
        END;
        UPDATE dbo.SystemConfig SET 
          TrustName=@TrustName,
          ContactNumber=@ContactNumber,
          SystemEmail=@SystemEmail,
          Address=@Address,
          TrustProfilePicture=@TrustProfilePicture,
          UpdatedAt=SYSUTCDATETIME()
        WHERE Id=(SELECT TOP 1 Id FROM dbo.SystemConfig ORDER BY Id ASC);
        SELECT TOP 1 * FROM dbo.SystemConfig ORDER BY Id ASC;
      `);
    res.json(r.recordset?.[0] || {});
  } catch (err) {
    console.error('PUT /api/system-config error', err);
    res.status(500).json({ error: 'Failed to save system config' });
  }
});

// Cases and CaseUpdates
app.get('/api/cases', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Cases' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.Cases (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          DoneeId INT NULL,
          Name NVARCHAR(200) NOT NULL,
          Relation NVARCHAR(100) NULL,
          RelationType NVARCHAR(10) NULL,
          CNIC NVARCHAR(25) NOT NULL,
          Address NVARCHAR(500) NULL,
          Phone NVARCHAR(50) NULL,
          LastReceived DATE NULL,
          Type NVARCHAR(100) NULL,
          Amount DECIMAL(18,2) NULL,
          Reference NVARCHAR(200) NULL,
          Reason NVARCHAR(MAX) NULL,
          Voucher NVARCHAR(50) NULL,
          Status NVARCHAR(20) NOT NULL DEFAULT N'Pending',
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
      END;
      SELECT * FROM dbo.Cases ORDER BY Id DESC;
    `);
    res.json(r.recordset || []);
  } catch (err) {
    console.error('GET /api/cases error', err);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

app.post('/api/cases', async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.name || !b.cnic) return res.status(400).json({ error: 'name and cnic are required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('DoneeId', sql.Int, b.doneeId ?? null)
      .input('Name', sql.NVarChar(200), b.name)
      .input('Relation', sql.NVarChar(100), b.relation ?? null)
      .input('RelationType', sql.NVarChar(10), b.relationType ?? null)
      .input('CNIC', sql.NVarChar(25), b.cnic)
      .input('Address', sql.NVarChar(500), b.address ?? null)
      .input('Phone', sql.NVarChar(50), b.phone ?? null)
      .input('LastReceived', sql.Date, b.lastReceived ? new Date(b.lastReceived) : null)
      .input('Type', sql.NVarChar(100), b.type ?? null)
      .input('Amount', sql.Decimal(18,2), b.amount ?? null)
      .input('Reference', sql.NVarChar(200), b.reference ?? null)
      .input('Reason', sql.NVarChar(sql.MAX), b.reason ?? null)
      .input('Voucher', sql.NVarChar(50), b.voucher ?? null)
      .input('Status', sql.NVarChar(20), b.status || 'Pending')
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Cases' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.Cases (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            DoneeId INT NULL,
            Name NVARCHAR(200) NOT NULL,
            Relation NVARCHAR(100) NULL,
            RelationType NVARCHAR(10) NULL,
            CNIC NVARCHAR(25) NOT NULL,
            Address NVARCHAR(500) NULL,
            Phone NVARCHAR(50) NULL,
            LastReceived DATE NULL,
            Type NVARCHAR(100) NULL,
            Amount DECIMAL(18,2) NULL,
            Reference NVARCHAR(200) NULL,
            Reason NVARCHAR(MAX) NULL,
            Voucher NVARCHAR(50) NULL,
            Status NVARCHAR(20) NOT NULL DEFAULT N'Pending',
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
          );
        END;
        INSERT INTO dbo.Cases (DoneeId, Name, Relation, RelationType, CNIC, Address, Phone, LastReceived, Type, Amount, Reference, Reason, Voucher, Status)
        OUTPUT INSERTED.Id
        VALUES (@DoneeId, @Name, @Relation, @RelationType, @CNIC, @Address, @Phone, @LastReceived, @Type, @Amount, @Reference, @Reason, @Voucher, @Status);
      `);
    res.status(201).json({ id: r.recordset[0].Id });
  } catch (err) {
    console.error('POST /api/cases error', err);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

app.put('/api/cases/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const b = req.body || {};
    const pool = await getPool();
    const r = await pool.request()
      .input('Id', sql.Int, id)
      .input('DoneeId', sql.Int, b.doneeId ?? null)
      .input('Name', sql.NVarChar(200), b.name ?? null)
      .input('Relation', sql.NVarChar(100), b.relation ?? null)
      .input('RelationType', sql.NVarChar(10), b.relationType ?? null)
      .input('CNIC', sql.NVarChar(25), b.cnic ?? null)
      .input('Address', sql.NVarChar(500), b.address ?? null)
      .input('Phone', sql.NVarChar(50), b.phone ?? null)
      .input('LastReceived', sql.Date, b.lastReceived ? new Date(b.lastReceived) : null)
      .input('Type', sql.NVarChar(100), b.type ?? null)
      .input('Amount', sql.Decimal(18,2), b.amount ?? null)
      .input('Reference', sql.NVarChar(200), b.reference ?? null)
      .input('Reason', sql.NVarChar(sql.MAX), b.reason ?? null)
      .input('Voucher', sql.NVarChar(50), b.voucher ?? null)
      .input('Status', sql.NVarChar(20), b.status ?? null)
      .query(`
        UPDATE dbo.Cases SET
          DoneeId = COALESCE(@DoneeId, DoneeId),
          Name = COALESCE(@Name, Name),
          Relation = COALESCE(@Relation, Relation),
          RelationType = COALESCE(@RelationType, RelationType),
          CNIC = COALESCE(@CNIC, CNIC),
          Address = COALESCE(@Address, Address),
          Phone = COALESCE(@Phone, Phone),
          LastReceived = COALESCE(@LastReceived, LastReceived),
          Type = COALESCE(@Type, Type),
          Amount = COALESCE(@Amount, Amount),
          Reference = COALESCE(@Reference, Reference),
          Reason = COALESCE(@Reason, Reason),
          Voucher = COALESCE(@Voucher, Voucher),
          Status = COALESCE(@Status, Status)
        WHERE Id=@Id;
        SELECT @@ROWCOUNT AS rowsA;
      `);
    const rows = r.recordset?.[0]?.rowsA || 0;
    if (!rows) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/cases/:id error', err);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

app.delete('/api/cases/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const r = await pool.request().input('Id', sql.Int, id).query(`
      DELETE FROM dbo.CaseUpdates WHERE CaseId=@Id;
      DELETE FROM dbo.Cases WHERE Id=@Id;
    `);
    if (r.rowsAffected[1] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/cases/:id error', err);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// Case Updates
app.get('/api/cases/:id/updates', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const r = await pool.request().input('CaseId', sql.Int, id).query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CaseUpdates' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.CaseUpdates (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          CaseId INT NOT NULL,
          UpdateDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
          Notes NVARCHAR(MAX) NULL,
          Status NVARCHAR(50) NULL
        );
      END;
      SELECT * FROM dbo.CaseUpdates WHERE CaseId=@CaseId ORDER BY Id DESC;
    `);
    res.json(r.recordset || []);
  } catch (err) {
    console.error('GET /api/cases/:id/updates error', err);
    res.status(500).json({ error: 'Failed to fetch case updates' });
  }
});

app.post('/api/cases/:id/updates', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const b = req.body || {};
    const pool = await getPool();
    const r = await pool.request()
      .input('CaseId', sql.Int, id)
      .input('Notes', sql.NVarChar(sql.MAX), b.notes ?? null)
      .input('Status', sql.NVarChar(50), b.status ?? null)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CaseUpdates' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.CaseUpdates (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            CaseId INT NOT NULL,
            UpdateDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            Notes NVARCHAR(MAX) NULL,
            Status NVARCHAR(50) NULL
          );
        END;
        INSERT INTO dbo.CaseUpdates (CaseId, Notes, Status) OUTPUT INSERTED.Id VALUES (@CaseId, @Notes, @Status);
      `);
    res.status(201).json({ id: r.recordset[0].Id });
  } catch (err) {
    console.error('POST /api/cases/:id/updates error', err);
    res.status(500).json({ error: 'Failed to create case update' });
  }
});

app.put('/api/case-updates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const b = req.body || {};
    const pool = await getPool();
    const r = await pool.request()
      .input('Id', sql.Int, id)
      .input('Notes', sql.NVarChar(sql.MAX), b.notes ?? null)
      .input('Status', sql.NVarChar(50), b.status ?? null)
      .query(`
        UPDATE dbo.CaseUpdates SET Notes=COALESCE(@Notes, Notes), Status=COALESCE(@Status, Status) WHERE Id=@Id;
        SELECT @@ROWCOUNT AS rowsA;
      `);
    const rows = r.recordset?.[0]?.rowsA || 0;
    if (!rows) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/case-updates/:id error', err);
    res.status(500).json({ error: 'Failed to update case update' });
  }
});

app.delete('/api/case-updates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const r = await pool.request().input('Id', sql.Int, id).query(`DELETE FROM dbo.CaseUpdates WHERE Id=@Id;`);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/case-updates/:id error', err);
    res.status(500).json({ error: 'Failed to delete case update' });
  }
});

// Admin Users CRUD
app.get('/api/users', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.Users (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Username NVARCHAR(50) NOT NULL UNIQUE,
          Email NVARCHAR(255) NOT NULL UNIQUE,
          PasswordHash NVARCHAR(255) NOT NULL,
          Role NVARCHAR(50) NOT NULL DEFAULT N'Staff',
          Status NVARCHAR(20) NOT NULL DEFAULT N'Active',
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
      END;
      SELECT Id, Username, Email, Role, Status, CreatedAt FROM dbo.Users ORDER BY Id DESC;
    `);
    res.json(r.recordset || []);
  } catch (err) {
    console.error('GET /api/users error', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const body = req.body || {};
    const username = String(body.username || body.Username || '').trim();
    const email = String(body.email || body.Email || '').trim();
    const password = String(body.password || body.Password || '').trim();
    const role = String(body.role || body.Role || 'Staff');
    const status = String(body.status || body.Status || 'Active');
    if (!username || !email || !password) return res.status(400).json({ error: 'username, email, password are required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('Username', sql.NVarChar(50), username)
      .input('Email', sql.NVarChar(255), email)
      .input('PasswordHash', sql.NVarChar(255), password)
      .input('Role', sql.NVarChar(50), role)
      .input('Status', sql.NVarChar(20), status)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.Users (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Username NVARCHAR(50) NOT NULL UNIQUE,
            Email NVARCHAR(255) NOT NULL UNIQUE,
            PasswordHash NVARCHAR(255) NOT NULL,
            Role NVARCHAR(50) NOT NULL DEFAULT N'Staff',
            Status NVARCHAR(20) NOT NULL DEFAULT N'Active',
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
          );
        END;
        INSERT INTO dbo.Users (Username, Email, PasswordHash, Role, Status) OUTPUT INSERTED.Id
        VALUES (@Username, @Email, @PasswordHash, @Role, @Status);
      `);
    res.status(201).json({ id: r.recordset[0].Id });
  } catch (err) {
    const msg = String(err.message || '');
    if (msg.includes('UNIQUE') || msg.includes('duplicate')) return res.status(409).json({ error: 'Username or Email already exists' });
    console.error('POST /api/users error', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:email', async (req, res) => {
  try {
    const emailParam = String(req.params.email || '').trim();
    if (!emailParam) return res.status(400).json({ error: 'Invalid email' });
    const body = req.body || {};
    const username = body.username ?? body.Username ?? null;
    const emailNew = body.email ?? body.Email ?? null;
    const password = body.password ?? body.Password ?? null;
    const role = body.role ?? body.Role ?? null;
    const status = body.status ?? body.Status ?? null;
    const pool = await getPool();
    const r = await pool.request()
      .input('EmailParam', sql.NVarChar(255), emailParam)
      .input('Username', sql.NVarChar(50), username)
      .input('EmailNew', sql.NVarChar(255), emailNew)
      .input('PasswordHash', sql.NVarChar(255), password)
      .input('Role', sql.NVarChar(50), role)
      .input('Status', sql.NVarChar(20), status)
      .query(`
        IF NOT EXISTS (SELECT * FROM dbo.Users WHERE Email=@EmailParam)
          SELECT CAST(0 AS INT) AS rowsA;
        ELSE
        BEGIN
          IF @EmailNew IS NOT NULL AND @EmailNew <> @EmailParam AND EXISTS(SELECT 1 FROM dbo.Users WHERE Email=@EmailNew)
            THROW 50001, 'Email already exists', 1;
          UPDATE dbo.Users SET
            Username = COALESCE(@Username, Username),
            Email = COALESCE(@EmailNew, Email),
            PasswordHash = COALESCE(@PasswordHash, PasswordHash),
            Role = COALESCE(@Role, Role),
            Status = COALESCE(@Status, Status)
          WHERE Email=@EmailParam;
          SELECT @@ROWCOUNT AS rowsA;
        END;
      `);
    const rows = r.recordset?.[0]?.rowsA || 0;
    if (!rows) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    const msg = String(err.message || '');
    if (msg.includes('Email already exists') || msg.includes('UNIQUE') || msg.includes('duplicate')) return res.status(409).json({ error: 'Email already exists' });
    console.error('PUT /api/users/:email error', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:email', async (req, res) => {
  try {
    const emailParam = String(req.params.email || '').trim();
    if (!emailParam) return res.status(400).json({ error: 'Invalid email' });
    const pool = await getPool();
    const r = await pool.request().input('EmailParam', sql.NVarChar(255), emailParam).query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.Users (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Username NVARCHAR(50) NOT NULL UNIQUE,
          Email NVARCHAR(255) NOT NULL UNIQUE,
          PasswordHash NVARCHAR(255) NOT NULL,
          Role NVARCHAR(50) NOT NULL DEFAULT N'Staff',
          Status NVARCHAR(20) NOT NULL DEFAULT N'Active',
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
      END;
      DELETE FROM dbo.Users WHERE Email=@EmailParam;
    `);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/users/:email error', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const body = req.body || {};
    const u = String(body.username || '').trim();
    const p = String(body.password || '').trim();
    if (!u || !p) return res.status(400).json({ error: 'username and password are required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('U', sql.NVarChar(255), u)
      .input('P', sql.NVarChar(255), p)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.Users (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Username NVARCHAR(50) NOT NULL UNIQUE,
            Email NVARCHAR(255) NOT NULL UNIQUE,
            PasswordHash NVARCHAR(255) NOT NULL,
            Role NVARCHAR(50) NOT NULL DEFAULT N'Staff',
            Status NVARCHAR(20) NOT NULL DEFAULT N'Active',
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
          );
        END;
        IF NOT EXISTS (SELECT 1 FROM dbo.Users)
        BEGIN
          INSERT INTO dbo.Users (Username, Email, PasswordHash, Role, Status)
          VALUES (N'admin', N'admin@example.com', N'admin', N'Super Admin', N'Active');
        END;
        SELECT TOP 1 Username, Email, Role, Status, CreatedAt
        FROM dbo.Users
        WHERE (Username=@U OR Email=@U) AND PasswordHash=@P;
      `);
    const rec = r.recordset?.[0];
    if (!rec) return res.status(401).json({ error: 'Invalid credentials' });
    if (String(rec.Status) !== 'Active') return res.status(403).json({ error: 'Inactive user' });
    res.json({ username: rec.Username, email: rec.Email, role: rec.Role, status: rec.Status, createdAt: rec.CreatedAt });
  } catch (err) {
    console.error('POST /api/login error', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// System Settings: References (people who refer)
app.get('/api/references', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Referrers' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.Referrers (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(200) NOT NULL UNIQUE
        );
      END;
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'References' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        INSERT INTO dbo.Referrers (Name)
        SELECT r.Name FROM dbo.[References] r
        WHERE NOT EXISTS (SELECT 1 FROM dbo.Referrers x WHERE x.Name = r.Name);
      END;
      IF NOT EXISTS (SELECT 1 FROM dbo.Referrers)
      BEGIN
        INSERT INTO dbo.Referrers (Name)
        VALUES (N'قمر خان'), (N'شادہ شاہ'), (N'جمال ہاشمی'), (N'حمید اللہ نیازی');
      END;
      SELECT Id, Name FROM dbo.Referrers ORDER BY Id ASC;
    `);
    res.json((result.recordset || []).map(r => ({ id: r.Id, name: r.Name })));
  } catch (err) {
    console.error('GET /api/references error', err);
    res.status(500).json({ error: 'Failed to fetch references' });
  }
});

app.post('/api/references', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('Name', sql.NVarChar(200), name)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Referrers' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.Referrers (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(200) NOT NULL UNIQUE
          );
        END;
        INSERT INTO dbo.Referrers (Name) OUTPUT INSERTED.Id VALUES (@Name);
      `);
    res.status(201).json({ id: r.recordset[0].Id });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Name already exists' });
    console.error('POST /api/references error', err);
    res.status(500).json({ error: 'Failed to create reference' });
  }
});

app.put('/api/references/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('Id', sql.Int, id)
      .input('Name', sql.NVarChar(200), name)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Referrers' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.Referrers (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(200) NOT NULL UNIQUE
          );
        END;
        UPDATE dbo.Referrers SET Name=@Name WHERE Id=@Id;
      `);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Name already exists' });
    console.error('PUT /api/references/:id error', err);
    res.status(500).json({ error: 'Failed to update reference' });
  }
});

app.delete('/api/references/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const r = await pool.request().input('Id', sql.Int, id).query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Referrers' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.Referrers (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(200) NOT NULL UNIQUE
        );
      END;
      DELETE FROM dbo.Referrers WHERE Id=@Id;
    `);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/references/:id error', err);
    res.status(500).json({ error: 'Failed to delete reference' });
  }
});
// System Settings: Donation Types
app.get('/api/donation-types', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DonationTypes' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.DonationTypes (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL UNIQUE
        );
        INSERT INTO dbo.DonationTypes (Name)
        VALUES (N'زکوٰۃ'), (N'صدقہ'), (N'عطیہ');
      END;
      SELECT Id, Name FROM dbo.DonationTypes ORDER BY Id ASC;
    `);
    res.json((result.recordset || []).map(r => ({ id: r.Id, name: r.Name })));
  } catch (err) {
    console.error('GET /api/donation-types error', err);
    res.status(500).json({ error: 'Failed to fetch donation types' });
  }
});

app.post('/api/donation-types', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('Name', sql.NVarChar(100), name)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DonationTypes' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.DonationTypes (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL UNIQUE
          );
        END;
        INSERT INTO dbo.DonationTypes (Name) OUTPUT INSERTED.Id VALUES (@Name);
      `);
    res.status(201).json({ id: r.recordset[0].Id });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Name already exists' });
    console.error('POST /api/donation-types error', err);
    res.status(500).json({ error: 'Failed to create donation type' });
  }
});

app.put('/api/donation-types/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('Id', sql.Int, id)
      .input('Name', sql.NVarChar(100), name)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DonationTypes' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.DonationTypes (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL UNIQUE
          );
        END;
        UPDATE dbo.DonationTypes SET Name=@Name WHERE Id=@Id;
      `);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Name already exists' });
    console.error('PUT /api/donation-types/:id error', err);
    res.status(500).json({ error: 'Failed to update donation type' });
  }
});

app.delete('/api/donation-types/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const r = await pool.request().input('Id', sql.Int, id).query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DonationTypes' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.DonationTypes (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL UNIQUE
        );
      END;
      DELETE FROM dbo.DonationTypes WHERE Id=@Id;
    `);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/donation-types/:id error', err);
    res.status(500).json({ error: 'Failed to delete donation type' });
  }
});

// System Settings: Banks
app.get('/api/banks', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Banks' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.Banks (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(150) NOT NULL UNIQUE
        );
      END;
      SELECT Id, Name FROM dbo.Banks ORDER BY Id ASC;
    `);
    res.json((result.recordset || []).map(r => ({ id: r.Id, name: r.Name })));
  } catch (err) {
    console.error('GET /api/banks error', err);
    res.status(500).json({ error: 'Failed to fetch banks' });
  }
});

app.post('/api/banks', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('Name', sql.NVarChar(150), name)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Banks' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.Banks (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(150) NOT NULL UNIQUE
          );
        END;
        INSERT INTO dbo.Banks (Name) OUTPUT INSERTED.Id VALUES (@Name);
      `);
    res.status(201).json({ id: r.recordset[0].Id });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Name already exists' });
    console.error('POST /api/banks error', err);
    res.status(500).json({ error: 'Failed to create bank' });
  }
});

app.put('/api/banks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('Id', sql.Int, id)
      .input('Name', sql.NVarChar(150), name)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Banks' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.Banks (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(150) NOT NULL UNIQUE
          );
        END;
        UPDATE dbo.Banks SET Name=@Name WHERE Id=@Id;
      `);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Name already exists' });
    console.error('PUT /api/banks/:id error', err);
    res.status(500).json({ error: 'Failed to update bank' });
  }
});

app.delete('/api/banks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const r = await pool.request().input('Id', sql.Int, id).query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Banks' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.Banks (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(150) NOT NULL UNIQUE
        );
      END;
      DELETE FROM dbo.Banks WHERE Id=@Id;
    `);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/banks/:id error', err);
    res.status(500).json({ error: 'Failed to delete bank' });
  }
});

app.post('/api/donee-types', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('Name', sql.NVarChar(100), name)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DoneeTypes' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.DoneeTypes (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL UNIQUE
          );
        END;
        INSERT INTO dbo.DoneeTypes (Name) OUTPUT INSERTED.Id VALUES (@Name);
      `);
    res.status(201).json({ id: r.recordset[0].Id });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Name already exists' });
    console.error('POST /api/donee-types error', err);
    res.status(500).json({ error: 'Failed to create donee type' });
  }
});

app.put('/api/donee-types/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('Id', sql.Int, id)
      .input('Name', sql.NVarChar(100), name)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DoneeTypes' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.DoneeTypes (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL UNIQUE
          );
        END;
        UPDATE dbo.DoneeTypes SET Name=@Name WHERE Id=@Id;
      `);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Name already exists' });
    console.error('PUT /api/donee-types/:id error', err);
    res.status(500).json({ error: 'Failed to update donee type' });
  }
});

app.delete('/api/donee-types/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const r = await pool.request().input('Id', sql.Int, id).query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DoneeTypes' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.DoneeTypes (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL UNIQUE
        );
      END;
      DELETE FROM dbo.DoneeTypes WHERE Id=@Id;
    `);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/donee-types/:id error', err);
    res.status(500).json({ error: 'Failed to delete donee type' });
  }
});

// Donations
app.get('/api/donations', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Donations' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.Donations (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          DoneeId INT NOT NULL,
          CNIC NVARCHAR(25) NULL,
          Amount DECIMAL(18,2) NOT NULL,
          [Type] NVARCHAR(50) NOT NULL,
          [Case] NVARCHAR(100) NULL,
          Payment NVARCHAR(50) NULL,
          DonationDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
          Remarks NVARCHAR(MAX) NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
          CONSTRAINT FK_Donations_Donees FOREIGN KEY (DoneeId) REFERENCES dbo.Donees(Id)
        );
      END;
      SELECT d.Id, d.DoneeId, dz.Name AS DoneeName, d.CNIC, d.Amount, d.[Type], d.[Case], d.Payment,
             d.DonationDate, d.Remarks
      FROM dbo.Donations d
      LEFT JOIN dbo.Donees dz ON dz.Id = d.DoneeId
      ORDER BY d.Id DESC;
    `);
    const rows = result.recordset.map(r => ({
      voucherNo: r.Id,
      doneeName: r.DoneeName || '',
      cnic: r.CNIC || '',
      amount: Number(r.Amount || 0),
      type: r.Type || '',
      case: r.Case || '',
      date: r.DonationDate ? new Date(r.DonationDate).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '') : ''
    }));
    res.json(rows);
  } catch (err) {
    console.error('GET /api/donations error', err);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

app.post('/api/donations', async (req, res) => {
  try {
    const body = req.body || {};
    const { doneeId, amount, type, case: caseType, payment, date, remarks } = body;
    if (!doneeId || !amount || !type) return res.status(400).json({ error: 'doneeId, amount and type are required' });
    const pool = await getPool();
    const look = await pool.request().input('DoneeId', sql.Int, Number(doneeId)).query('SELECT TOP 1 CNIC FROM dbo.Donees WHERE Id=@DoneeId;');
    if (!look.recordset.length) return res.status(400).json({ error: 'Invalid doneeId' });
    const cnic = look.recordset[0].CNIC || null;
    const q = await pool.request()
      .input('DoneeId', sql.Int, Number(doneeId))
      .input('CNIC', sql.NVarChar(25), cnic)
      .input('Amount', sql.Decimal(18,2), Number(amount))
      .input('Type', sql.NVarChar(50), String(type))
      .input('Case', sql.NVarChar(100), caseType || null)
      .input('Payment', sql.NVarChar(50), payment || 'Cash')
      .input('DonationDate', sql.DateTime2, date ? new Date(date) : new Date())
      .input('Remarks', sql.NVarChar(sql.MAX), remarks || null)
      .query(`INSERT INTO dbo.Donations (DoneeId, CNIC, Amount, [Type], [Case], Payment, DonationDate, Remarks)
              OUTPUT INSERTED.Id VALUES (@DoneeId, @CNIC, @Amount, @Type, @Case, @Payment, @DonationDate, @Remarks);`);
    res.status(201).json({ id: q.recordset[0].Id });
  } catch (err) {
    console.error('POST /api/donations error', err);
    res.status(500).json({ error: 'Failed to create donation' });
  }
});

app.put('/api/donations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const { doneeId, amount, type, case: caseType, payment, date, remarks } = req.body || {};
    const pool = await getPool();
    const look = doneeId ? await pool.request().input('DoneeId', sql.Int, Number(doneeId)).query('SELECT TOP 1 CNIC FROM dbo.Donees WHERE Id=@DoneeId;') : { recordset: [] };
    const cnic = look.recordset?.[0]?.CNIC || null;
    const r = await pool.request()
      .input('Id', sql.Int, id)
      .input('DoneeId', sql.Int, doneeId ?? null)
      .input('CNIC', sql.NVarChar(25), cnic)
      .input('Amount', sql.Decimal(18,2), amount ?? null)
      .input('Type', sql.NVarChar(50), type ?? null)
      .input('Case', sql.NVarChar(100), caseType ?? null)
      .input('Payment', sql.NVarChar(50), payment ?? null)
      .input('DonationDate', sql.DateTime2, date ? new Date(date) : null)
      .input('Remarks', sql.NVarChar(sql.MAX), remarks ?? null)
      .query(`UPDATE dbo.Donations SET 
                DoneeId = COALESCE(@DoneeId, DoneeId),
                CNIC = COALESCE(@CNIC, CNIC),
                Amount = COALESCE(@Amount, Amount),
                [Type] = COALESCE(@Type, [Type]),
                [Case] = COALESCE(@Case, [Case]),
                Payment = COALESCE(@Payment, Payment),
                DonationDate = COALESCE(@DonationDate, DonationDate),
                Remarks = COALESCE(@Remarks, Remarks)
              WHERE Id=@Id;`);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/donations/:id error', err);
    res.status(500).json({ error: 'Failed to update donation' });
  }
});

app.delete('/api/donations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const r = await pool.request().input('Id', sql.Int, id).query('DELETE FROM dbo.Donations WHERE Id=@Id;');
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/donations/:id error', err);
    res.status(500).json({ error: 'Failed to delete donation' });
  }
});
app.get('/api/donees', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id, SNo, Status, Gender, Name, Relation, RelationType, CNIC, Mobile, Amount, CaseType, DoneeType,
             Payment, [Count] AS [Count], FamilyMembers, RegDate, Dob, Street, Village, Tehsil, District, Province,
             Bank, AccountNo, ReferredBy, Remarks
      FROM dbo.Donees
      ORDER BY ISNULL(SNo, 0) ASC, Id DESC;
    `);
    const rows = result.recordset.map(mapDoneeRow);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/donees error', err);
    res.status(500).json({ error: 'Failed to fetch donees' });
  }
});

app.get('/api/donees/:id/family', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const result = await pool.request()
      .input('DoneeId', sql.Int, id)
      .query(`SELECT Id, DoneeId, Name, Relationship, CNIC FROM dbo.DoneeFamily WHERE DoneeId = @DoneeId ORDER BY Id ASC;`);
    res.json(result.recordset);
  } catch (err) {
    console.error('GET /api/donees/:id/family error', err);
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

app.get('/api/donees/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const result = await pool.request()
      .input('Id', sql.Int, id)
      .query(`SELECT Id, SNo, Status, Gender, Name, Relation, RelationType, CNIC, Mobile, Amount, CaseType, DoneeType,
                     Payment, [Count] AS [Count], FamilyMembers, RegDate, Dob, Street, Village, Tehsil, District, Province,
                     Bank, AccountNo, ReferredBy, Remarks
              FROM dbo.Donees WHERE Id = @Id;`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(mapDoneeRow(result.recordset[0]));
  } catch (err) {
    console.error('GET /api/donees/:id error', err);
    res.status(500).json({ error: 'Failed to fetch donee' });
  }
});

// Create Donee with optional family members
app.post('/api/donees', async (req, res) => {
  const body = req.body || {};
  // Basic validation
  if (!body.name || !body.cnic) return res.status(400).json({ error: 'name and cnic are required' });
  const tx = new sql.Transaction(await getPool());
  try {
    await tx.begin();
    // Pre-check: duplicate CNIC
    const check = new sql.Request(tx);
    check.input('CNIC', sql.NVarChar(25), body.cnic);
    const dup = await check.query('SELECT TOP 1 Id FROM dbo.Donees WHERE CNIC=@CNIC');
    if (dup.recordset && dup.recordset.length > 0) {
      await tx.rollback();
      return res.status(409).json({ error: 'CNIC already exists', id: dup.recordset[0].Id });
    }

    const r = new sql.Request(tx);
    r.input('SNo', sql.Int, body.sNo ? parseInt(body.sNo, 10) : null);
    r.input('Status', sql.NVarChar(20), body.status || 'Active');
    r.input('Gender', sql.NVarChar(10), body.gender || null);
    r.input('Name', sql.NVarChar(200), body.name);
    r.input('Relation', sql.NVarChar(100), body.relation || null);
    r.input('RelationType', sql.NVarChar(50), body.relationType || null);
    r.input('CNIC', sql.NVarChar(25), body.cnic);
    r.input('Mobile', sql.NVarChar(25), body.mobile || null);
    r.input('Amount', sql.Decimal(18,2), body.amount ?? null);
    r.input('CaseType', sql.NVarChar(100), body.caseType || null);
    r.input('DoneeType', sql.NVarChar(100), body.type || null);
    r.input('Payment', sql.NVarChar(50), body.payment || null);
    r.input('Count', sql.Int, body.count ?? null);
    r.input('FamilyMembers', sql.Int, body.familyMembers ?? (Array.isArray(body.family) ? body.family.length : null));
    r.input('RegDate', sql.Date, body.regDate ? new Date(body.regDate) : null);
    r.input('Dob', sql.Date, body.dob ? new Date(body.dob) : null);
    r.input('Street', sql.NVarChar(200), body.street || null);
    r.input('Village', sql.NVarChar(200), body.village || null);
    r.input('Tehsil', sql.NVarChar(200), body.tehsil || null);
    r.input('District', sql.NVarChar(200), body.district || null);
    r.input('Province', sql.NVarChar(200), body.province || null);
    r.input('Bank', sql.NVarChar(200), body.bank || null);
    r.input('AccountNo', sql.NVarChar(100), body.accountNo || null);
    r.input('ReferredBy', sql.NVarChar(200), body.referredBy || null);
    r.input('Remarks', sql.NVarChar(sql.MAX), body.remarks || null);
    const ins = await r.query(`
      INSERT INTO dbo.Donees (
        SNo, Status, Gender, Name, Relation, RelationType, CNIC, Mobile, Amount, CaseType, DoneeType,
        Payment, [Count], FamilyMembers, RegDate, Dob, Street, Village, Tehsil, District, Province,
        Bank, AccountNo, ReferredBy, Remarks
      ) OUTPUT INSERTED.Id
      VALUES (
        @SNo, @Status, @Gender, @Name, @Relation, @RelationType, @CNIC, @Mobile, @Amount, @CaseType, @DoneeType,
        @Payment, @Count, @FamilyMembers, @RegDate, @Dob, @Street, @Village, @Tehsil, @District, @Province,
        @Bank, @AccountNo, @ReferredBy, @Remarks
      );
    `);
    const newId = ins.recordset[0].Id;
    // Insert family if provided
    if (Array.isArray(body.family) && body.family.length) {
      for (const f of body.family) {
        const fr = new sql.Request(tx);
        fr.input('DoneeId', sql.Int, newId);
        fr.input('Name', sql.NVarChar(200), f.name || '');
        fr.input('Relationship', sql.NVarChar(100), f.relationship || '');
        fr.input('CNIC', sql.NVarChar(25), f.cnic || null);
        await fr.query(`INSERT INTO dbo.DoneeFamily (DoneeId, Name, Relationship, CNIC) VALUES (@DoneeId, @Name, @Relationship, @CNIC);`);
      }
    }
    await tx.commit();
    res.status(201).json({ id: newId });
  } catch (err) {
    try { await tx.rollback(); } catch {}
    console.error('POST /api/donees error', err);
    res.status(500).json({ error: 'Failed to create donee' });
  }
});

// Update Donee and replace family list
app.put('/api/donees/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const body = req.body || {};
  const tx = new sql.Transaction(await getPool());
  try {
    await tx.begin();
    const r = new sql.Request(tx);
    r.input('Id', sql.Int, id);
    r.input('SNo', sql.Int, body.sNo ? parseInt(body.sNo, 10) : null);
    r.input('Status', sql.NVarChar(20), body.status || 'Active');
    r.input('Gender', sql.NVarChar(10), body.gender || null);
    r.input('Name', sql.NVarChar(200), body.name);
    r.input('Relation', sql.NVarChar(100), body.relation || null);
    r.input('RelationType', sql.NVarChar(50), body.relationType || null);
    r.input('CNIC', sql.NVarChar(25), body.cnic);
    r.input('Mobile', sql.NVarChar(25), body.mobile || null);
    r.input('Amount', sql.Decimal(18,2), body.amount ?? null);
    r.input('CaseType', sql.NVarChar(100), body.caseType || null);
    r.input('DoneeType', sql.NVarChar(100), body.type || null);
    r.input('Payment', sql.NVarChar(50), body.payment || null);
    r.input('Count', sql.Int, body.count ?? null);
    r.input('FamilyMembers', sql.Int, body.familyMembers ?? (Array.isArray(body.family) ? body.family.length : null));
    r.input('RegDate', sql.Date, body.regDate ? new Date(body.regDate) : null);
    r.input('Dob', sql.Date, body.dob ? new Date(body.dob) : null);
    r.input('Street', sql.NVarChar(200), body.street || null);
    r.input('Village', sql.NVarChar(200), body.village || null);
    r.input('Tehsil', sql.NVarChar(200), body.tehsil || null);
    r.input('District', sql.NVarChar(200), body.district || null);
    r.input('Province', sql.NVarChar(200), body.province || null);
    r.input('Bank', sql.NVarChar(200), body.bank || null);
    r.input('AccountNo', sql.NVarChar(100), body.accountNo || null);
    r.input('ReferredBy', sql.NVarChar(200), body.referredBy || null);
    r.input('Remarks', sql.NVarChar(sql.MAX), body.remarks || null);
    // Pre-check: CNIC must be unique across other rows
    const dup = await r.query(`SELECT 1 AS x FROM dbo.Donees WHERE CNIC=@CNIC AND Id<>@Id`);
    if (dup.recordset && dup.recordset.length > 0) {
      await tx.rollback();
      return res.status(409).json({ error: 'CNIC already exists for another record' });
    }

    const upd = await r.query(`
      UPDATE dbo.Donees SET
        SNo=@SNo, Status=@Status, Gender=@Gender, Name=@Name, Relation=@Relation, RelationType=@RelationType,
        CNIC=@CNIC, Mobile=@Mobile, Amount=@Amount, CaseType=@CaseType, DoneeType=@DoneeType,
        Payment=@Payment, [Count]=@Count, FamilyMembers=@FamilyMembers, RegDate=@RegDate, Dob=@Dob,
        Street=@Street, Village=@Village, Tehsil=@Tehsil, District=@District, Province=@Province,
        Bank=@Bank, AccountNo=@AccountNo, ReferredBy=@ReferredBy, Remarks=@Remarks
      WHERE Id=@Id;
    `);
    if (upd.rowsAffected[0] === 0) throw new Error('Not found');
    // Replace family: delete then insert
    const del = new sql.Request(tx);
    del.input('DoneeId', sql.Int, id);
    await del.query('DELETE FROM dbo.DoneeFamily WHERE DoneeId=@DoneeId;');
    if (Array.isArray(body.family) && body.family.length) {
      for (const f of body.family) {
        const fr = new sql.Request(tx);
        fr.input('DoneeId', sql.Int, id);
        fr.input('Name', sql.NVarChar(200), f.name || '');
        fr.input('Relationship', sql.NVarChar(100), f.relationship || '');
        fr.input('CNIC', sql.NVarChar(25), f.cnic || null);
        await fr.query(`INSERT INTO dbo.DoneeFamily (DoneeId, Name, Relationship, CNIC) VALUES (@DoneeId, @Name, @Relationship, @CNIC);`);
      }
    }
    await tx.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await tx.rollback(); } catch {}
    console.error('PUT /api/donees/:id error', err);
    if (String(err.message).includes('Not found')) return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: 'Failed to update donee' });
  }
});

// Delete Donee (family rows will cascade if FK has ON DELETE CASCADE)
app.delete('/api/donees/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const result = await pool.request().input('Id', sql.Int, id).query('DELETE FROM dbo.Donees WHERE Id=@Id;');
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/donees/:id error', err);
    res.status(500).json({ error: 'Failed to delete donee' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT Id, Username, Email, Role, Status, CreatedAt FROM dbo.Users ORDER BY Id ASC;`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    const pool = await getPool();
    const result = await pool.request()
      .input('Username', sql.NVarChar(50), String(username))
      .query(`SELECT TOP 1 Id, Username, Email, PasswordHash, Role, Status, CreatedAt FROM dbo.Users WHERE Username = @Username;`);
    if (!result.recordset.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.recordset[0];
    if (String(user.PasswordHash) !== String(password)) return res.status(401).json({ error: 'Invalid credentials' });
    // return user profile without password
    res.json({ id: user.Id, username: user.Username, email: user.Email, role: user.Role, status: user.Status, createdAt: user.CreatedAt });
  } catch (err) {
    console.error('POST /api/login error', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/dev/seed-users', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden' });
    const pool = await getPool();
    await pool.request().batch(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.Users (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Username NVARCHAR(50) NOT NULL UNIQUE,
          Email NVARCHAR(255) NOT NULL UNIQUE,
          PasswordHash NVARCHAR(255) NOT NULL,
          Role NVARCHAR(50) NOT NULL DEFAULT 'Staff',
          Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
      END;

      MERGE dbo.Users AS target
      USING (VALUES
        ('danish','danish@qamartrust.org','admin','Super Admin','Active'),
        ('manager_user','manager@qamartrust.org','manager','Manager','Active'),
        ('ali','ali@qamartrust.org','user','Staff','Inactive')
      ) AS src(Username, Email, PasswordPlain, Role, Status)
      ON target.Username = src.Username
      WHEN MATCHED THEN UPDATE SET Email = src.Email, Role = src.Role, Status = src.Status
      WHEN NOT MATCHED THEN INSERT (Username, Email, PasswordHash, Role, Status)
        VALUES (src.Username, src.Email, CONVERT(NVARCHAR(255), src.PasswordPlain), src.Role, src.Status);
    `);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Seeding failed' });
  }
});

// System Settings: Donation Cases
app.get('/api/donation-cases', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DonationCases' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.DonationCases (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL UNIQUE
        );
        INSERT INTO dbo.DonationCases (Name)
        VALUES (N'ایک بار'), (N'ماہانہ'), (N'سالانہ');
      END;
      SELECT Id, Name FROM dbo.DonationCases ORDER BY Id ASC;
    `);
    const rows = (result.recordset || []).map(r => ({ id: r.Id, name: r.Name }));
    res.json(rows);
  } catch (err) {
    console.error('GET /api/donation-cases error', err);
    res.status(500).json({ error: 'Failed to fetch donation cases' });
  }
});

app.post('/api/donation-cases', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('Name', sql.NVarChar(100), name)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DonationCases' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.DonationCases (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL UNIQUE
          );
        END;
        INSERT INTO dbo.DonationCases (Name) OUTPUT INSERTED.Id VALUES (@Name);
      `);
    return res.status(201).json({ id: r.recordset[0].Id });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Name already exists' });
    console.error('POST /api/donation-cases error', err);
    res.status(500).json({ error: 'Failed to create donation case' });
  }
});

app.put('/api/donation-cases/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const pool = await getPool();
    const r = await pool.request()
      .input('Id', sql.Int, id)
      .input('Name', sql.NVarChar(100), name)
      .query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DonationCases' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE dbo.DonationCases (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(100) NOT NULL UNIQUE
          );
        END;
        UPDATE dbo.DonationCases SET Name=@Name WHERE Id=@Id;
      `);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Name already exists' });
    console.error('PUT /api/donation-cases/:id error', err);
    res.status(500).json({ error: 'Failed to update donation case' });
  }
});

app.delete('/api/donation-cases/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const pool = await getPool();
    const r = await pool.request().input('Id', sql.Int, id).query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DonationCases' AND schema_id = SCHEMA_ID('dbo'))
      BEGIN
        CREATE TABLE dbo.DonationCases (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(100) NOT NULL UNIQUE
        );
      END;
      DELETE FROM dbo.DonationCases WHERE Id=@Id;
    `);
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/donation-cases/:id error', err);
    res.status(500).json({ error: 'Failed to delete donation case' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`API listening on http://localhost:${PORT}`);
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    console.log(`Connected to SQL Server at ${host}${instanceName ? `\\${instanceName}` : ''}${port ? `:${port}` : ''} / DB=${config.database}`);
  } catch (e) {
    console.error('Failed to connect to SQL Server. Check DB settings and network.');
    console.error(e);
  }
});
