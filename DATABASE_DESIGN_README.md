# Database Design for Educational Platform

## Overview

This document outlines the comprehensive database design for the multi-role educational platform supporting Students, Teachers, Parents, and Administrators. The design tracks all user activities, content generation, and provides analytics for platform optimization.

## Table of Contents

1. [Core Database Architecture](#core-database-architecture)
2. [User Management Layer](#user-management-layer)
3. [Content Generation Tracking](#content-generation-tracking)
4. [Usage Analytics & Tracking](#usage-analytics--tracking)
5. [Educational Content Management](#educational-content-management)
6. [Collaboration & Sharing](#collaboration--sharing)
7. [Notifications & Communication](#notifications--communication)
8. [Implementation Strategy](#implementation-strategy)

## Core Database Architecture

The database follows a modular design with the following key principles:

- **User-Centric**: All content is attributed to users with complete audit trails
- **Role-Based**: Different content types and permissions for different user roles
- **Scalable**: JSON fields for flexible schema evolution
- **Analytics-Ready**: Comprehensive tracking for business insights
- **Cost-Aware**: AI usage tracking for optimization

## User Management Layer

### Enhanced Users Table
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    auth0_id VARCHAR UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
    roles TEXT[] NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_image_url VARCHAR(255),
    school_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    usage_quota INTEGER DEFAULT 100
);
```

### User Activity Tracking
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    login_time TIMESTAMP DEFAULT NOW(),
    logout_time TIMESTAMP,
    ip_address INET,
    device_info JSONB,
    session_duration INTEGER,
    activities_count INTEGER DEFAULT 0
);
```

## Content Generation Tracking

### Master Content Generation Log
```sql
CREATE TABLE content_generations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN 
        ('exam', 'lesson', 'doubt_solution', 'tutor_session', 'practice_analysis')),
    title VARCHAR(500),
    description TEXT,
    input_parameters JSONB NOT NULL,
    generated_content TEXT,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'generating',
    generation_time_ms INTEGER,
    token_usage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_favorite BOOLEAN DEFAULT FALSE,
    shared_with TEXT[],
    version_number INTEGER DEFAULT 1
);
```

### Exam Generation
```sql
CREATE TABLE generated_exams (
    id SERIAL PRIMARY KEY,
    content_generation_id INTEGER REFERENCES content_generations(id),
    exam_config JSONB NOT NULL,
    questions JSONB NOT NULL,
    total_marks INTEGER NOT NULL,
    estimated_time INTEGER NOT NULL,
    question_distribution JSONB,
    curriculum_aligned BOOLEAN DEFAULT TRUE,
    marking_scheme TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    used_by_students TEXT[],
    performance_stats JSONB
);

CREATE TABLE exam_questions (
    id SERIAL PRIMARY KEY,
    generated_exam_id INTEGER REFERENCES generated_exams(id),
    question_number INTEGER NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT[],
    correct_answer TEXT,
    explanation TEXT,
    marks_allocated INTEGER NOT NULL,
    difficulty_level VARCHAR(20),
    learning_objective TEXT,
    related_concepts TEXT[],
    student_responses JSONB
);
```

### Lesson Generation
```sql
CREATE TABLE generated_lessons (
    id SERIAL PRIMARY KEY,
    content_generation_id INTEGER REFERENCES content_generations(id),
    lesson_config JSONB NOT NULL,
    lesson_content TEXT NOT NULL,
    key_concepts TEXT[] NOT NULL,
    examples TEXT[],
    practice_questions JSONB,
    visual_aids_suggestions TEXT[],
    estimated_duration INTEGER,
    difficulty_level VARCHAR(20),
    prerequisite_topics TEXT[],
    follow_up_topics TEXT[]
);
```

### AI Tutoring Sessions
```sql
CREATE TABLE tutoring_sessions (
    id SERIAL PRIMARY KEY,
    content_generation_id INTEGER REFERENCES content_generations(id),
    student_id VARCHAR REFERENCES users(id) NOT NULL,
    session_type VARCHAR(50) NOT NULL,
    content_sources JSONB,
    learning_objective TEXT,
    teaching_style VARCHAR(50),
    session_duration INTEGER,
    messages JSONB,
    key_concepts_learned TEXT[],
    practice_questions_generated JSONB,
    student_engagement_score DECIMAL(3,2),
    follow_up_suggestions TEXT[]
);
```

### Doubt Resolution
```sql
CREATE TABLE doubt_submissions (
    id SERIAL PRIMARY KEY,
    content_generation_id INTEGER REFERENCES content_generations(id),
    student_id VARCHAR REFERENCES users(id) NOT NULL,
    resolver_id VARCHAR REFERENCES users(id),
    grade VARCHAR(10) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    subtopic VARCHAR(200),
    doubt_text TEXT NOT NULL,
    resolution_type VARCHAR(50) DEFAULT 'explanation',
    doubt_category VARCHAR(50),
    priority_level VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    resolution_text TEXT,
    quality_score DECIMAL(3,2),
    student_satisfaction_rating INTEGER,
    time_to_resolve INTEGER,
    ai_generated BOOLEAN DEFAULT FALSE,
    follow_up_questions TEXT[],
    related_doubts INTEGER[],
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);
```

### Practice Analysis
```sql
CREATE TABLE practice_sessions (
    id SERIAL PRIMARY KEY,
    content_generation_id INTEGER REFERENCES content_generations(id),
    student_id VARCHAR REFERENCES users(id) NOT NULL,
    practice_type VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    student_responses TEXT NOT NULL,
    ideal_answers TEXT NOT NULL,
    analysis_results JSONB,
    score_awarded INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    misconceptions_identified TEXT[],
    improvement_suggestions TEXT[],
    time_spent_minutes INTEGER,
    retry_count INTEGER DEFAULT 0,
    performance_trend VARCHAR(20)
);
```

## Usage Analytics & Tracking

### User Activity Logs
```sql
CREATE TABLE user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_details JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    processing_time_ms INTEGER
);
```

### Content Usage Statistics
```sql
CREATE TABLE content_usage_stats (
    id SERIAL PRIMARY KEY,
    content_generation_id INTEGER REFERENCES content_generations(id),
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    access_type VARCHAR(50) NOT NULL,
    access_timestamp TIMESTAMP DEFAULT NOW(),
    time_spent_seconds INTEGER,
    engagement_score DECIMAL(3,2),
    referrer_source VARCHAR(200)
);
```

### AI Usage Tracking
```sql
CREATE TABLE ai_usage_tracking (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    ai_service VARCHAR(50) NOT NULL,
    operation_type VARCHAR(100) NOT NULL,
    tokens_used INTEGER NOT NULL,
    cost_usd DECIMAL(10,6) NOT NULL,
    response_time_ms INTEGER,
    quality_rating DECIMAL(3,2),
    timestamp TIMESTAMP DEFAULT NOW()
);
```

## Educational Content Management

### Curriculum Standards
```sql
CREATE TABLE curriculum_standards (
    id SERIAL PRIMARY KEY,
    board VARCHAR(50) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    chapter VARCHAR(200),
    topic VARCHAR(200) NOT NULL,
    subtopic VARCHAR(200),
    learning_objectives TEXT[],
    difficulty_level VARCHAR(20),
    assessment_criteria TEXT[]
);
```

### Content Alignment Tracking
```sql
CREATE TABLE content_curriculum_alignment (
    id SERIAL PRIMARY KEY,
    content_generation_id INTEGER REFERENCES content_generations(id),
    curriculum_standard_id INTEGER REFERENCES curriculum_standards(id),
    alignment_score INTEGER CHECK (alignment_score BETWEEN 0 AND 100),
    aligned_concepts TEXT[],
    gaps_identified TEXT[],
    verified_by_teacher BOOLEAN DEFAULT FALSE
);
```

## Collaboration & Sharing

### Content Sharing
```sql
CREATE TABLE content_shares (
    id SERIAL PRIMARY KEY,
    content_generation_id INTEGER REFERENCES content_generations(id),
    shared_by VARCHAR REFERENCES users(id) NOT NULL,
    shared_with VARCHAR REFERENCES users(id) NOT NULL,
    share_type VARCHAR(50) DEFAULT 'view_only',
    shared_at TIMESTAMP DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE
);
```

### Content Feedback
```sql
CREATE TABLE content_feedback (
    id SERIAL PRIMARY KEY,
    content_generation_id INTEGER REFERENCES content_generations(id),
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    feedback_type VARCHAR(50) NOT NULL,
    feedback_text TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    is_helpful_vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Notifications & Communication

### Notification System
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_content_id INTEGER REFERENCES content_generations(id),
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    action_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);
```

## Implementation Strategy

### Phase 1: Core Foundation (Week 1-2)
- Enhanced users table with new fields
- content_generations master table
- Basic user activity logging
- User session tracking

### Phase 2: Content-Specific Tables (Week 3-4)
- generated_exams and exam_questions
- generated_lessons table
- doubt_submissions table
- tutoring_sessions table
- practice_sessions table

### Phase 3: Analytics Foundation (Week 5-6)
- user_activity_logs table
- content_usage_stats tracking
- user_performance_metrics
- ai_usage_tracking for cost management

### Phase 4: Educational Management (Week 7-8)
- curriculum_standards table
- content_curriculum_alignment tracking
- educational_resources table
- Content quality management

### Phase 5: Collaboration Features (Week 9-10)
- content_shares table
- workspaces for collaboration
- content_feedback system
- Team/class management

### Phase 6: Communication System (Week 11-12)
- notifications table
- communication_logs
- Automated notification triggers
- Communication templates

## Key Benefits

1. **Complete Audit Trail**: Every action logged with timestamps and user attribution
2. **Scalable Architecture**: JSON fields allow flexible schema evolution
3. **Role-Based Access**: Different content types for different user roles
4. **Usage Analytics**: Comprehensive tracking for business insights
5. **Cost Management**: AI usage tracking for cost optimization
6. **Quality Control**: Scoring and feedback systems for content quality
7. **Collaboration Features**: Sharing and workspace management
8. **Performance Monitoring**: Detailed metrics for user engagement

## Performance Considerations

### Indexing Strategy
- Primary indexes on all foreign keys
- Composite indexes for multi-column queries
- Partial indexes for status-based queries

### Optimization Tips
- Use JSON columns for flexible, non-queryable data
- Implement proper connection pooling
- Set up read replicas for analytics queries
- Use materialized views for complex aggregations
- Implement proper caching strategies

## Security & Compliance

- Encrypt sensitive fields (PII, assessment data)
- Row-level security for multi-tenant isolation
- GDPR compliance for EU users
- COPPA compliance for under-13 users
- Regular security audits

This database design provides a comprehensive foundation for tracking all user activities, content generation, and platform analytics while maintaining scalability and performance. 