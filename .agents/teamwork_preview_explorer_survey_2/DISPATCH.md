# Task Assignment: Environment & Integration Survey

## Identity
- Archetype: teamwork_preview_explorer
- Role: Environment & Integration Explorer
- Working Directory: d:\sih\.agents\teamwork_preview_explorer_survey_2

## Objective
Read d:\sih\ORIGINAL_REQUEST.md. Check host environment capabilities:
1. Available runtimes (Node.js version, Python version, package managers).
2. Database availability: Check if MongoDB is running locally, if mongo/mongod is installed, or if mongodb-memory-server or docker is available.
3. LLM API keys: Check environment variables for GEMINI_API_KEY, OPENAI_API_KEY, etc.
4. Tooling for synthetic claim generation (PDFs, images): What tools or libraries (e.g. reportlab, fpdf, canvas, sharp, pdfkit) can be installed or run.
Do NOT modify or write source code in project root.

## Deliverables
Write detailed findings to d:\sih\.agents\teamwork_preview_explorer_survey_2\survey_report.md and complete handoff.md.

## 2026-09-03T04:05:31Z
Survey the host machine environment and external dependencies:
1. Check installed runtimes, compilers, and package managers (Node.js, npm, Python, pip, etc.).
2. Check MongoDB availability: is a MongoDB server running locally, is mongod/mongosh available, can we use mongodb-memory-server or local MongoDB service?
3. Check LLM integration availability: inspect environment variables (e.g., GEMINI_API_KEY, OPENAI_API_KEY, etc.), network connectivity to LLM endpoints.
4. Assess PDF/image generation capabilities: what libraries can be used to generate realistic synthetic insurance claim PDFs and damage photos (e.g. reportlab, fpdf, canvas, pdfkit, etc.)?
5. Write your comprehensive report to d:\sih\.agents\teamwork_preview_explorer_survey_2\survey_report.md and write a self-contained handoff.md in your working directory.
Communicate completion back to the orchestrator via send_message.
