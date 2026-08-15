# Technical Specification: Student Admission

## Overview
The Student Admission module handles inquiry, verification, and enrollment of students, strictly adhering to tenant isolation and audit requirements.

## API Contracts (REST)
- `POST /api/v1/admissions/inquiries` - Submit a new inquiry.
- `PATCH /api/v1/admissions/inquiries/{id}/verify` - Verify an inquiry.

## Command Model
- `SubmitAdmissionInquiryCommand`
- `VerifyAdmissionInquiryCommand`

## Query Model
- `GetAdmissionInquiryQuery`
- `ListAdmissionInquiriesQuery`

## Persistence
- Table: `admission_inquiries`
- RLS Policy: `tenant_id` based isolation.
