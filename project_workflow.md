# CORPWISE - Visual Project Workflow

This document provides comprehensive visual diagrams showcasing how the CORPWISE enterprise knowledge assistant works end-to-end.

---

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend - React TypeScript"
        A[User Browser] --> B[RoleSelection Page]
        B --> C[ChatWindow]
        B --> D[AdminPanel]
        C --> E[MessageBubble Components]
        D --> F[Document Upload Form]
    end
    
    subgraph "API Layer - FastAPI"
        G[chat Endpoint]
        H[admin/documents Endpoints]
        I[feedback Endpoint]
        J[Rate Limiter]
        K[CORS Middleware]
    end
    
    subgraph "Core Services"
        L[Chat Orchestrator]
        M[Document Processor]
        N[Embeddings Service]
        O[Intent Detector]
        P[Memory Service]
    end
    
    subgraph "Data Storage"
        Q[(MongoDB)]
        R[(Pinecone Vector DB)]
    end
    
    subgraph "External APIs"
        S[Google Gemini API]
        T[SentenceTransformer Model]
    end
    
    C -->|POST request| G
    D -->|Upload| H
    E -->|Feedback| I
    
    G --> J
    H --> J
    I --> J
    J --> K
    
    K --> L
    K --> M
    K --> I
    
    L --> O
    L --> P
    L --> N
    L --> S
    
    M --> N
    M --> R
    
    N --> T
    N --> Q
    
    L --> R
    L --> Q
    P --> Q
    I --> Q
    
    style A fill:#4CAF50
    style Q fill:#FF9800
    style R fill:#2196F3
    style S fill:#9C27B0
    style T fill:#9C27B0
```

---

## 💬 User Chat Flow - Detailed

```mermaid
sequenceDiagram
    actor User
    participant UI as ChatWindow
    participant API as FastAPI Server
    participant Orch as Chat Orchestrator
    participant Intent as Intent Detector
    participant Embed as Embeddings Service
    participant Pine as Pinecone
    participant LLM as Gemini API
    participant Mongo as MongoDB
    
    User->>UI: Types question
    UI->>UI: Generate conversationId (UUID)
    UI->>API: POST /chat {user_id, question}
    
    API->>API: Rate limiting check (5/min)
    API->>Orch: process_chat(user_id, question)
    
    Orch->>Intent: detect_intent(question)
    Intent-->>Orch: Returns "EXPLANATION" / "FACT" / "GENERAL"
    
    alt System Question (e.g., "What is CORPWISE?")
        Orch->>Mongo: get_system_answer()
        Mongo-->>Orch: Pre-defined answer
        Orch-->>API: {reply, sources: [], confidence: "high"}
    else Greeting (e.g., "Hi")
        Orch-->>API: Friendly greeting response
    else Knowledge Query
        Orch->>Embed: embed_text(question)
        
        alt Cache Hit
            Embed->>Mongo: Check cache by hash
            Mongo-->>Embed: Return cached embedding
        else Cache Miss
            Embed->>Embed: Generate with SentenceTransformer
            Embed->>Mongo: Store in cache
        end
        
        Embed-->>Orch: Returns embedding [1024 dims]
        
        Orch->>Pine: query(embedding, top_k=20)
        Pine-->>Orch: Returns similar chunks with scores
        
        Orch->>Orch: diversify_chunks(max_per_source=1)
        Orch->>Orch: build_prompt(context + history)
        
        Orch->>LLM: Generate answer with context
        LLM-->>Orch: Generated answer
        
        Orch->>Orch: aggregate_confidence()
        Orch->>Mongo: Save conversation message
        Orch-->>API: {reply, sources, confidence, language}
    end
    
    API-->>UI: JSON response
    UI->>UI: Render MessageBubble
    UI-->>User: Display answer + sources
    
    opt User Provides Feedback
        User->>UI: Clicks 👍 (helpful)
        UI->>API: POST /feedback {conversation_id, helpful: true}
        API->>Mongo: Fetch last Q&A pair
        API->>Mongo: Cache as validated response
        API-->>UI: Success
    end
```

---

## 📤 Admin Document Upload Flow

```mermaid
sequenceDiagram
    actor Admin
    participant UI as AdminPanel
    participant Auth as AdminAuth
    participant API as /admin/documents
    participant Proc as Document Processor
    participant Embed as Embeddings Service
    participant Pine as Pinecone
    participant Mongo as MongoDB
    participant Disk as File System
    
    Admin->>UI: Navigate to /admin
    UI->>Auth: Show password prompt
    Admin->>Auth: Enter password
    Auth->>Auth: Validate (hardcoded: "admin123")
    Auth-->>UI: Authenticated ✓
    
    UI->>UI: Load document list
    UI->>API: GET /admin/documents
    API->>Mongo: DocumentModel.get_all()
    Mongo-->>API: Returns all documents
    API-->>UI: {documents: [...]}
    
    Admin->>UI: Select file (.md/.txt) + doc_type
    Admin->>UI: Click Upload
    
    UI->>API: POST /admin/documents/upload
    Note over API: FormData with file + doc_type
    
    API->>API: Validate file type (.md, .txt only)
    API->>API: Generate UUID doc_id
    API->>Disk: Save to uploads/{doc_id}_{filename}
    
    API->>Mongo: DocumentModel.create()
    Note over Mongo: status: "pending"
    
    API->>Proc: process_and_index_document()
    
    Proc->>Disk: Read file content
    Proc->>Proc: split_markdown_by_section()
    Note over Proc: Splits by headers (#, ##, etc.)
    
    loop For each section
        Proc->>Proc: chunk_text(section_body)
        Note over Proc: 400 words, 50 overlap
        
        loop For each chunk
            Proc->>Embed: embed_text(chunk)
            Embed-->>Proc: Returns embedding [1024]
            
            Proc->>Proc: Create chunk_id: {doc_id}__{section}__{i}
            
            Proc->>Pine: upsert(chunk_id, embedding, metadata)
            Note over Pine: Metadata: {text, source, section, doc_id, doc_type}
        end
    end
    
    Proc-->>API: {chunk_count, pinecone_ids, status: "indexed"}
    
    API->>Mongo: DocumentModel.update_status()
    Note over Mongo: status: "indexed", chunk_count
    
    API-->>UI: Success response
    UI->>UI: Refresh document list
    UI-->>Admin: Show success message ✓
```

---

## 🔍 RAG (Retrieval Augmented Generation) Pipeline

```mermaid
graph TD
    A[User Question] --> B{Intent Detection}
    
    B -->|System Query| C[get_system_answer]
    B -->|Greeting| D[Return Greeting]
    B -->|Knowledge Query| E[Semantic Search]
    
    C --> Z[Return Response]
    D --> Z
    
    E --> F[embed_text - Generate Query Embedding]
    F --> G{Embedding Cache?}
    
    G -->|Hit| H[Return Cached]
    G -->|Miss| I[SentenceTransformer Encode]
    I --> J[Cache to MongoDB]
    J --> H
    
    H --> K[Pinecone Vector Search]
    K --> L[Top 20 Similar Chunks]
    
    L --> M[Diversify Sources]
    M --> N[max_per_source=1, max_total=6]
    
    N --> O[Build Context String]
    O --> P[Retrieve Conversation History]
    
    P --> Q[Build Complete Prompt]
    Q --> R[System Instructions + Context + History + Question]
    
    R --> S[Gemini API Call]
    S --> T[Generate Answer]
    
    T --> U[Extract Sources]
    T --> V[Calculate Confidence]
    
    U --> W[Aggregate Response]
    V --> W
    
    W --> X[Save to Conversation History]
    X --> Z
    
    style A fill:#4CAF50
    style Z fill:#2196F3
    style K fill:#FF9800
    style S fill:#9C27B0
```

---

## 🗄️ Data Models & Storage

```mermaid
erDiagram
    MONGODB ||--o{ CONVERSATIONS : stores
    MONGODB ||--o{ DOCUMENTS : tracks
    MONGODB ||--o{ EMBEDDING_CACHE : caches
    MONGODB ||--o{ SYSTEM_INFO : contains
    
    PINECONE ||--o{ VECTOR_CHUNKS : indexes
    
    CONVERSATIONS {
        string user_id PK
        array messages
        datetime created_at
        datetime updated_at
    }
    
    DOCUMENTS {
        uuid _id PK
        string filename
        string doc_type
        string uploaded_by
        datetime uploaded_at
        string status
        int chunk_count
        array pinecone_ids
    }
    
    EMBEDDING_CACHE {
        string text_hash PK
        string text
        array embedding
        datetime created_at
    }
    
    VECTOR_CHUNKS {
        string id PK
        array embedding
        object metadata
    }
    
    VECTOR_CHUNKS ||--|| DOCUMENTS : belongs_to
```

---

## 🎯 Component Interaction Map

```mermaid
graph LR
    subgraph "React Components"
        A[App.tsx<br/>Router Config]
        B[RoleSelection<br/>Landing Page]
        C[ChatWindow<br/>User Interface]
        D[AdminPanel<br/>Doc Management]
        E[MessageBubble<br/>Message Display]
        F[FeedbackButtons<br/>👍 👎]
    end
    
    subgraph "API Clients"
        G[chat.ts<br/>sendQuery<br/>sendFeedback]
        H[admin.ts<br/>uploadDocument<br/>listDocuments<br/>deleteDocument]
    end
    
    subgraph "Backend Routes"
        I[chat]
        J[admin/documents/upload]
        K[admin/documents]
        L[feedback]
    end
    
    subgraph "Services"
        M[chat_orchestrator.py<br/>Main RAG Logic]
        N[document_processor.py<br/>Chunking & Indexing]
        O[embeddings.py<br/>Vector Generation]
    end
    
    A --> B
    A --> C
    A --> D
    
    C --> E
    C --> F
    
    C --> G
    D --> H
    F --> G
    
    G --> I
    G --> L
    H --> J
    H --> K
    
    I --> M
    J --> N
    L --> M
    
    M --> O
    N --> O
    
    style M fill:#FF5722
    style N fill:#FF5722
    style O fill:#FF5722
```

---

## ⚡ Request/Response Flow Examples

### Example 1: "Who is the CEO of CORPWISE?"

```mermaid
graph LR
    A["User Question:<br/>Who is the CEO?"] --> B[Intent: FACT]
    B --> C[Embed Question]
    C --> D["Pinecone Search<br/>(semantic similarity)"]
    D --> E["Retrieved Chunks:<br/>1. CEO info from hr/policy<br/>2. Leadership team data<br/>3. Company structure"]
    E --> F["Diversify:<br/>Select 1 chunk per source"]
    F --> G["Build Context:<br/>CEO: John Doe<br/>Founded: 2020"]
    G --> H["Gemini LLM:<br/>Answer with context"]
    H --> I["Response:<br/>The CEO of CORPWISE is John Doe<br/><br/>Sources: hr/policy (0.92)"]
    
    style A fill:#4CAF50
    style I fill:#2196F3
```

### Example 2: Document Upload

```mermaid
graph LR
    A["Admin uploads:<br/>employee_handbook.md"] --> B[Validate .md format]
    B --> C["Generate UUID:<br/>abc-123-def"]
    C --> D["Save to disk:<br/>uploads/abc-123-def_employee_handbook.md"]
    D --> E[Split by sections:<br/># Benefits<br/># Leave Policy<br/># Code of Conduct]
    E --> F[Chunk each section:<br/>400 words, 50 overlap]
    F --> G["Generate embeddings:<br/>25 chunks total"]
    G --> H["Store in Pinecone:<br/>with metadata"]
    H --> I["Update MongoDB:<br/>status: indexed<br/>chunk_count: 25"]
    I --> J["✓ Available for<br/>retrieval in chat"]
    
    style A fill:#FF9800
    style J fill:#4CAF50
```

---

## 🔄 Caching Strategy

```mermaid
graph TD
    A[Request Arrives] --> B{Embedding Cache?}
    
    B -->|Cache Hit| C[Return Cached Embedding<br/>~1ms]
    B -->|Cache Miss| D[Generate New Embedding<br/>~100ms]
    
    D --> E[Store in MongoDB Cache<br/>Key: SHA256 hash of text]
    E --> C
    
    C --> F[Pinecone Vector Search]
    
    F --> G{Q&A Cache?}
    G -->|Exact Match| H[Return Cached Answer<br/>~5ms]
    G -->|No Match| I[RAG Pipeline<br/>~2000ms]
    
    I --> J{User Feedback?}
    J -->|👍 Helpful| K[Store in Q&A Cache]
    J -->|No Feedback| L[Don't Cache]
    
    K --> M[Available for Future Queries]
    L --> M
    H --> M
    
    style C fill:#4CAF50
    style H fill:#4CAF50
    style D fill:#FF9800
    style I fill:#FF9800
```

---

## 📊 Technology Stack Visualization

```mermaid
mindmap
  root((CORPWISE))
    Frontend
      React 19
      TypeScript 5
      React Router 7
      CSS Modules
    Backend
      FastAPI
      Python 3.x
      Uvicorn ASGI
      Pydantic
    AI/ML
      Google Gemini API
        Text Generation
        Context Understanding
      SentenceTransformers
        multilingual-e5-large
        1024-dim embeddings
    Databases
      MongoDB
        Conversations
        Document Metadata
        Embedding Cache
        System Info
      Pinecone
        Vector Index
        Semantic Search
        Similarity Matching
    DevOps
      Git/GitHub
      npm Package Manager
      pip/venv
      Environment Variables
    Libraries
      Motor - Async MongoDB
      SlowAPI - Rate Limiting
      python-dotenv - Config
```

---

## 🎨 User Journey Map

### User Journey: Getting an Answer

```mermaid
journey
    title Employee Asking Question about Leave Policy
    section Access
      Open CORPWISE: 5: User
      Select "I'm a User": 5: User
    section Interaction
      Type "What is leave policy?": 5: User
      Click Send: 5: User
      Wait for response: 3: User, System
    section Result
      Read answer with citations: 5: User
      Click thumbs up: 5: User
      Get confirmation: 5: User, System
```

### Admin Journey: Adding Documentation

```mermaid
journey
    title Admin Uploading New Company Policy
    section Access
      Open CORPWISE: 5: Admin
      Select "I'm an Admin": 5: Admin
      Enter password: 4: Admin
    section Upload
      Select policy.md file: 5: Admin
      Choose document type: 5: Admin
      Click Upload: 5: Admin
      Wait for processing: 3: Admin, System
    section Verification
      See success message: 5: Admin
      Verify in document list: 5: Admin
      Test with sample query: 5: Admin
```

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Client Side"
        A[Web Browser]
        B[Mobile Browser]
    end
    
    subgraph "CDN / Static Hosting"
        C[React Build<br/>Optimized Bundle]
    end
    
    subgraph "Application Server"
        D[FastAPI Backend<br/>uvicorn]
        E[Rate Limiter]
        F[CORS Handler]
    end
    
    subgraph "Data Layer"
        G[(MongoDB Atlas<br/>Cloud)]
        H[(Pinecone<br/>Vector Cloud)]
    end
    
    subgraph "External Services"
        I[Google Gemini API]
        J[SentenceTransformers<br/>Model Files]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    D --> I
    D --> J
    
    style C fill:#4CAF50
    style D fill:#2196F3
    style G fill:#FF9800
    style H fill:#FF9800
    style I fill:#9C27B0
```

---

## 📈 Performance Metrics Flow

```mermaid
graph LR
    A[Request Received] --> B[Rate Limiter Check]
    B --> C[Cache Lookup<br/>~1-5ms]
    C -->|Hit| D[Return Cached<br/>Total: 5ms]
    C -->|Miss| E[Generate Embedding<br/>~100ms]
    E --> F[Pinecone Search<br/>~50ms]
    F --> G[LLM Generation<br/>~1500ms]
    G --> H[Response Assembly<br/>~10ms]
    H --> I[Total: ~1660ms]
    
    style D fill:#4CAF50
    style I fill:#FF9800
```

---

## 🔐 Security & Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant CORS
    participant RateLimit
    participant API
    participant Services
    
    User->>Frontend: Access Application
    Frontend->>Frontend: Generate Session ID
    
    User->>Frontend: Send Request
    Frontend->>CORS: Preflight Check
    CORS->>CORS: Validate Origin & X-Company-ID
    
    CORS->>RateLimit: Forward Request
    RateLimit->>RateLimit: Check IP Limits (5/min)
    
    alt Rate Limit Exceeded
        RateLimit-->>Frontend: 429 Too Many Requests
    else Within Limit
        RateLimit->>API: Process Request
        API->>Services: Execute Business Logic
        Services-->>API: Return Result
        API-->>Frontend: Success Response
    end
    
    Frontend-->>User: Display Result
```

---



---

## 🏢 Multi-Tenant Data Isolation

```mermaid
graph TD
    subgraph "Tenant A: SilaiBook"
        A1[User: SilaiBook Admin]
        A2[User: SilaiBook Employee]
    end

    subgraph "Tenant B: Corpwise"
        B1[User: Corpwise Admin]
        B2[User: Corpwise Employee]
    end

    subgraph "API Layer"
        C{Request Handler}
        C -->|Header: X-Company-ID=silaibook| D[Context: SilaiBook]
        C -->|Header: X-Company-ID=corpwise| E[Context: Corpwise]
    end

    subgraph "Retrieval Engine"
        F[Vector Search]
        G[Keyword Search]
    end

    subgraph "Data Layer"
        H[(Pinecone NS: silaibook)]
        I[(Pinecone NS: corpwise)]
        J[(MongoDB: company_id: silaibook)]
        K[(MongoDB: company_id: corpwise)]
    end

    A1 -->|Upload Doc| C
    A2 -->|Chat Query| C
    B1 -->|Upload Doc| C
    B2 -->|Chat Query| C

    D --> F
    D --> G
    E --> F
    E --> G

    F -->|Query Namespace| H
    F --x|Isolation| I
    
    G -->|Filter Metadata| J
    G --x|Isolation| K

    style H fill:#4CAF50
    style J fill:#4CAF50
    style I fill:#FF9800
    style K fill:#FF9800
```

---

## 🌗 Dual-Mode Frontend Architecture

```mermaid
graph TD
    subgraph "Core Logic (Shared)"
        A[useChat Hook]
        B["API Client (chat.ts)"]
        C["Global State (User/Auth)"]
    end

    subgraph "Mode 1: Fullscreen Dashboard"
        D[DashboardLayout]
        E[Sidebar]
        F[AdminPanel]
        G[Large Chat Window]
    end

    subgraph "Mode 2: Embeddable Widget"
        H[ChatWidget]
        I[Floating Button]
        J[Popover Window]
    end

    subgraph "Host Application"
        K["SilaiBook / External App"]
    end

    D --> A
    H --> A
    A --> B

    D --> E
    D --> F
    D --> G

    K --> H
    H --> I
    H --> J

    style A fill:#FF9800
    style D fill:#2196F3
    style H fill:#9C27B0
    style K fill:#607D8B
```
