# PublishAI API Documentation

## Overview
This document outlines the core API architecture and endpoints for the PublishAI MVP platform.

## Authentication
PublishAI uses session-based authentication / Bearer tokens for secure endpoint access.
- Header: `Authorization: Bearer <token>`

## Endpoints

### Projects & Papers
- `GET /api/projects`: List user projects and papers.
- `POST /api/projects`: Create a new paper project.
- `GET /api/projects/:id`: Get project details, sections, and metadata.
- `PUT /api/projects/:id`: Update paper content, title, or configuration.
- `DELETE /api/projects/:id`: Remove a project.

### Literature & Citations
- `POST /api/literature/search`: Query scientific databases (PubMed, Crossref, arXiv).
- `POST /api/literature/cite`: Format and attach citation to paper.

### AI Writing Assistant
- `POST /api/ai/draft`: Generate draft content for a specific manuscript section.
- `POST /api/ai/refine`: Polish, rephrase, or adapt academic tone.

### Review Response Agent
- `POST /api/reviews/parse`: Ingest reviewer comments and point-by-point critique.
- `POST /api/reviews/generate-response`: Generate rebuttal and revision plan.

### Journal Submission & Export
- `GET /api/journal/guidelines`: Fetch journal formatting criteria and submission checks.
- `POST /api/export/docx`: Export formatted manuscript to DOCX.
- `POST /api/export/pdf`: Export formatted manuscript to PDF.

## Error Handling
Standard JSON error responses:
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid input parameters",
    "details": []
  }
}
```
