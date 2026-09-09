/* Create ESSDB database, tables, and seed data for Employee Self Service System */

-- 1) Create database if missing
IF DB_ID(N'ESSDB') IS NULL
BEGIN
    PRINT 'Creating database ESSDB...';
    CREATE DATABASE ESSDB;
END
GO

-- 2) Use the database
USE ESSDB;
GO

-- 3) Create tables if missing

-- Employees table
IF OBJECT_ID(N'dbo.Employees', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Employees...';
    CREATE TABLE dbo.Employees (
        EmployeeID      INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeCode    NVARCHAR(20) NOT NULL UNIQUE,
        FirstName       NVARCHAR(100) NOT NULL,
        LastName        NVARCHAR(100) NOT NULL,
        Email           NVARCHAR(255) NOT NULL UNIQUE,
        Phone           NVARCHAR(25) NULL,
        Department      NVARCHAR(100) NOT NULL,
        Designation     NVARCHAR(100) NOT NULL,
        DateOfJoining   DATE NOT NULL,
        Salary          DECIMAL(18,2) NOT NULL,
        Status          NVARCHAR(20) NOT NULL DEFAULT N'Active',
        CreatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE UNIQUE INDEX IX_Employees_EmployeeCode ON dbo.Employees(EmployeeCode);
END
GO

-- Users table for authentication
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Users...';
    CREATE TABLE dbo.Users (
        UserID         INT IDENTITY(1,1) PRIMARY KEY,
        Username       NVARCHAR(50) NOT NULL UNIQUE,
        Email          NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash   NVARCHAR(255) NOT NULL,
        EmployeeID     INT NULL,
        Role           NVARCHAR(50) NOT NULL DEFAULT N'Employee',
        Status         NVARCHAR(20) NOT NULL DEFAULT N'Active',
        LastLogin      DATETIME2 NULL,
        CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Users_Employees
            FOREIGN KEY (EmployeeID) REFERENCES dbo.Employees(EmployeeID)
    );
END
GO

-- Leave Requests table
IF OBJECT_ID(N'dbo.LeaveRequests', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.LeaveRequests...';
    CREATE TABLE dbo.LeaveRequests (
        LeaveRequestID INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeID     INT NOT NULL,
        LeaveType      NVARCHAR(50) NOT NULL,
        StartDate      DATE NOT NULL,
        EndDate        DATE NOT NULL,
        Reason         NVARCHAR(500) NULL,
        Status         NVARCHAR(20) NOT NULL DEFAULT N'Pending',
        ApprovedBy     INT NULL,
        ApprovedDate   DATETIME2 NULL,
        Remarks        NVARCHAR(500) NULL,
        CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_LeaveRequests_Employees
            FOREIGN KEY (EmployeeID) REFERENCES dbo.Employees(EmployeeID),
        CONSTRAINT FK_LeaveRequests_ApprovedBy
            FOREIGN KEY (ApprovedBy) REFERENCES dbo.Employees(EmployeeID)
    );
END
GO

-- Attendance table
IF OBJECT_ID(N'dbo.Attendance', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Attendance...';
    CREATE TABLE dbo.Attendance (
        AttendanceID   INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeID     INT NOT NULL,
        AttendanceDate DATE NOT NULL,
        CheckIn        TIME NULL,
        CheckOut       TIME NULL,
        BreakTime      INT DEFAULT 0, -- minutes
        WorkingHours   DECIMAL(4,2) NULL,
        Status         NVARCHAR(20) NOT NULL DEFAULT N'Present',
        Remarks        NVARCHAR(500) NULL,
        CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Attendance_Employees
            FOREIGN KEY (EmployeeID) REFERENCES dbo.Employees(EmployeeID),
        CONSTRAINT UQ_Attendance_EmployeeDate UNIQUE (EmployeeID, AttendanceDate)
    );
END
GO

-- Payroll table
IF OBJECT_ID(N'dbo.Payroll', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Payroll...';
    CREATE TABLE dbo.Payroll (
        PayrollID      INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeID     INT NOT NULL,
        Month          NVARCHAR(20) NOT NULL,
        Year           INT NOT NULL,
        BasicSalary    DECIMAL(18,2) NOT NULL,
        Allowances     DECIMAL(18,2) DEFAULT 0,
        Deductions     DECIMAL(18,2) DEFAULT 0,
        NetSalary      DECIMAL(18,2) NOT NULL,
        PaymentDate    DATE NULL,
        PaymentStatus  NVARCHAR(20) NOT NULL DEFAULT N'Pending',
        CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Payroll_Employees
            FOREIGN KEY (EmployeeID) REFERENCES dbo.Employees(EmployeeID),
        CONSTRAINT UQ_Payroll_EmployeeMonthYear UNIQUE (EmployeeID, Month, Year)
    );
END
GO

-- Departments table
IF OBJECT_ID(N'dbo.Departments', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Departments...';
    CREATE TABLE dbo.Departments (
        DepartmentID   INT IDENTITY(1,1) PRIMARY KEY,
        DepartmentName NVARCHAR(100) NOT NULL UNIQUE,
        Description    NVARCHAR(500) NULL,
        HeadOfDepartment INT NULL,
        Status         NVARCHAR(20) NOT NULL DEFAULT N'Active',
        CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Departments_Employees
            FOREIGN KEY (HeadOfDepartment) REFERENCES dbo.Employees(EmployeeID)
    );
END
GO

-- Leave Types table
IF OBJECT_ID(N'dbo.LeaveTypes', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.LeaveTypes...';
    CREATE TABLE dbo.LeaveTypes (
        LeaveTypeID    INT IDENTITY(1,1) PRIMARY KEY,
        LeaveTypeName  NVARCHAR(100) NOT NULL UNIQUE,
        Description    NVARCHAR(500) NULL,
        MaxDaysPerYear INT DEFAULT 0,
        Status         NVARCHAR(20) NOT NULL DEFAULT N'Active',
        CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- Holidays table
IF OBJECT_ID(N'dbo.Holidays', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Holidays...';
    CREATE TABLE dbo.Holidays (
        HolidayID      INT IDENTITY(1,1) PRIMARY KEY,
        HolidayName    NVARCHAR(100) NOT NULL,
        HolidayDate    DATE NOT NULL,
        HolidayType    NVARCHAR(50) NOT NULL DEFAULT N'Public',
        Description    NVARCHAR(500) NULL,
        Status         NVARCHAR(20) NOT NULL DEFAULT N'Active',
        CreatedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Holidays_Date UNIQUE (HolidayDate)
    );
END
GO

-- 4) Seed data (idempotent)
PRINT 'Seeding Departments...';
MERGE dbo.Departments AS target
USING (VALUES
    (N'Human Resources', N'Manage employee relations and HR policies', NULL, N'Active'),
    (N'Finance', N'Financial planning and accounting', NULL, N'Active'),
    (N'Information Technology', N'Technology infrastructure and support', NULL, N'Active'),
    (N'Administration', N'Office management and administrative tasks', NULL, N'Active'),
    (N'Marketing', N'Marketing and business development', NULL, N'Active')
) AS src(DepartmentName, Description, HeadOfDepartment, Status)
ON target.DepartmentName = src.DepartmentName
WHEN NOT MATCHED THEN INSERT (DepartmentName, Description, HeadOfDepartment, Status)
VALUES (src.DepartmentName, src.Description, src.HeadOfDepartment, src.Status);

PRINT 'Seeding Leave Types...';
MERGE dbo.LeaveTypes AS target
USING (VALUES
    (N'Annual Leave', N'Paid annual leave for employees', 21, N'Active'),
    (N'Sick Leave', N'Leave for medical reasons', 10, N'Active'),
    (N'Personal Leave', N'Personal emergency leave', 5, N'Active'),
    (N'Maternity Leave', N'Maternity leave for female employees', 90, N'Active'),
    (N'Paternity Leave', N'Paternity leave for male employees', 7, N'Active')
) AS src(LeaveTypeName, Description, MaxDaysPerYear, Status)
ON target.LeaveTypeName = src.LeaveTypeName
WHEN NOT MATCHED THEN INSERT (LeaveTypeName, Description, MaxDaysPerYear, Status)
VALUES (src.LeaveTypeName, src.Description, src.MaxDaysPerYear, src.Status);

PRINT 'Seeding Employees...';
MERGE dbo.Employees AS target
USING (VALUES
    (N'EMP001', N'Admin', N'User', N'admin@ess.com', N'03001234567', N'IT', N'System Administrator', '2024-01-01', 150000.00, N'Active'),
    (N'EMP002', N'Ahmed', N'Khan', N'ahmed.khan@ess.com', N'03002345678', N'HR', N'HR Manager', '2024-02-01', 120000.00, N'Active'),
    (N'EMP003', N'Fatima', N'Zahra', N'fatima.zahra@ess.com', N'03003456789', N'Finance', N'Finance Manager', '2024-03-01', 130000.00, N'Active'),
    (N'EMP004', N'Ali', N'Hassan', N'ali.hassan@ess.com', N'03004567890', N'IT', N'Software Developer', '2024-04-01', 100000.00, N'Active'),
    (N'EMP005', N'Sara', N'Ahmed', N'sara.ahmed@ess.com', N'03005678901', N'Admin', N'Office Assistant', '2024-05-01', 60000.00, N'Active'),
    (N'EMP006', N'Usman', N'Malik', N'usman.malik@ess.com', N'03006789012', N'Marketing', N'Marketing Manager', '2024-06-01', 110000.00, N'Active')
) AS src(EmployeeCode, FirstName, LastName, Email, Phone, Department, Designation, DateOfJoining, Salary, Status)
ON target.EmployeeCode = src.EmployeeCode
WHEN MATCHED THEN UPDATE SET 
    FirstName = src.FirstName,
    LastName = src.LastName,
    Email = src.Email,
    Phone = src.Phone,
    Department = src.Department,
    Designation = src.Designation,
    DateOfJoining = src.DateOfJoining,
    Salary = src.Salary,
    Status = src.Status,
    UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (
    EmployeeCode, FirstName, LastName, Email, Phone, Department, Designation, 
    DateOfJoining, Salary, Status, CreatedAt, UpdatedAt
) VALUES (
    src.EmployeeCode, src.FirstName, src.LastName, src.Email, src.Phone, 
    src.Department, src.Designation, src.DateOfJoining, src.Salary, src.Status, 
    SYSUTCDATETIME(), SYSUTCDATETIME()
);

PRINT 'Seeding Users...';
MERGE dbo.Users AS target
USING (VALUES
    (N'admin', N'admin@ess.com', N'admin123', (SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP001'), N'Administrator', N'Active'),
    (N'ahmed.khan', N'ahmed.khan@ess.com', N'emp123', (SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP002'), N'HR Manager', N'Active'),
    (N'fatima.zahra', N'fatima.zahra@ess.com', N'emp123', (SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP003'), N'Finance Manager', N'Active'),
    (N'ali.hassan', N'ali.hassan@ess.com', N'emp123', (SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP004'), N'Employee', N'Active'),
    (N'sara.ahmed', N'sara.ahmed@ess.com', N'emp123', (SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP005'), N'Employee', N'Active'),
    (N'usman.malik', N'usman.malik@ess.com', N'emp123', (SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP006'), N'Marketing Manager', N'Active')
) AS src(Username, Email, PasswordHash, EmployeeID, Role, Status)
ON target.Username = src.Username
WHEN MATCHED THEN UPDATE SET 
    Email = src.Email,
    PasswordHash = src.PasswordHash,
    EmployeeID = src.EmployeeID,
    Role = src.Role,
    Status = src.Status,
    UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (
    Username, Email, PasswordHash, EmployeeID, Role, Status, CreatedAt, UpdatedAt
) VALUES (
    src.Username, src.Email, src.PasswordHash, src.EmployeeID, src.Role, src.Status, 
    SYSUTCDATETIME(), SYSUTCDATETIME()
);

PRINT 'Seeding Leave Requests...';
MERGE dbo.LeaveRequests AS target
USING (VALUES
    ((SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP002'), N'Annual Leave', '2024-12-20', '2024-12-25', N'Family vacation', N'Pending', NULL, NULL, NULL),
    ((SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP003'), N'Sick Leave', '2024-12-15', '2024-12-16', N'Not feeling well', N'Approved', (SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP001'), '2024-12-14', N'Approved by admin'),
    ((SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP004'), N'Personal Leave', '2024-12-10', '2024-12-10', N'Personal work', N'Rejected', (SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP001'), '2024-12-09', N'Insufficient notice')
) AS src(EmployeeID, LeaveType, StartDate, EndDate, Reason, Status, ApprovedBy, ApprovedDate, Remarks)
ON target.LeaveRequestID IS NULL -- Simple insert for demo
WHEN NOT MATCHED THEN INSERT (
    EmployeeID, LeaveType, StartDate, EndDate, Reason, Status, ApprovedBy, ApprovedDate, Remarks, CreatedAt, UpdatedAt
) VALUES (
    src.EmployeeID, src.LeaveType, src.StartDate, src.EndDate, src.Reason, src.Status, 
    src.ApprovedBy, src.ApprovedDate, src.Remarks, SYSUTCDATETIME(), SYSUTCDATETIME()
);

PRINT 'Seeding Attendance...';
DECLARE @currentDate DATE = DATEADD(DAY, -30, CAST(GETDATE() AS DATE));
DECLARE @endDate DATE = CAST(GETDATE() AS DATE);

WHILE @currentDate <= @endDate
BEGIN
    -- Insert attendance for all employees
    INSERT INTO dbo.Attendance (EmployeeID, AttendanceDate, CheckIn, CheckOut, WorkingHours, Status, CreatedAt, UpdatedAt)
    SELECT 
        e.EmployeeID,
        @currentDate,
        CASE 
            WHEN DATEPART(WEEKDAY, @currentDate) IN (1, 7) THEN NULL -- Weekend
            ELSE DATEADD(MINUTE, RAND() * 30, '09:00:00') -- Random check-in between 9:00-9:30
        END,
        CASE 
            WHEN DATEPART(WEEKDAY, @currentDate) IN (1, 7) THEN NULL -- Weekend
            ELSE DATEADD(MINUTE, RAND() * 60, '17:00:00') -- Random check-out between 17:00-18:00
        END,
        CASE 
            WHEN DATEPART(WEEKDAY, @currentDate) IN (1, 7) THEN 0 -- Weekend
            ELSE 8.0 -- Weekday
        END,
        CASE 
            WHEN DATEPART(WEEKDAY, @currentDate) IN (1, 7) THEN N'Weekend'
            ELSE N'Present'
        END,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    FROM dbo.Employees e
    WHERE e.Status = N'Active'
    AND NOT EXISTS (
        SELECT 1 FROM dbo.Attendance a 
        WHERE a.EmployeeID = e.EmployeeID AND a.AttendanceDate = @currentDate
    );
    
    SET @currentDate = DATEADD(DAY, 1, @currentDate);
END

PRINT 'Seeding Payroll...';
MERGE dbo.Payroll AS target
USING (VALUES
    ((SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP001'), N'November', 2024, 150000.00, 25000.00, 15000.00, 160000.00, '2024-11-30', N'Paid'),
    ((SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP002'), N'November', 2024, 120000.00, 20000.00, 12000.00, 128000.00, '2024-11-30', N'Paid'),
    ((SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP003'), N'November', 2024, 130000.00, 22000.00, 13000.00, 139000.00, '2024-11-30', N'Paid'),
    ((SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP004'), N'November', 2024, 100000.00, 18000.00, 10000.00, 108000.00, '2024-11-30', N'Paid'),
    ((SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP005'), N'November', 2024, 60000.00, 10000.00, 6000.00, 64000.00, '2024-11-30', N'Paid'),
    ((SELECT EmployeeID FROM Employees WHERE EmployeeCode = N'EMP006'), N'November', 2024, 110000.00, 15000.00, 11000.00, 114000.00, '2024-11-30', N'Paid')
) AS src(EmployeeID, Month, Year, BasicSalary, Allowances, Deductions, NetSalary, PaymentDate, PaymentStatus)
ON target.EmployeeID = src.EmployeeID AND target.Month = src.Month AND target.Year = src.Year
WHEN MATCHED THEN UPDATE SET 
    BasicSalary = src.BasicSalary,
    Allowances = src.Allowances,
    Deductions = src.Deductions,
    NetSalary = src.NetSalary,
    PaymentDate = src.PaymentDate,
    PaymentStatus = src.PaymentStatus,
    UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (
    EmployeeID, Month, Year, BasicSalary, Allowances, Deductions, NetSalary, PaymentDate, PaymentStatus, CreatedAt, UpdatedAt
) VALUES (
    src.EmployeeID, src.Month, src.Year, src.BasicSalary, src.Allowances, src.Deductions, src.NetSalary, 
    src.PaymentDate, src.PaymentStatus, SYSUTCDATETIME(), SYSUTCDATETIME()
);

PRINT 'Seeding Holidays...';
MERGE dbo.Holidays AS target
USING (VALUES
    (N'Eid-ul-Fitr', '2024-04-10', N'Religious', N'Eid celebration', N'Active'),
    (N'Eid-ul-Azha', '2024-06-17', N'Religious', N'Bakri Eid', N'Active'),
    (N'Independence Day', '2024-08-14', N'National', N'Pakistan Independence Day', N'Active'),
    (N'Quaid-e-Azam Day', '2024-12-25', N'National', N'Birthday of Quaid-e-Azam', N'Active')
) AS src(HolidayName, HolidayDate, HolidayType, Description, Status)
ON target.HolidayDate = src.HolidayDate
WHEN NOT MATCHED THEN INSERT (HolidayName, HolidayDate, HolidayType, Description, Status, CreatedAt)
VALUES (src.HolidayName, src.HolidayDate, src.HolidayType, src.Description, src.Status, SYSUTCDATETIME());

PRINT 'ESSDB setup completed successfully!';
PRINT '';
PRINT 'Default Login Credentials:';
PRINT 'Administrator: username=admin, password=admin';
PRINT 'Employees: username={first.last}, password=emp123';
PRINT '';
PRINT 'Available Employee Logins:';
PRINT 'ahmed.khan (HR Manager)';
PRINT 'fatima.zahra (Finance Manager)'; 
PRINT 'ali.hassan (Software Developer)';
PRINT 'sara.ahmed (Office Assistant)';
PRINT 'usman.malik (Marketing Manager)';
PRINT '';
PRINT 'Database Features:';
PRINT '- Employee management with complete profiles';
PRINT '- User authentication and authorization';
PRINT '- Leave request management system';
PRINT '- Attendance tracking with check-in/out';
PRINT '- Payroll management and salary processing';
PRINT '- Department organization';
PRINT '- Leave types and holiday management';
PRINT '- Comprehensive reporting capabilities';
PRINT '- Role-based access control';
