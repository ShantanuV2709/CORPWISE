# CORPWISE

The Intelligent Corporate Knowledge Assistant

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Pinecone](https://img.shields.io/badge/Vector-Pinecone-black?style=for-the-badge&logo=pinecone)](https://www.pinecone.io/)

---

> Want to see how everything works? Check out the [Visual Project Workflow](project_workflow.md) with 12+ interactive architecture diagrams and data flow visualizations.

---

CORPWISE is a cutting-edge AI assistant designed to bridge the gap between your employees and your corporate knowledge base. From HR policies, technical documentation, to project archives, CORPWISE ensures the right information is just a question away.

Ask questions, get answers instantly—just like asking a colleague.

## Key Features

### Admin & Control
- Document Upload & Management: Admins can upload `.md` and `.txt` files with automatic chunking and indexing
- User Management: Role-based access control (Employees vs. Admins)
- System Monitoring: View ingestion status and system health

### Smart Conversational AI
- Natural Language Queries: Ask questions in plain English (or any language)
- Feedback Loop: Users can upvote/downvote answers to continuously improve retrieval accuracy
- Source Citations: Every answer comes with links to the source documents for verification

### Advanced Retrieval
- Hybrid Search: Combines semantic search (vector embeddings) with keyword search for maximum precision
- Re-ranking: Uses cross-encoders to re-rank search results and filter out irrelevant context
- Query Expansion: Automatically expands user queries to include synonyms and related terms
- Caching: Embeddings and successful Q&A pairs are cached for instant retrieval

### Embeddable Widget
- Drop-in Integration: lightweight chat widget (`<ChatWidget />`) that works on any React site
- Dual-Mode Architecture: Run purely as a widget or as a full admin dashboard
- Responsive Design: "Glassmorphism" UI that adapts to any brand aesthetic

### Premium "Cyber-Glass" Design
- **Immersive UI:** A persistent, animated background with floating glass elements (`backdrop-filter`) creates a modern, depth-filled experience
- **Fluid Animations:** Smooth transitions, hover lift effects, and refined message bubbles
- **Responsive Layout:** Fully optimized for both desktop dashboards and mobile devices

### Subscription Management
- **Tiered Access:** Built-in support for multiple subscription tiers (Free, Professional, Enterprise)
- **Feature Gating:** Automatically restricts features (e.g., max documents, analytics) based on the active plan
- **Self-Service Updates:** Admins can upgrade their organization's tier directly from the portal

### Super Admin Portal (SaaS Ready)
- **Multi-Tenant Oversight:** specific dashboard for Super Admins to view all registered companies
- **Usage Analytics:** aggregated statistics on total documents, queries, and active subscriptions
- **Tenant Control:** Ability to suspend, activate, or delete tenant organizations and their data

### Search Debugging & Observability
- **Test Retrieval Tool:** Dedicated admin tab to simulate queries and visualize retrieved chunks with confidence scores
- **Metadata Visibility:** View detailed document metrics including vector dimensions (e.g., 1536d) and file sizes
- **Score Transparency:** Color-coded similarity scores help admins understand why certain answers are generated

### Multi-Tenant Architecture
- Data Isolation: Strict separation of documents via `Company ID`
- Dynamic Branding: The AI adapts its persona (Name, Greeting) based on the active Tenant
- Scalable: Host thousands of companies on a single instance

---

## Tech Stack

- Frontend: React 18, TypeScript, Glassmorphism CSS (Custom)
- Backend: Python 3.9+, FastAPI, SlowAPI
- Authentication: JWT-based Auth (Employee & Admin scopes)
- AI Model: Google Gemini 2.5 Flash / Pro
- Database: MongoDB (Metadata, Users, Chats), Pinecone (Vector Search, Multi-Dimension Support)
- Orchestration: LangChain / Custom RAG Pipeline

---

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- Python (v3.9+)
- MongoDB (Running locally or via Atlas)
- Pinecone Account (API Key required)

### 1. Clone the Repository
```bash
git clone https://github.com/ShantanuV2709/CORPWISE.git
cd CORPWISE
```

### 2. Backend Setup
Navigate to the backend directory and set up the environment:
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Environment Variables: Create a `.env` file in `backend/` with:
```env
MONGODB_URL=mongodb://localhost:27017
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENV=your_pinecone_env
GEMINI_API_KEY=your_gemini_key
```

Start the backend server:
```bash
uvicorn app.main:app --reload
```
The API will run at `http://localhost:8000`.

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd corpwise-chat

# Install dependencies
npm install

# Run the development server
npm start
```
The application will be accessible at `http://localhost:3000`.

---

## 🚀 Using the Embeddable Widget

CORPWISE is designed to be embedded into other applications (like **SilaiBook**, **Project Phoenix**, or company Intranets).

### 1. Copy the Components
Copy the following files from `corpwise-chat/src` to your target project:
- `components/ChatWidget.tsx` (The main floating bubble)
- `components/MessageBubble.tsx`
- `components/SystemProcessing.tsx` (Typing indicator)
- `components/DecryptedText.tsx` (Animation)
- `hooks/useChat.ts` (State logic)
- `api/chat.ts` (API connector)

### 2. Install Dependencies
Your target project needs these standard packages:
```bash
npm install framer-motion lucide-react react-markdown remark-gfm
```

### 3. Add to your App
Import it in your main layout or root component:

```tsx
import ChatWidget from "./components/ChatWidget";

export default function App() {
  return (
    <div className="App">
       {/* Your main app content */}
       <ChatWidget /> 
    </div>
  );
}
```

### 4. Configure Authentication (Secure)
To connect securely to CORPWISE, you need an **API Key** and your **Company ID**.

1. **Generate an API Key**:
   - Log in to your CORPWISE Admin Panel.
   - Go to the **API Access** tab.
   - Click "Generate New Key", name it (e.g., "Website Widget"), and copy the key.

2. **Configure the Widget**:
   Update `hooks/useChat.ts` or your config file to include these credentials.

```typescript
// src/config.ts
export const CORPWISE_CONFIG = {
  API_URL: "https://your-corpwise-backend.com",
  COMPANY_ID: "your-company-id", // e.g., "silaibook"
  API_KEY: "sk-corpwise-..."     // The key you generated
};
```

3. **Update API Calls**:
   Ensure `api/chat.ts` sends these headers:
```typescript
headers: {
    "Content-Type": "application/json",
    "X-Company-ID": CORPWISE_CONFIG.COMPANY_ID,
    "X-API-Key": CORPWISE_CONFIG.API_KEY
}
```

---

## Project Structure

```
CORPWISE/
├── backend/                # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API Routes (Chat, Admin, Users)
│   │   ├── core/           # Config & Security
│   │   ├── db/             # Database Connections
│   │   ├── models/         # Pydantic Models
│   │   ├── services/       # Business Logic (RAG, LLM, Retrieval)
│   │   └── main.py         # App Entry Point
│   ├── documents/          # Stored Document Files
│   └── requirements.txt    # Python Dependencies
│
├── corpwise-chat/          # React Frontend
│   ├── public/             # Static Assets
│   ├── src/
│   │   ├── api/            # API Integration
│   │   ├── components/     # Reusable UI Components
│   │   ├── pages/          # Application Pages
│   │   ├── types/          # TypeScript Definitions
│   │   └── App.tsx         # Root Component
│   └── package.json        # Node Dependencies
│
├── project_workflow.md     # Visual Architecture Documentation
└── README.md               # Project Documentation
```

---

## How It Works

CORPWISE uses Retrieval Augmented Generation (RAG) to provide accurate, context-aware answers:

1. Document Ingestion: Admins upload documents, which are automatically chunked and converted into vector embeddings
2. Query Processing: User questions are embedded and matched against the vector database using semantic search
3. Context Retrieval: The most relevant document chunks are retrieved and ranked
4. Answer Generation: Google Gemini generates a response using the retrieved context
5. Source Attribution: The system provides links to source documents for verification

---

## API Endpoints

### Chat
- `POST /chat` - Submit a question and receive an AI-generated answer

### Admin
- `POST /admin/documents/upload` - Upload new documents (.md, .txt)
- `GET /admin/documents` - List all uploaded documents
- `DELETE /admin/documents/{doc_id}` - Delete a specific document

### Feedback
- `POST /feedback` - Submit feedback (thumbs up/down) on answers

### Subscription
- `GET /subscription/tiers` - List all available subscription plans
- `PUT /admin/subscription` - Update the current organization's subscription tier

### Super Admin
- `GET /super/companies` - List all tenants and their tier status
- `GET /super/statistics` - View platform-wide usage metrics
- `PUT /super/company/{id}/tier` - Force-update a tenant's tier
- `DELETE /super/company/{id}` - Hard delete a tenant and all associated data

### System
- `GET /health` - Health check endpoint
- `GET /db-check` - Database connection verification

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request to help improve CORPWISE.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit your Changes (`git commit -m 'Add some NewFeature'`)
4. Push to the Branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

## Contact

For questions or support, please open an issue on GitHub.
