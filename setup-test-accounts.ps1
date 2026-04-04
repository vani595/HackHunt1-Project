#!/usr/bin/env pwsh
# HackHunt Test Data Setup Script
# Create test admin, organizer, and user accounts

$BackendURL = "http://localhost:5000/api/v1/user/signup"

Write-Host "Creating Test Accounts for HackHunt..." -ForegroundColor Cyan
Write-Host "Backend URL: $BackendURL" -ForegroundColor Gray
Write-Host ""

# Test 1: Create Admin Account
Write-Host "Creating Admin Account..." -ForegroundColor Yellow
$adminPayload = @{
    email = "admin@hackhunt.com"
    password = "Admin@123"
    firstName = "Admin"
    lastName = "User"
    phoneNumber = "1234567890"
    role = "admin"
} | ConvertTo-Json

try {
    $adminResponse = Invoke-RestMethod -Uri $BackendURL -Method POST -Body $adminPayload -ContentType "application/json"
    Write-Host "ADMIN Account Created Successfully!" -ForegroundColor Green
    Write-Host "   Email: admin@hackhunt.com" -ForegroundColor Green
    Write-Host "   Password: Admin@123" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Error creating admin: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Create Organizer Account
Write-Host "Creating Organizer Account..." -ForegroundColor Yellow
$organizerPayload = @{
    email = "organizer@hackhunt.com"
    password = "Organizer@123"
    firstName = "John"
    lastName = "Organizer"
    phoneNumber = "9876543210"
    role = "organizer"
    organizationName = "TechCorp Hackathons"
} | ConvertTo-Json

try {
    $organizerResponse = Invoke-RestMethod -Uri $BackendURL -Method POST -Body $organizerPayload -ContentType "application/json"
    Write-Host "ORGANIZER Account Created Successfully!" -ForegroundColor Green
    Write-Host "   Email: organizer@hackhunt.com" -ForegroundColor Green
    Write-Host "   Password: Organizer@123" -ForegroundColor Green
    Write-Host "   Organization: TechCorp Hackathons" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Error creating organizer: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Create User Account
Write-Host "Creating User Account..." -ForegroundColor Yellow
$userPayload = @{
    email = "user@hackhunt.com"
    password = "User@123"
    firstName = "Jane"
    lastName = "Developer"
    phoneNumber = "5555555555"
    role = "user"
} | ConvertTo-Json

try {
    $userResponse = Invoke-RestMethod -Uri $BackendURL -Method POST -Body $userPayload -ContentType "application/json"
    Write-Host "USER Account Created Successfully!" -ForegroundColor Green
    Write-Host "   Email: user@hackhunt.com" -ForegroundColor Green
    Write-Host "   Password: User@123" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Error creating user: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Test Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "LOGIN CREDENTIALS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "ADMIN:" -ForegroundColor Yellow
Write-Host "   Email:    admin@hackhunt.com" -ForegroundColor White
Write-Host "   Password: Admin@123" -ForegroundColor White
Write-Host ""
Write-Host "ORGANIZER:" -ForegroundColor Yellow
Write-Host "   Email:    organizer@hackhunt.com" -ForegroundColor White
Write-Host "   Password: Organizer@123" -ForegroundColor White
Write-Host ""
Write-Host "USER:" -ForegroundColor Yellow
Write-Host "   Email:    user@hackhunt.com" -ForegroundColor White
Write-Host "   Password: User@123" -ForegroundColor White
Write-Host ""
Write-Host "Frontend URL: http://localhost:5175" -ForegroundColor Cyan
Write-Host ""
