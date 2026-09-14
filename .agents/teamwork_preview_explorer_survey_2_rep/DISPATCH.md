# Task Assignment: Environment & Integration Survey (Replacement)

## Identity
- Archetype: teamwork_preview_explorer
- Role: Environment & Integration Explorer
- Working Directory: d:\sih\.agents\teamwork_preview_explorer_survey_2_rep

## Objective
Survey the host machine environment and external dependencies using command-line checks (`run_command`):
1. Runtimes: Run `node -v`, `npm -v`, `python --version`, `pip --version`.
2. Database: Check if MongoDB is running or installed:
   - Run `powershell -Command "Get-Service *mongo*"`
   - Run `powershell -Command "Get-Command mongod -ErrorAction SilentlyContinue"`
   - Run `powershell -Command "Test-NetConnection -ComputerName 127.0.0.1 -Port 27017"`
   - Assess using `mongodb-memory-server` (MMS) or local mongod for real MongoDB connectivity without facades.
3. LLM API Keys: Check if `GEMINI_API_KEY` or `OPENAI_API_KEY` are present in `$env:GEMINI_API_KEY` or `$env:OPENAI_API_KEY`.
4. PDF/Image Generation: Assess pure-JS or Python libraries (`pdf-lib`, `sharp`, `canvas`, `reportlab`, `fpdf2`) for generating realistic synthetic claim documents and damage photos.

WARNING: Do NOT use `read_url_content` to check raw binary ports like localhost:27017. Use `run_command` for all host queries.
Do NOT modify or write source code in project root.

## Deliverables
Write detailed findings to d:\sih\.agents\teamwork_preview_explorer_survey_2_rep\survey_report.md and complete handoff.md.
