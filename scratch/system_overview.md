# PublishAI: System Purpose and Workflow Overview

## 1. System Purpose
**PublishAI** is an advanced platform designed to automate and streamline the entire lifecycle of academic manuscript publication. Writing, reviewing, and submitting academic papers is traditionally a manual, tedious, and error-prone process. PublishAI solves this by providing an end-to-end multi-agent AI system that takes a researcher's raw draft, scientifically reviews and polishes it, and autonomously submits it to target academic journals.

## 2. Core Stages of the System

### A. The AI Rewriting and Polishing Pipeline
When a manuscript is uploaded, it does not just undergo simple grammar checks. It enters a sophisticated multi-agent pipeline orchestrated by **Inngest**:
1. **Clarification & Planning**: The AI evaluates the manuscript to understand the core research question. If the claims are unclear or lack data, it halts and asks the user for clarification.
2. **Scientific Review & Debate ("The Ping-Pong")**: A unique feature where multiple AI agents take on different personas (e.g., a harsh critic vs. a supportive reviewer). They debate the methodology, validity, and conclusions of the paper.
3. **Drafting (Rewriting)**: Based on the debate conclusions and retrieved literature (via MCP tools connecting to literature databases), a specialized writer agent rewrites the sections to meet high academic standards.
4. **QA & Formatting**: Final checks for formatting, citation accuracy, and tone.

### B. The "Ping-Pong" (Human-in-the-Loop)
The system is highly autonomous but deeply respects the researcher's authority. During the pipeline, the AI might encounter a conflict (e.g., missing data, contradictory claims, or a captcha during submission). 
At this point, the backend pauses the process and initiates a **Ping-Pong** sequence. The system asks the user a targeted question. The pipeline remains frozen until the user responds, ensuring the AI never hallucinates critical scientific data.

### C. Autonomous RPA Submission
Once the manuscript is polished, the system moves to the **Submission Phase**:
- A Robotic Process Automation (RPA) bot is deployed.
- It automatically logs into the target journal's portal (e.g., OJS - Open Journal Systems, WordPress, or ScholarOne).
- It fills out all the complex metadata fields, author details, and uploads the manuscript files.
- If the bot encounters a Captcha or a totally unexpected screen, it pauses and pops up a `HumanInterventionModal` on the frontend, allowing the user to solve the Captcha manually so the bot can continue.

### D. Journal Cascade and Rejection Handling
In academia, rejections are common. PublishAI handles this gracefully through its **Journal Cascade** feature:
- If a journal rejects the paper, the system parses the rejection email and the reviewers' comments.
- It feeds these comments back into the AI Pipeline to dynamically correct the manuscript based on the feedback.
- It then automatically prepares and submits the revised manuscript to the *next* journal on the user's pre-defined priority list (the "Cascade").
- This ensures the manuscript is continuously improved and always moving towards publication without the researcher having to manually restart the grueling submission process.
