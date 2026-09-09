-- Create Database
CREATE DATABASE QamarTrust;
GO

USE QamarTrust;
GO

-- Create Users table
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Active',
    CreatedBy NVARCHAR(50),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create DonationCases table
CREATE TABLE DonationCases (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create DoneeTypes table
CREATE TABLE DoneeTypes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE [References] (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    ContactInfo NVARCHAR(200),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create Donees table
CREATE TABLE Donees (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    FatherName NVARCHAR(100),
    CNIC NVARCHAR(15),
    PhoneNumber NVARCHAR(20),
    Address NVARCHAR(500),
    DoneeTypeId INT,
    ReferenceId INT,
    Status NVARCHAR(20) DEFAULT 'Active',
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (DoneeTypeId) REFERENCES DoneeTypes(Id),
    FOREIGN KEY (ReferenceId) REFERENCES [References](Id)
);

-- Create Donations table
CREATE TABLE Donations (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DoneeId INT NOT NULL,
    DonationCaseId INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    DonationDate DATETIME2 DEFAULT GETDATE(),
    Description NVARCHAR(500),
    Status NVARCHAR(20) DEFAULT 'Pending',
    CreatedBy INT,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (DoneeId) REFERENCES Donees(Id),
    FOREIGN KEY (DonationCaseId) REFERENCES DonationCases(Id),
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);

-- Create Inquiries table
CREATE TABLE Inquiries (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DoneeId INT NOT NULL,
    Subject NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000),
    Status NVARCHAR(20) DEFAULT 'Open',
    Priority NVARCHAR(20) DEFAULT 'Medium',
    AssignedTo INT,
    CreatedBy INT,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (DoneeId) REFERENCES Donees(Id),
    FOREIGN KEY (AssignedTo) REFERENCES Users(Id),
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);

-- Create CaseTracking table
CREATE TABLE CaseTracking (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DoneeId INT NOT NULL,
    CaseNumber NVARCHAR(50) UNIQUE NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000),
    Status NVARCHAR(20) DEFAULT 'Open',
    Priority NVARCHAR(20) DEFAULT 'Medium',
    AssignedTo INT,
    CreatedBy INT,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (DoneeId) REFERENCES Donees(Id),
    FOREIGN KEY (AssignedTo) REFERENCES Users(Id),
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);

-- Insert sample data
INSERT INTO Users (Username, Email, PasswordHash, CreatedBy) VALUES 
('danish', 'danish@qamartrust.org', '$2a$10$example_hash_here', 'System'),
('ali', 'ali@qamartrust.org', '$2a$10$example_hash_here', 'danish');

INSERT INTO DonationCases (Name, Description) VALUES 
('Medical Emergency', 'Urgent medical treatment cases'),
('Education Support', 'Educational assistance for students'),
('Food Support', 'Monthly food packages for families'),
('Housing Support', 'Assistance with housing and shelter');

INSERT INTO DoneeTypes (Name, Description) VALUES 
('Individual', 'Single person requiring assistance'),
('Family', 'Family unit requiring support'),
('Widow', 'Widowed women requiring assistance'),
('Orphan', 'Orphaned children requiring support');

INSERT INTO [References] (Name, ContactInfo) VALUES 
('Local Mosque', 'imam@localmosque.org'),
('Community Center', 'info@communitycenter.org'),
('Social Worker', 'worker@socialservices.org'),
('Healthcare Provider', 'contact@healthcare.org');

GO
