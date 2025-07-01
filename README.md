# Mira by Centum AI

A comprehensive educational management platform with AI-powered exam/lesson generation, doubt solving, content summarization, and dashboards for students, teachers, parents, and admins.

---

## 🚀 Features
- **AI Exam Generator**: Generate CBSE-aligned exam papers with advanced logic (Python FastAPI, OpenAI, ChromaDB)
- **AI Lesson Generator**: Multi-agent RAG-based lesson creation (Python FastAPI, LangChain, OpenAI)
- **Doubt Solving**: Student chat and context-aware doubt resolution (Express/Node, Python, OpenAI)
- **Content Summarizer**: Summarize uploaded PDFs or pasted text for study/memorization (FastAPI, OpenAI)
- **Dashboards**: Modern, fluid dashboards for students, teachers, parents, and admins (React + Shadcn-ui)
- **Light/Dark Mode**: Toggle for a beautiful, accessible UI

---

## 🗂️ Project Structure

```
root/
  client/           # React frontend (Shadcn-ui, Tailwind, Vite)
  server/           # Node.js/Express backend (legacy endpoints)
  fastapi_exam_api.py, ... # Python FastAPI APIs (AI, RAG, summarization)
  QPA_2.py, final_agentic_m4_RAG_logic.py, ... # Core AI logic
  attached_assets/  # PDFs, vector DBs, assets
  .env              # Environment variables (not committed)
```

---

## 🧑‍💻 API Endpoints

### Lesson Generation (FastAPI)
```
POST /api/generate-lesson
{
  "grade": "10",
  "subject": "Science",
  "sub_topic": "Electricity",
  "subtopics": "Ohm's Law, Circuits",
  "special_remarks": "Focus on real-world applications"
}
```
**Response:**
```json
{ "success": true, "lesson_content": "...markdown..." }
```

### Exam Generation (FastAPI)
```
POST /api/generate-exam
{
  "grade": "10",
  "subject": "Mathematics",
  "sub_topic": "Quadratic Equations",
  "difficulty": "medium",
  "question_types": ["mcq", "short_answer"],
  "duration": 90,
  "special_remarks": "Focus on solving methods",
  "total_marks": 80
}
```
**Response:**
```json
{ "success": true, "exam_paper": { ... } }
```

### Content Summarization (FastAPI)
```
POST /api/summarize-content
# Multipart: file=PDF or JSON: { "text": "..." }
```
**Response:**
```json
{ "summary": "...student-friendly summary..." }
```

### Doubt Solving (Express/Node, Python)
```
POST /api/solve-doubt
{
  "grade": "10",
  "subject": "Science",
  "topic": "Electricity",
  "doubt": "What is Ohm's Law?"
}
```
**Response:**
```json
{ "success": true, "answer": "...detailed explanation..." }
```

---

## 🛠️ Running Locally

### 1. Clone & Install
```bash
git clone <repo-url>
cd <repo>
# Install Node/React deps
cd client && npm install && cd ..
# (Optional) Install Python deps in venv
python3 -m venv deployment && source deployment/bin/activate
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the root:
```
OPENAI_API_KEY=sk-...
LANGSMITH_API_KEY=ls_...
# (other keys as needed)
```

### 3. Start Backends
- **FastAPI (AI endpoints):**
```bash
source deployment/bin/activate
uvicorn fastapi_exam_api:app --reload --port 4444
```
- **Node/Express (legacy):**
```bash
cd server && npm install && npm run dev
```

### 4. Start Frontend
```bash
cd client
npm run dev
```
Visit [http://localhost:5173](http://localhost:5173)

---

## 🏗️ Deployment
- Deploy FastAPI backend (e.g., on Render, Railway, or your own server)
- Deploy Node backend if needed
- Deploy React frontend (Vercel, Netlify, etc.)
- Set environment variables in your deployment platform
- Update frontend API URLs if deploying to production domains

---

## 🤝 Contributing
Pull requests welcome! Please open issues for bugs, features, or questions.

## 📄 License
[MIT](LICENSE) (or your preferred license) 