# Swagger API Documentation Updates

## Overview
Comprehensive Swagger/OpenAPI documentation has been added to properly capture all APIs in the Attendance Management System. This document summarizes the improvements made.

## Changes Made

### 1. **Enhanced Swagger Configuration (main.ts)**
- Added detailed API title and description
- Added contact information
- Added license information
- Added server configurations (dev and production)
- Added API tags with descriptions:
  - System
  - Auth
  - Organizations
  - Staff
  - Attendance
  - Analytics
  - Disposable Attendance
  - Public Holidays
  - Settings
- Enhanced Swagger UI options:
  - Improved documentation filtering
  - Better response display configuration
  - Optimized UI layout

### 2. **Auth Controller Enhancements**
- Added detailed operation summaries and descriptions for all endpoints
- Documented login endpoints (admin and staff)
- Added response schemas showing authenticated user structure
- Documented password reset flows with security notes
- Documented admin/staff account verification processes
- Added logout endpoint documentation
- Included error responses (Unauthorized, BadRequest, Conflict)

### 3. **Organizations Controller Improvements**
- Added comprehensive descriptions for CRUD operations
- Documented organization configuration fields with examples:
  - Working hours (lateAfterTime, earlyCheckoutBeforeTime)
  - Geofence settings (location, radius, coordinates)
  - Role management
  - Working days configuration
  - Analytics settings
  - Attendance edit policies
  - Subscription plan tiers
- Added detailed response schemas with examples

### 4. **Staff Controller Documentation**
- Documented staff member listing by organization
- Added creation endpoint with field descriptions
- Documented update operations with field details
- Documented deletion with authorization notes
- Added response schemas showing staff information structure
- Included error responses (Conflict, NotFound, Unauthorized)

### 5. **Attendance Controller Enhancements**
- Documented list operations with date and organization filters
- Added sign-in/sign-out endpoints with GPS location support
- Documented geofence validation parameters
- Added examples for attendance records
- Detailed request/response schemas
- Included status tracking (present, absent, late, early checkout)
- Documented authorization and permission requirements

### 6. **Analytics Controller Improvements**
- Added comprehensive operation descriptions
- Documented query parameters:
  - Organization ID
  - Time range (week/month)
  - Filter options (all, late, early, absent)
- Added detailed response schema showing:
  - Summary statistics
  - Daily breakdown
  - Staff breakdown
  - Attendance trends

### 7. **Disposable Attendance Controller (Major Enhancement)**
- Added `@ApiTags` decorator
- Documented all CRUD operations with descriptions:
  - List forms by organization
  - Create custom forms with recurring options
  - Update form configurations
  - Delete forms
  - List and export responses
- Added API operations for:
  - Field management (update collected details)
  - Admin response submission
  - CSV export functionality
  - Public endpoint for non-authenticated access
- Documented custom field types (full-name, email, phone, occupation, address, text)
- Detailed response schemas with examples
- Documented recurrence patterns and configurations

### 8. **Settings Controller Documentation**
- Added comprehensive descriptions for settings management
- Documented all configurable properties:
  - Working hours and policies
  - Geofence settings
  - Role definitions
  - Analytics preferences
  - Authentication policies
  - Subscription tier
- Added detailed explanations for special operations (e.g., staff password resets)
- Included authorization requirements

### 9. **Public Holidays Controller (Complete Implementation)**
- Added complete Swagger documentation (was missing)
- Documented list, create, update, and delete operations
- Added detailed descriptions for all endpoints:
  - List all public holidays for organization
  - Create one-time or recurring holidays
  - Update holiday information
  - Delete holidays
- Documented recurring holiday support with RRULE patterns
- Added authorization and permission checks
- Included proper HTTP response codes and error handling

## API Documentation Structure

Each endpoint now includes:
- **Summary**: Brief, action-oriented description
- **Description**: Detailed explanation of functionality
- **Parameters**: Query, path, and body parameters with:
  - Type information
  - Required/optional indicators
  - Examples and descriptions
- **Request Body**: Detailed schema with property descriptions and examples
- **Response Schemas**: 
  - Success responses with data structure
  - Error responses (401, 403, 404, 409, 400)
- **Authorization**: Required auth methods clearly marked
- **Tags**: Logical grouping under API categories

## Key Improvements

✅ All 9 modules properly documented:
- System (health checks, welcome)
- Auth (login, registration, verification, password reset)
- Organizations (CRUD operations)
- Staff (member management)
- Attendance (sign-in/out, records)
- Analytics (reporting and statistics)
- Disposable Attendance (custom forms)
- Public Holidays (holiday management)
- Settings (organization configuration)

✅ Comprehensive Request/Response Schemas:
- All request bodies include field descriptions
- All responses include data structure examples
- Examples provided with realistic values

✅ Authorization Documentation:
- Cookie-based authentication documented
- JWT Bearer token documented
- Permission requirements clearly marked
- Authorization error responses included

✅ Error Handling:
- 400 BadRequest responses
- 401 Unauthorized responses
- 403 Forbidden responses
- 404 NotFound responses
- 409 Conflict responses

## Accessing the Documentation

Once the application is running:
1. Navigate to: `http://localhost:3000/docs`
2. Or configured `{SWAGGER_PATH}/docs` endpoint
3. Full API documentation available with interactive testing

## Configuration

Swagger documentation can be controlled with environment variables:
- `SWAGGER_ENABLED=true|false` - Enable/disable Swagger
- `SWAGGER_PATH=docs` - Custom path for Swagger UI
- `API_URL=` - Production API URL

## Next Steps

To make full use of this documentation:
1. Start the development server: `npm run start:dev`
2. Navigate to `http://localhost:3000/docs`
3. Try out endpoints using the Swagger UI
4. Export OpenAPI specification for integration with other tools
5. Use "Authorize" button to set authentication tokens

---

**Documentation Updated**: March 31, 2026
**Version**: 1.0.0
