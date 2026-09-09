/* Create QamarTrustDB database, tables, and seed data for Qamar Khan Trust */

-- 1) Create database if missing
IF DB_ID(N'QamarTrustDB') IS NULL
BEGIN
    PRINT 'Creating database QamarTrustDB...';
    CREATE DATABASE QamarTrustDB;
END
GO

-- 2) Use the database
USE QamarTrustDB;
GO

-- 3) Create tables if missing

-- Users table for authentication
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Users...';
    CREATE TABLE dbo.Users (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Username     NVARCHAR(50) NOT NULL UNIQUE,
        Email        NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        Role         NVARCHAR(50) NOT NULL DEFAULT N'Staff',
        Status       NVARCHAR(20) NOT NULL DEFAULT N'Active',
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- Donees table (beneficiaries)
IF OBJECT_ID(N'dbo.Donees', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Donees...';
    CREATE TABLE dbo.Donees (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        SNo             INT NULL,
        Status          NVARCHAR(20) NOT NULL DEFAULT N'Active',
        Gender          NVARCHAR(10) NULL,
        Name            NVARCHAR(200) NOT NULL,
        Relation        NVARCHAR(100) NULL,
        RelationType    NVARCHAR(50) NULL,
        CNIC            NVARCHAR(25) NOT NULL,
        Mobile          NVARCHAR(25) NULL,
        Amount          DECIMAL(18,2) NULL,
        CaseType        NVARCHAR(100) NULL,
        DoneeType       NVARCHAR(100) NULL,
        Payment         NVARCHAR(50) NULL,
        [Count]         INT NULL,
        FamilyMembers   INT NULL,
        RegDate         DATE NULL,
        Dob             DATE NULL,
        Street          NVARCHAR(200) NULL,
        Village         NVARCHAR(200) NULL,
        Tehsil          NVARCHAR(200) NULL,
        District        NVARCHAR(200) NULL,
        Province        NVARCHAR(200) NULL,
        Bank            NVARCHAR(200) NULL,
        AccountNo       NVARCHAR(100) NULL,
        ReferredBy      NVARCHAR(200) NULL,
        Remarks         NVARCHAR(MAX) NULL,
        CreatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE UNIQUE INDEX IX_Donees_CNIC ON dbo.Donees(CNIC);
END
GO

-- DoneeFamily table
IF OBJECT_ID(N'dbo.DoneeFamily', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.DoneeFamily...';
    CREATE TABLE dbo.DoneeFamily (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        DoneeId      INT NOT NULL,
        Name         NVARCHAR(200) NOT NULL,
        Relationship NVARCHAR(100) NOT NULL,
        CNIC         NVARCHAR(25) NULL,
        Age          INT NULL,
        Gender       NVARCHAR(10) NULL,
        Education    NVARCHAR(100) NULL,
        Occupation   NVARCHAR(100) NULL,
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_DoneeFamily_Donees
            FOREIGN KEY (DoneeId) REFERENCES dbo.Donees(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_DoneeFamily_DoneeId ON dbo.DoneeFamily(DoneeId);
END
GO

-- Donations table
IF OBJECT_ID(N'dbo.Donations', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Donations...';
    CREATE TABLE dbo.Donations (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        DoneeId      INT NULL,
        DonorName    NVARCHAR(200) NULL,
        DonorPhone   NVARCHAR(25) NULL,
        DonorEmail   NVARCHAR(255) NULL,
        Amount       DECIMAL(18,2) NOT NULL,
        DonationType NVARCHAR(50) NOT NULL,
        PaymentMethod NVARCHAR(50) NULL,
        DonationDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        ReceiptNo    NVARCHAR(50) NULL,
        Status       NVARCHAR(20) NOT NULL DEFAULT N'Received',
        Remarks      NVARCHAR(MAX) NULL,
        CreatedBy    INT NULL,
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Donations_Donees
            FOREIGN KEY (DoneeId) REFERENCES dbo.Donees(Id),
        CONSTRAINT FK_Donations_Users
            FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id)
    );
END
GO

-- Cases table for case tracking
IF OBJECT_ID(N'dbo.Cases', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Cases...';
    CREATE TABLE dbo.Cases (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        CaseNo       NVARCHAR(50) NOT NULL UNIQUE,
        DoneeId      INT NOT NULL,
        Title        NVARCHAR(500) NOT NULL,
        Description  NVARCHAR(MAX) NULL,
        Status       NVARCHAR(50) NOT NULL DEFAULT N'Open',
        Priority     NVARCHAR(20) NOT NULL DEFAULT N'Medium',
        AssignedTo   INT NULL,
        CreatedBy    INT NULL,
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Cases_Donees
            FOREIGN KEY (DoneeId) REFERENCES dbo.Donees(Id),
        CONSTRAINT FK_Cases_AssignedTo
            FOREIGN KEY (AssignedTo) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Cases_CreatedBy
            FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id)
    );
END
GO

-- CaseUpdates table
IF OBJECT_ID(N'dbo.CaseUpdates', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.CaseUpdates...';
    CREATE TABLE dbo.CaseUpdates (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        CaseId       INT NOT NULL,
        UpdateText   NVARCHAR(MAX) NOT NULL,
        UpdatedBy    INT NULL,
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CaseUpdates_Cases
            FOREIGN KEY (CaseId) REFERENCES dbo.Cases(Id) ON DELETE CASCADE,
        CONSTRAINT FK_CaseUpdates_Users
            FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id)
    );
END
GO

-- Inquiries table
IF OBJECT_ID(N'dbo.Inquiries', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Inquiries...';
    CREATE TABLE dbo.Inquiries (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Name         NVARCHAR(200) NOT NULL,
        Email        NVARCHAR(255) NULL,
        Phone        NVARCHAR(25) NULL,
        Subject      NVARCHAR(500) NOT NULL,
        Message      NVARCHAR(MAX) NOT NULL,
        Status       NVARCHAR(20) NOT NULL DEFAULT N'Pending',
        Response     NVARCHAR(MAX) NULL,
        RespondedBy  INT NULL,
        RespondedAt  DATETIME2 NULL,
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Inquiries_Users
            FOREIGN KEY (RespondedBy) REFERENCES dbo.Users(Id)
    );
END
GO

-- Categories tables for dropdowns
IF OBJECT_ID(N'dbo.DonationCases', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.DonationCases...';
    CREATE TABLE dbo.DonationCases (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Name         NVARCHAR(100) NOT NULL UNIQUE,
        Status       NVARCHAR(20) NOT NULL DEFAULT N'Active',
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF OBJECT_ID(N'dbo.DoneeTypes', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.DoneeTypes...';
    CREATE TABLE dbo.DoneeTypes (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Name         NVARCHAR(100) NOT NULL UNIQUE,
        Status       NVARCHAR(20) NOT NULL DEFAULT N'Active',
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF OBJECT_ID(N'dbo.DonationTypes', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.DonationTypes...';
    CREATE TABLE dbo.DonationTypes (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Name         NVARCHAR(100) NOT NULL UNIQUE,
        Status       NVARCHAR(20) NOT NULL DEFAULT N'Active',
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF OBJECT_ID(N'dbo.Banks', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Banks...';
    CREATE TABLE dbo.Banks (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Name         NVARCHAR(100) NOT NULL UNIQUE,
        Status       NVARCHAR(20) NOT NULL DEFAULT N'Active',
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF OBJECT_ID(N'dbo.Referrers', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Referrers...';
    CREATE TABLE dbo.Referrers (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Name         NVARCHAR(100) NOT NULL UNIQUE,
        Status       NVARCHAR(20) NOT NULL DEFAULT N'Active',
        CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- System Settings table
IF OBJECT_ID(N'dbo.SystemSettings', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.SystemSettings...';
    CREATE TABLE dbo.SystemSettings (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        SettingKey   NVARCHAR(100) NOT NULL UNIQUE,
        SettingValue NVARCHAR(MAX) NULL,
        Description  NVARCHAR(500) NULL,
        UpdatedBy    INT NULL,
        UpdatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_SystemSettings_Users
            FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id)
    );
END
GO

-- 4) Seed data (idempotent)
PRINT 'Seeding Users...';
MERGE dbo.Users AS target
USING (VALUES
    (N'danish',       N'danish@qamartrust.org',  N'admin',   N'Super Admin', N'Active'),
    (N'admin',        N'admin@qamartrust.org',   N'admin123', N'Super Admin', N'Active'),
    (N'manager_user', N'manager@qamartrust.org', N'manager', N'Manager',     N'Active'),
    (N'ali',          N'ali@qamartrust.org',     N'user',    N'Staff',       N'Inactive')
) AS src(Username, Email, PasswordPlain, Role, Status)
ON target.Username = src.Username
WHEN MATCHED THEN UPDATE SET Email = src.Email, Role = src.Role, Status = src.Status
WHEN NOT MATCHED THEN INSERT (Username, Email, PasswordHash, Role, Status)
    VALUES (src.Username, src.Email, CONVERT(NVARCHAR(255), src.PasswordPlain), src.Role, src.Status);

PRINT 'Seeding Donation Cases...';
MERGE dbo.DonationCases AS target
USING (VALUES
    (N'1', N'', N'Active'),
    (N'2', N'', N'Active'),
    (N'3', N'', N'Active')
) AS src(Name, Status, Dummy)
ON target.Name = src.Name
WHEN NOT MATCHED THEN INSERT (Name, Status) VALUES (src.Name, src.Status);

-- Actually seed proper donation cases
DELETE FROM dbo.DonationCases WHERE Name IN ('1', '2', '3');
MERGE dbo.DonationCases AS target
USING (VALUES
    (N'1', N'Active'),
    (N'2', N'Active'),
    (N'3', N'Active')
) AS src(Name, Status)
ON target.Name = src.Name
WHEN NOT MATCHED THEN INSERT (Name, Status) VALUES (src.Name, src.Status);

-- Fix the donation cases with proper names
UPDATE dbo.DonationCases SET Name = N'One Time' WHERE Name = N'1';
UPDATE dbo.DonationCases SET Name = N'Monthly' WHERE Name = N'2';
UPDATE dbo.DonationCases SET Name = N'Yearly' WHERE Name = N'3';

PRINT 'Seeding Donee Types...';
MERGE dbo.DoneeTypes AS target
USING (VALUES
    (N'Factory Worker', N'Active'),
    (N'Outdoor Worker', N'Active'),
    (N'Office Worker', N'Active'),
    (N'Daily Wage', N'Active'),
    (N'Unemployed', N'Active')
) AS src(Name, Status)
ON target.Name = src.Name
WHEN NOT MATCHED THEN INSERT (Name, Status) VALUES (src.Name, src.Status);

PRINT 'Seeding Donation Types...';
MERGE dbo.DonationTypes AS target
USING (VALUES
    (N'Zakat', N'Active'),
    (N'Sadqa', N'Active'),
    (N'Khairat', N'Active'),
    (N'Fitra', N'Active'),
    (N'General Donation', N'Active')
) AS src(Name, Status)
ON target.Name = src.Name
WHEN NOT MATCHED THEN INSERT (Name, Status) VALUES (src.Name, src.Status);

PRINT 'Seeding Banks...';
MERGE dbo.Banks AS target
USING (VALUES
    (N'Meezan Bank', N'Active'),
    (N'Bank Alfalah', N'Active'),
    (N'HBL', N'Active'),
    (N'UBL', N'Active'),
    (N'MCB Bank', N'Active'),
    (N'National Bank of Pakistan', N'Active'),
    (N'Allied Bank Limited', N'Active'),
    (N'Faysal Bank', N'Active'),
    (N'Askari Bank', N'Active'),
    (N'Bank Al-Habib', N'Active')
) AS src(Name, Status)
ON target.Name = src.Name
WHEN NOT MATCHED THEN INSERT (Name, Status) VALUES (src.Name, src.Status);

PRINT 'Seeding Referrers...';
MERGE dbo.Referrers AS target
USING (VALUES
    (N'Qamar Khan', N'Active'),
    (N'Shahid Shah', N'Active'),
    (N'Jamal Hashmi', N'Active'),
    (N'Hamidullah Niazi', N'Active'),
    (N'Self', N'Active')
) AS src(Name, Status)
ON target.Name = src.Name
WHEN NOT MATCHED THEN INSERT (Name, Status) VALUES (src.Name, src.Status);

PRINT 'Seeding Donees...';
MERGE dbo.Donees AS d
USING (VALUES
    (1, N'Active', N'Male',   N'Muhammad Ali',      N'Father', N'Parent',  N'35202-1234567-1', N'03001234567', 5000.00, N'One Time', N'Factory Worker', N'Cash', 1, 5, '2024-01-15', '1990-05-10', N'Street 1', N'Mohallah A', N'Tehsil X', N'District Y', N'Punjab', N'Meezan Bank', N'0123456789', N'Qamar Khan', N'Needs support'),
    (2, N'Active', N'Female', N'Fatima Zahra',      N'Husband', N'Spouse', N'35202-7654321-9', N'03007654321', 3000.00, N'Monthly',  N'Outdoor Worker', N'Cash', 1, 3, '2024-02-10', '1992-03-15', N'Street 2', N'Mohallah B', N'Tehsil Y', N'District Z', N'Punjab', N'HBL', N'9876543210', N'Shahid Shah', N'Widow'),
    (3, N'Active', N'Male',   N'Ahmed Khan',        N'Brother', N'Sibling', N'35201-9876543-2', N'03339876543', 2000.00, N'Yearly', N'Factory Worker', N'Cash', 1, 4, '2024-03-05', '1988-11-20', N'Street 3', N'Mohallah C', N'Tehsil Z', N'District X', N'Punjab', N'UBL', N'1122334455', N'Jamal Hashmi', N'Orphan')
) AS src(SNo, Status, Gender, Name, Relation, RelationType, CNIC, Mobile, Amount, CaseType, DoneeType, Payment, [Count], FamilyMembers, RegDate, Dob, Street, Village, Tehsil, District, Province, Bank, AccountNo, ReferredBy, Remarks)
ON d.CNIC = src.CNIC
WHEN MATCHED THEN UPDATE SET
    d.SNo = src.SNo,
    d.Status = src.Status,
    d.Gender = src.Gender,
    d.Name = src.Name,
    d.Relation = src.Relation,
    d.RelationType = src.RelationType,
    d.Mobile = src.Mobile,
    d.Amount = src.Amount,
    d.CaseType = src.CaseType,
    d.DoneeType = src.DoneeType,
    d.Payment = src.Payment,
    d.[Count] = src.[Count],
    d.FamilyMembers = src.FamilyMembers,
    d.RegDate = src.RegDate,
    d.Dob = src.Dob,
    d.Street = src.Street,
    d.Village = src.Village,
    d.Tehsil = src.Tehsil,
    d.District = src.District,
    d.Province = src.Province,
    d.Bank = src.Bank,
    d.AccountNo = src.AccountNo,
    d.ReferredBy = src.ReferredBy,
    d.Remarks = src.Remarks,
    d.UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (
    SNo, Status, Gender, Name, Relation, RelationType, CNIC, Mobile, Amount, CaseType, DoneeType, Payment, [Count], FamilyMembers, RegDate, Dob, Street, Village, Tehsil, District, Province, Bank, AccountNo, ReferredBy, Remarks, CreatedAt, UpdatedAt
) VALUES (
    src.SNo, src.Status, src.Gender, src.Name, src.Relation, src.RelationType, src.CNIC, src.Mobile, src.Amount, src.CaseType, src.DoneeType, src.Payment, src.[Count], src.FamilyMembers, src.RegDate, src.Dob, src.Street, src.Village, src.Tehsil, src.District, src.Province, src.Bank, src.AccountNo, src.ReferredBy, src.Remarks, SYSUTCDATETIME(), SYSUTCDATETIME()
);

PRINT 'Seeding DoneeFamily...';
-- For demo, attach a couple of family members to the donee with CNIC '35202-1234567-1'
DECLARE @doneeId1 INT = (SELECT TOP 1 Id FROM dbo.Donees WHERE CNIC = N'35202-1234567-1');
IF @doneeId1 IS NOT NULL
BEGIN
    MERGE dbo.DoneeFamily AS f
    USING (VALUES
        (@doneeId1, N'Ayesha', N'Daughter', N'35202-1111111-1', 8, N'Female', N'Primary', N'Student'),
        (@doneeId1, N'Bilal',  N'Son',      N'35202-2222222-2', 12, N'Male', N'Primary', N'Student')
    ) AS src(DoneeId, Name, Relationship, CNIC, Age, Gender, Education, Occupation)
    ON f.DoneeId = src.DoneeId AND f.Name = src.Name
    WHEN NOT MATCHED THEN INSERT (DoneeId, Name, Relationship, CNIC, Age, Gender, Education, Occupation, CreatedAt)
    VALUES (src.DoneeId, src.Name, src.Relationship, src.CNIC, src.Age, src.Gender, src.Education, src.Occupation, SYSUTCDATETIME());
END

PRINT 'Seeding Donations...';
DECLARE @doneeId2 INT = (SELECT TOP 1 Id FROM dbo.Donees WHERE CNIC = N'35202-1234567-1');
DECLARE @doneeId3 INT = (SELECT TOP 1 Id FROM dbo.Donees WHERE CNIC = N'35202-7654321-9');
IF @doneeId2 IS NOT NULL
BEGIN
    INSERT INTO dbo.Donations (DoneeId, DonorName, DonorPhone, Amount, DonationType, PaymentMethod, DonationDate, ReceiptNo, Status, Remarks, CreatedAt, UpdatedAt)
    VALUES 
        (@doneeId2, N'Anonymous Donor', N'03001112233', 5000.00, N'Zakat', N'Cash', '2024-01-20', N'R001', N'Received', N'Zakat for Muhammad Ali', SYSUTCDATETIME(), SYSUTCDATETIME()),
        (@doneeId2, N'Ahmed Raza', N'03003334455', 3000.00, N'Khairat', N'Bank Transfer', '2024-02-15', N'R002', N'Received', N'Monthly support', SYSUTCDATETIME(), SYSUTCDATETIME());
END
IF @doneeId3 IS NOT NULL
BEGIN
    INSERT INTO dbo.Donations (DoneeId, DonorName, DonorPhone, Amount, DonationType, PaymentMethod, DonationDate, ReceiptNo, Status, Remarks, CreatedAt, UpdatedAt)
    VALUES 
        (@doneeId3, N'Fatima Bibi', N'0300445566', 3000.00, N'Sadqa', N'Cash', '2024-02-25', N'R003', N'Received', N'Widow support', SYSUTCDATETIME(), SYSUTCDATETIME());
END

PRINT 'Seeding Cases...';
IF @doneeId2 IS NOT NULL
BEGIN
    INSERT INTO dbo.Cases (CaseNo, DoneeId, Title, Description, Status, Priority, AssignedTo, CreatedBy, CreatedAt, UpdatedAt)
    VALUES 
        ('CASE-001', @doneeId2, N'Education Support for Children', N'Need financial support for school fees and supplies', N'Open', N'High', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME());
END

PRINT 'Seeding Inquiries...';
INSERT INTO dbo.Inquiries (Name, Email, Phone, Subject, Message, Status, CreatedAt, UpdatedAt)
VALUES 
    (N'John Doe', N'john@example.com', N'03001234567', N'How to donate', N'I want to know the process for making donations', N'Pending', SYSUTCDATETIME(), SYSUTCDATETIME()),
    (N'Jane Smith', N'jane@example.com', N'03009876543', N'Volunteer opportunity', N'I would like to volunteer for your organization', N'Pending', SYSUTCDATETIME(), SYSUTCDATETIME());

PRINT 'Seeding System Settings...';
MERGE dbo.SystemSettings AS target
USING (VALUES
    (N'trust_name', N'Qamar Khan Trust', N'Name of the trust organization'),
    (N'contact_number', N'0347-7523873', N'Primary contact number'),
    (N'system_email', N'qamarteacompany0@gmail.com', N'System email address'),
    (N'address', N'Plot No.B1-273/A, Fazal Abad Colony. Railway Mall Godam Road Malakwal District Mandi Bahauddin.', N'Office address'),
    (N'default_amount', N'5000', N'Default donation amount')
) AS src(SettingKey, SettingValue, Description)
ON target.SettingKey = src.SettingKey
WHEN MATCHED THEN UPDATE SET SettingValue = src.SettingValue, Description = src.Description, UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (SettingKey, SettingValue, Description, UpdatedAt)
VALUES (src.SettingKey, src.SettingValue, src.Description, SYSUTCDATETIME());

PRINT 'QamarTrustDB setup completed successfully!';
PRINT '';
PRINT 'Default Login Credentials:';
PRINT 'Username: danish, Password: admin';
PRINT 'Username: admin, Password: admin123';
PRINT 'Username: manager_user, Password: manager';
PRINT '';
PRINT 'Database Features:';
PRINT '- User authentication and authorization';
PRINT '- Donee (beneficiary) management';
PRINT '- Family member tracking';
PRINT '- Donation management';
PRINT '- Case tracking system';
PRINT '- Inquiry management';
PRINT '- System settings';
PRINT '- Comprehensive reporting capabilities';
