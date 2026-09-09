/* Create CharityDB database, tables, and seed data for development */

-- 1) Create database if missing
IF DB_ID(N'CharityDB') IS NULL
BEGIN
    PRINT 'Creating database CharityDB...';
    CREATE DATABASE CharityDB;
END
GO

-- 2) Use the database
USE CharityDB;
GO

-- 3) Create tables if missing
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
        Remarks         NVARCHAR(MAX) NULL
    );
    CREATE UNIQUE INDEX IX_Donees_CNIC ON dbo.Donees(CNIC);
END
GO

IF OBJECT_ID(N'dbo.DoneeFamily', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.DoneeFamily...';
    CREATE TABLE dbo.DoneeFamily (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        DoneeId      INT NOT NULL,
        Name         NVARCHAR(200) NOT NULL,
        Relationship NVARCHAR(100) NOT NULL,
        CNIC         NVARCHAR(25) NULL,
        CONSTRAINT FK_DoneeFamily_Donees
            FOREIGN KEY (DoneeId) REFERENCES dbo.Donees(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_DoneeFamily_DoneeId ON dbo.DoneeFamily(DoneeId);
END
GO

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

-- 4) Seed data (idempotent)
PRINT 'Seeding Users...';
MERGE dbo.Users AS target
USING (VALUES
    (N'danish',       N'danish@qamartrust.org',  N'admin',   N'Super Admin', N'Active'),
    (N'manager_user', N'manager@qamartrust.org', N'manager', N'Manager',     N'Active'),
    (N'ali',          N'ali@qamartrust.org',     N'user',    N'Staff',       N'Inactive')
) AS src(Username, Email, PasswordPlain, Role, Status)
ON target.Username = src.Username
WHEN MATCHED THEN UPDATE SET Email = src.Email, Role = src.Role, Status = src.Status
WHEN NOT MATCHED THEN INSERT (Username, Email, PasswordHash, Role, Status)
    VALUES (src.Username, src.Email, CONVERT(NVARCHAR(255), src.PasswordPlain), src.Role, src.Status);

PRINT 'Seeding Donees...';
MERGE dbo.Donees AS d
USING (VALUES
    (1, N'Active', N'Male',   N'Muhammad Ali',      N'Father', N'Parent',  N'35202-1234567-1', N'03001234567', 5000.00, N'ایک بار', N'Factory Worker', N'Cash', 1, 5, '2024-01-15', '1990-05-10', N'Street 1', N'Mohallah A', N'Tehsil X', N'District Y', N'Punjab', N'Meezan Bank', N'0123456789', N'قمر خان', N'Needs support'),
    (2, N'Active', N'Female', N'Fatima Zahra',      N'Husband', N'Spouse', N'35202-7654321-9', N'03007654321', 3000.00, N'ماہانہ',  N'Outdoor Worker', N'Cash', 1, 3, '2024-02-10', '1992-03-15', N'Street 2', N'Mohallah B', N'Tehsil Y', N'District Z', N'Punjab', N'HBL', N'9876543210', N'شادہ شاہ', N'Widow'),
    (3, N'Active', N'Male',   N'Ahmed Khan',        N'Brother', N'Sibling', N'35201-9876543-2', N'03339876543', 2000.00, N'سالانہ', N'Factory Worker', N'Cash', 1, 4, '2024-03-05', '1988-11-20', N'Street 3', N'Mohallah C', N'Tehsil Z', N'District X', N'Punjab', N'UBL', N'1122334455', N'جمال ہاشمی', N'Orphan')
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
    d.Remarks = src.Remarks
WHEN NOT MATCHED THEN INSERT (
    SNo, Status, Gender, Name, Relation, RelationType, CNIC, Mobile, Amount, CaseType, DoneeType, Payment, [Count], FamilyMembers, RegDate, Dob, Street, Village, Tehsil, District, Province, Bank, AccountNo, ReferredBy, Remarks
) VALUES (
    src.SNo, src.Status, src.Gender, src.Name, src.Relation, src.RelationType, src.CNIC, src.Mobile, src.Amount, src.CaseType, src.DoneeType, src.Payment, src.[Count], src.FamilyMembers, src.RegDate, src.Dob, src.Street, src.Village, src.Tehsil, src.District, src.Province, src.Bank, src.AccountNo, src.ReferredBy, src.Remarks
);

PRINT 'Seeding DoneeFamily...';
-- For demo, attach a couple of family members to the donee with CNIC '35202-1234567-1'
DECLARE @doneeId1 INT = (SELECT TOP 1 Id FROM dbo.Donees WHERE CNIC = N'35202-1234567-1');
IF @doneeId1 IS NOT NULL
BEGIN
    MERGE dbo.DoneeFamily AS f
    USING (VALUES
        (@doneeId1, N'Ayesha', N'Daughter', N'35202-1111111-1'),
        (@doneeId1, N'Bilal',  N'Son',      N'35202-2222222-2')
    ) AS src(DoneeId, Name, Relationship, CNIC)
    ON f.DoneeId = src.DoneeId AND f.Name = src.Name
    WHEN NOT MATCHED THEN INSERT (DoneeId, Name, Relationship, CNIC)
    VALUES (src.DoneeId, src.Name, src.Relationship, src.CNIC);
END

PRINT 'Done. You can now query dbo.Users, dbo.Donees, and dbo.DoneeFamily.'
