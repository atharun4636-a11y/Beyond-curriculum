# Aegis LearnEnterprise Platform

> Comprehensive AI-Powered Learning Resources, Department Curriculum & Hackathon Portal

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-blue.svg)]()
[![Python](https://img.shields.io/badge/Backend-FastAPI%20%2B%20SQLite-green.svg)]()
[![Deployment](https://img.shields.io/badge/Deploy-Vercel%20%2F%20Render-black.svg)]()

---

## 🌟 Key Features

1. **Smart Learning Resources Engine**:
   - **Priority Relevance Score**: Computes real-time priority scores based on Department Match (+30), Employee Skill Match (+25), Active Hackathon Skill Match (+20), and Approaching Hackathon Deadlines (+15).
   - **Department Curriculums**:
     - **Data Engineering (DE)**: W3Schools SQL, GeeksforGeeks Advanced SQL, PySpark & Spark Docs, Real Python, Databricks Lakehouse, LeetCode Top 50 SQL, HackerRank SQL, AWS Data Engineering, Power BI Certification, and GitHub Beginner DE Pipeline Project.
     - **Cognitive Technology (COGNITIVE / CT)**: W3Schools SQL, Python 3.12 AI, FastAPI Microservices, AWS AI Practitioner & Bedrock, *Generative AI for Beginners*, *LangChain for Beginners*, *LangGraph Agentic Workflows*, and Power BI.
     - **DCG**: Full-stack development, SQL, PySpark, Databricks, AWS, Power BI, and LeetCode 75 practice.

2. **Executive Admin Resource Portal**:
   - **`⚡ Generate Resources`**: Automated resource discovery & generation engine with department taxonomy mapping across All Departments or specific departments.
   - **`+ Add New Resource`**: Manual resource creator with instant real-time sync to the Employee Learning Hub.

3. **Hackathon Registration & Proof Verification**:
   - Employees register for Unstop/Devpost hackathons and upload screenshot proofs.
   - Admins inspect uploaded proofs in a modal overlay to verify or reject registrations.

4. **Weekly Coding & AI Vocabulary Practice**:
   - Assigns weekly coding challenges (LeetCode/HackerRank) and daily 10-word AI vocabulary story challenges evaluated by AI.

---

## 🚀 1-Click Deployment Instructions

### Option A: Vercel (Recommended - Free Cloud Hosting)

This project is pre-configured for **Vercel** with zero-config serverless FastAPI (`api/index.py`) and Vite React build (`vercel.json`):

1. Push your repository to GitHub (`https://github.com/atharun4636-a11y/Beyond-curriculum.git`).
2. Go to **[Vercel Dashboard](https://vercel.com/new)** and click **Add New Project**.
3. Select your **`Beyond-curriculum`** repository.
4. Click **Deploy**! Vercel will automatically build the React frontend and deploy the FastAPI backend serverless functions.

### Option B: Local Running & Production Build

#### 1. Start FastAPI Backend:
```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\python.exe main.py
# Mac/Linux:
source .venv/bin/activate && python main.py
```

#### 2. Start Vite Frontend:
```bash
npm install
npm run dev
```

#### 3. Production Build Test:
```bash
npm run build
```

---

## 🛠️ Project Structure

```text
hackathon-portal/
├── api/                    # Vercel Serverless Function entry point (api/index.py)
├── backend/                # FastAPI Python Backend
│   ├── connectors/         # External API Connectors (Unstop, Devpost, LeetCode)
│   ├── services/           # Resource Recommendation, Matching & Sync Services
│   ├── database.py         # SQLite Schema & Seeding Engine
│   ├── main.py             # FastAPI App & REST Endpoints
│   ├── models.py           # Pydantic & SQLAlchemy Models
│   └── seed_curriculum.py  # Department Curriculum Seeding Script
├── src/                    # React Frontend Source Code
│   ├── components/         # UI Components (Button, Card, Input)
│   ├── layouts/            # Dashboard Sidebar & Header Layout
│   ├── pages/              # Admin & Employee Pages
│   └── utils/              # API Client & IndexedDB Utilities
├── vercel.json             # Vercel Deployment Configuration
└── vite.config.js          # Vite Build Configuration
```
