# Original User Request

## 2026-09-03T04:03:55Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval.
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: [none — teamwork routes from the description]

Build an automated insurance claims adjudication system with role-based access, featuring an AI-powered triage/extraction engine for claim documents, a human-in-the-loop Adjuster Review Cockpit, and an executive dashboard for metrics and queue management.

Working directory: ~/teamwork_projects/claims_adjudication
Integrity mode: development

## Requirements

### R1. Role-Based Access & Secure Auth
Implement JWT-based authentication with protected routes. Support three pre-seeded roles: "Adjuster", "Risk Manager", and "Policyholder". Use a real MongoDB database connection.

### R2. Automated Triage & Extraction Engine
Develop an ingestion pipeline for claim documents and photos. Integrate a real LLM API (e.g., Gemini/OpenAI) to extract structured data (policy matching, itemized costs, fraud risk score) and generate a draft settlement. The agent team must write scripts to generate synthetic claim data (PDFs/images) for testing.

### R3. Adjuster Review Cockpit
Build a dual-pane interface showing original evidence alongside extracted data. Allow adjusters to accept/reject line items and explicitly approve settlements or refer to SIU (no automated payouts).

### R4. Carrier Executive & Operations Dashboard
Create a dashboard with real-time financial/velocity metrics, a filterable triage queue, and an exportable audit log of extractions and adjuster decisions.

## Acceptance Criteria

### R1 Verification: Authentication & RBAC
- [ ] An automated test script successfully authenticates as an "Adjuster" and a "Policyholder".
- [ ] The script verifies that the "Policyholder" token is rejected (403 Forbidden) when attempting to access Adjuster-only API endpoints.

### R2 Verification: AI Ingestion Pipeline
- [ ] A synthetic data generation script successfully creates sample PDF claims and image files.
- [ ] An automated test submits these synthetic files to the ingestion endpoint and verifies the endpoint returns structured JSON containing itemized costs and a 0-100 fraud risk score.

### R3 Verification: Review Cockpit
- [ ] Automated UI tests (or integration tests) verify that a claim's status transitions correctly in the MongoDB database when the "Approve Settlement" or "Refer to SIU" actions are triggered.
- [ ] The UI test verifies that individual line items can be modified before approval.

### R4 Verification: Dashboard Metrics
- [ ] A test script seeds the MongoDB database with multiple claims in various states (e.g., Approved, Referred to SIU).
- [ ] The script verifies that the dashboard metrics API accurately calculates and returns the aggregate "Labor Hours Saved" and "Straight-Through Eligibility %".

## 2026-09-03T04:10:16Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval.
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: [none — teamwork routes from the description]

Build Phase 1 (Frontend UI Only) of an automated insurance claims adjudication system. Do not build the backend API, MongoDB database, or real AI integration yet. Focus exclusively on building the React frontend with mock data to present for user review.

Working directory: ~/teamwork_projects/claims_adjudication
Integrity mode: development

## Requirements

### R1. Frontend Scaffold & Routing
Create a Vite + React + Tailwind CSS application. Implement frontend routing (using React Router) with mock protected routes for three views: "Adjuster", "Risk Manager", and "Policyholder". Use hardcoded mock data to simulate state.

### R2. Adjuster Review Cockpit UI
Build the dual-pane UI for the Adjuster. The left pane should be a placeholder document viewer, and the right pane should display mocked extracted data fields with "Accept"/"Reject" buttons per line item, plus final "Approve Settlement" and "Refer to SIU" buttons.

### R3. Carrier Executive Dashboard UI
Build the UI for the Risk Manager dashboard. It must include mock metric cards (e.g., "Labor Hours Saved", "Straight-Through %") and a mock filterable triage queue table displaying a list of dummy claims.

## Acceptance Criteria

### R1 Verification: Scaffold & Routing
- [ ] The Vite React app builds successfully (`npm run build` passes).
- [ ] An automated test (e.g., React Testing Library or Cypress) verifies that the application renders and can navigate between the Adjuster, Risk Manager, and Policyholder routes.

### R2 Verification: Cockpit Elements
- [ ] An automated test verifies the presence of the "Approve Settlement" and "Refer to SIU" buttons within the Adjuster route's DOM.

### R3 Verification: Dashboard Elements
- [ ] An automated test verifies that the dashboard route successfully renders metric cards and the claims queue table.

