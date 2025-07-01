# Mira by Centum AI - Educational Platform

## Overview

Mira by Centum AI is a comprehensive educational platform designed for CBSE schools, integrating AI-powered features for students, teachers, parents, and administrators. The platform provides intelligent doubt solving, automated exam generation, personalized lesson planning, and comprehensive dashboard management across all stakeholder roles.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with modern ES modules
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state, local React state for UI
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Node.js Server**: Express.js with TypeScript
- **Python Services**: FastAPI microservices for AI-powered features
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions
- **File Handling**: Multer for PDF uploads and processing

### AI Services Architecture
- **OpenAI Integration**: GPT-4o model for content generation and doubt resolution
- **Vector Database**: ChromaDB for semantic search and retrieval
- **PDF Processing**: PyPDF for document parsing and text extraction
- **Embeddings**: OpenAI embeddings for semantic similarity

## Key Components

### Student Portal
- **Doubt Chat System**: Real-time AI-powered doubt resolution with math rendering support
- **AI Practice Playground**: Upload practice responses and ideal answers for detailed feedback with marking schemes
- **Notes Viewer**: Interactive study materials with AI explanations
- **Homework Management**: Assignment tracking and submission system
- **Progress Analytics**: Performance tracking and learning insights
- **Study Schedule**: Personalized learning calendar

### Teacher Portal
- **AI Exam Generator**: Automated test paper creation based on CBSE standards
- **Lecture Preparation**: AI-assisted lesson planning and content generation
- **Student Analytics**: Performance monitoring and intervention recommendations
- **Assignment Interface**: Digital assignment creation and grading
- **Doubt Resolution**: Teacher dashboard for student query management

### Parent Portal
- **Academic Progress Overview**: Real-time student performance tracking
- **Attendance Monitoring**: Automated attendance alerts and reports
- **Fee Payment Integration**: Digital payment portal with notifications
- **Communication Center**: Direct messaging with teachers and school
- **Exam Results**: Comprehensive result analysis and insights

### Admin Dashboard
- **User Management**: Role-based access control and user administration
- **System Monitoring**: Platform health and usage analytics
- **Content Management**: Curriculum and resource administration
- **Reporting Suite**: Comprehensive analytics and business intelligence

## Data Flow

### Authentication & Authorization
1. Role-based authentication (Student/Teacher/Parent/Admin)
2. Session-based security with PostgreSQL persistence
3. Route protection based on user roles

### AI Processing Pipeline
1. **Input Processing**: User queries processed through OpenAI API
2. **Context Retrieval**: Relevant content fetched from vector database
3. **Response Generation**: AI-generated responses with curriculum alignment
4. **Quality Assurance**: Multi-iteration refinement for accuracy

### Document Processing
1. **PDF Upload**: Secure file handling with validation
2. **Text Extraction**: PyPDF processing for content analysis
3. **Vector Storage**: Document embeddings stored in ChromaDB
4. **Semantic Search**: Context-aware content retrieval

## External Dependencies

### AI & ML Services
- **OpenAI API**: GPT-4o for text generation and embeddings
- **ChromaDB**: Vector database for semantic search
- **LangChain**: Text processing and document handling

### Infrastructure
- **PostgreSQL**: Primary data storage with connection pooling
- **Neon Database**: Serverless PostgreSQL hosting
- **Node.js 20**: JavaScript runtime environment
- **Python 3.11**: AI service runtime

### Frontend Libraries
- **React Ecosystem**: React Query, React Hook Form, React Router
- **UI Libraries**: Radix UI, Tailwind CSS, Lucide React icons
- **Math Rendering**: KaTeX for mathematical expression display

## Deployment Strategy

### Development Environment
- **Replit Configuration**: Integrated development with live preview
- **Hot Reload**: Vite HMR for rapid development iteration
- **Environment Variables**: Secure API key management

### Production Deployment
- **Build Process**: Vite production build with optimization
- **Server Deployment**: Node.js with Express for API serving
- **Static Assets**: Optimized frontend bundle serving
- **Database**: PostgreSQL with connection pooling

### Scaling Considerations
- **Microservices**: Separate Python services for AI processing
- **Caching**: Query result caching for performance
- **Load Balancing**: Horizontal scaling capability
- **CDN Integration**: Asset delivery optimization

## Recent Changes
- June 23, 2025: Initial setup
- June 23, 2025: Added AI Practice Playground feature with FastAPI backend for student response analysis
- June 23, 2025: Fixed Practice Playground rendering errors and implemented robust data type handling
- June 23, 2025: Added Practice Playground Demo to both Student Pilot and Student Dashboard demo versions
- June 23, 2025: Created AI Tutor Mira feature with content upload, personalized exam generation, and interactive tutoring chat
- June 23, 2025: Built comprehensive AI agent backend with specialized teaching prompts and integrated with Express server
- June 23, 2025: Added mathematical formula rendering with KaTeX and enhanced AI tutor prompts for proper LaTeX formatting
- June 23, 2025: Integrated AI Tutor Mira into Student Pilot Edition alongside Doubt Chat and Practice Playground
- June 23, 2025: Updated all AI features to use GPT-4O-mini model for cost efficiency while maintaining quality
- June 23, 2025: Added comprehensive loading bars with progress indicators for doubt chat, exam generation, and lesson generation features
- June 25, 2025: Fixed lesson generation "Unexpected end of form" error by removing problematic multer file upload and switching to JSON-based API
- June 26, 2025: Integrated LangSmith tracing into final_agentic_m4.py for comprehensive lesson generation monitoring
- June 26, 2025: Added ChromaDB vectorstore query functionality to all agents in lesson generation system for enhanced curriculum-aligned content
- June 27, 2025: Implemented comprehensive Auth0 authentication system for students and teachers with role-based access control
- June 27, 2025: Updated database schema to support Auth0 integration with user profiles and authentication middleware
- June 27, 2025: Created authentication providers, login/logout components, and updated navigation with user profile display
- June 27, 2025: Fixed Auth0 authentication backend issues and implemented role-based login buttons on landing page
- June 27, 2025: Created RoleBasedLoginButton component that maintains original design while enabling Auth0 authentication
- June 27, 2025: Updated landing page to use role-based authentication for student and teacher access while preserving original layout
- June 27, 2025: Fixed authentication routing so students go to student-dashboard and teachers go to teacher-dashboard (not pilot versions)
- June 27, 2025: Removed authentication requirement for pilot dashboards - users can now access demo versions directly without login
- June 28, 2025: Integrated enhanced RAG logic from final_agentic_m4_RAG_logic.py with comprehensive vectorstore filtering and improved curriculum context retrieval
- June 28, 2025: Updated lesson generation pipeline to use enhanced RAG-enabled agents with specialized curriculum, content, and pedagogy experts
- June 28, 2025: Fixed PDF generation empty content issues with improved markdown-to-HTML conversion and visible container rendering
- June 28, 2025: Fixed unterminated string literal errors across all API endpoints by implementing comprehensive input sanitization for newlines, tabs, and carriage returns
- June 28, 2025: Replaced lesson generation system to use OrchestratorAgent from final_agentic_m4_RAG_logic.py with multi-agent workflow including curriculum expert, content creator, problem-solving expert, quality assurance, and refinement agents
- June 28, 2025: Fixed cleanedText variable reference errors in AI exam generator and implemented consistent mathematical expression rendering with KaTeX support matching lesson generation formatting
- June 28, 2025: Completed AI exam generator formatting update to provide consistent user experience across all content generation features with proper line-by-line formatting for headers, sections, questions, and mathematical expressions
- June 28, 2025: Shifted AI exam generation logic to use comprehensive QPA_2.py with multi-agent workflow including CBSE validation, question generation specialists, and test paper orchestration
- June 28, 2025: Updated LangSmith tracing setup in QPA_2.py to match final_agentic_m4_RAG_logic.py pattern for consistent monitoring across all AI services
- June 28, 2025: Removed markdown headers (###, ---) from AI exam generator display for cleaner professional formatting without syntax artifacts
- June 28, 2025: Created enhanced PDF generator with comprehensive LaTeX division rendering fixes, full content preservation to prevent missing sections, and proper filename formatting
- June 28, 2025: Applied enhanced PDF generation to both exam and lesson generation with consistent LaTeX rendering, filename formats ({Subject}_Class_{Grade}_Exam.pdf and {Subject}_Class_{Grade}_Lesson.pdf), and complete content preservation
- June 28, 2025: Fixed lesson generation JSON parsing errors by implementing marked delimiters (###JSON_START### and ###JSON_END###) for clean extraction and robust handling of complex Python output
- June 29, 2025: Implemented persistent document state system using React Context and sessionStorage to maintain generated exams and lessons when switching between tabs, preventing content loss during navigation
- June 30, 2025: Fixed lesson generation error by migrating from complex JSON structures to pure markdown output format - backend now returns only lesson_content instead of nested lesson_data.metadata objects, simplifying data flow and eliminating property access errors
- June 30, 2025: Updated frontend to display lesson metadata directly from form data instead of relying on backend metadata structure, ensuring consistent display regardless of generation method used

## User Preferences

Preferred communication style: Simple, everyday language.