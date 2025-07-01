import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GeneratedDocument {
  content: string;
  metadata: any;
  timestamp: number;
  type: 'exam' | 'lesson';
}

interface DocumentState {
  generatedExam: GeneratedDocument | null;
  generatedLesson: GeneratedDocument | null;
  activeDocument: 'exam' | 'lesson' | null;
}

interface DocumentStateContextType {
  documentState: DocumentState;
  saveGeneratedExam: (content: string, metadata: any) => void;
  saveGeneratedLesson: (content: string, metadata: any) => void;
  clearGeneratedExam: () => void;
  clearGeneratedLesson: () => void;
  setActiveDocument: (type: 'exam' | 'lesson' | null) => void;
}

const DocumentStateContext = createContext<DocumentStateContextType | undefined>(undefined);

const STORAGE_KEYS = {
  EXAM: 'mira_generated_exam',
  LESSON: 'mira_generated_lesson',
  ACTIVE: 'mira_active_document'
};

export function DocumentStateProvider({ children }: { children: ReactNode }) {
  const [documentState, setDocumentState] = useState<DocumentState>({
    generatedExam: null,
    generatedLesson: null,
    activeDocument: null
  });

  // Load persisted state on mount
  useEffect(() => {
    try {
      const storedExam = sessionStorage.getItem(STORAGE_KEYS.EXAM);
      const storedLesson = sessionStorage.getItem(STORAGE_KEYS.LESSON);
      const storedActive = sessionStorage.getItem(STORAGE_KEYS.ACTIVE);

      setDocumentState({
        generatedExam: storedExam ? JSON.parse(storedExam) : null,
        generatedLesson: storedLesson ? JSON.parse(storedLesson) : null,
        activeDocument: storedActive as 'exam' | 'lesson' | null
      });
    } catch (error) {
      console.error('Error loading document state from storage:', error);
    }
  }, []);

  const saveGeneratedExam = (content: string, metadata: any) => {
    const examDocument: GeneratedDocument = {
      content,
      metadata,
      timestamp: Date.now(),
      type: 'exam'
    };

    setDocumentState(prev => ({ 
      ...prev, 
      generatedExam: examDocument,
      activeDocument: 'exam'
    }));

    try {
      sessionStorage.setItem(STORAGE_KEYS.EXAM, JSON.stringify(examDocument));
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE, 'exam');
    } catch (error) {
      console.error('Error saving exam to storage:', error);
    }
  };

  const saveGeneratedLesson = (content: string, metadata: any) => {
    const lessonDocument: GeneratedDocument = {
      content,
      metadata,
      timestamp: Date.now(),
      type: 'lesson'
    };

    setDocumentState(prev => ({ 
      ...prev, 
      generatedLesson: lessonDocument,
      activeDocument: 'lesson'
    }));

    try {
      sessionStorage.setItem(STORAGE_KEYS.LESSON, JSON.stringify(lessonDocument));
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE, 'lesson');
    } catch (error) {
      console.error('Error saving lesson to storage:', error);
    }
  };

  const clearGeneratedExam = () => {
    setDocumentState(prev => ({ 
      ...prev, 
      generatedExam: null,
      activeDocument: prev.activeDocument === 'exam' ? null : prev.activeDocument
    }));

    try {
      sessionStorage.removeItem(STORAGE_KEYS.EXAM);
      if (sessionStorage.getItem(STORAGE_KEYS.ACTIVE) === 'exam') {
        sessionStorage.removeItem(STORAGE_KEYS.ACTIVE);
      }
    } catch (error) {
      console.error('Error clearing exam from storage:', error);
    }
  };

  const clearGeneratedLesson = () => {
    setDocumentState(prev => ({ 
      ...prev, 
      generatedLesson: null,
      activeDocument: prev.activeDocument === 'lesson' ? null : prev.activeDocument
    }));

    try {
      sessionStorage.removeItem(STORAGE_KEYS.LESSON);
      if (sessionStorage.getItem(STORAGE_KEYS.ACTIVE) === 'lesson') {
        sessionStorage.removeItem(STORAGE_KEYS.ACTIVE);
      }
    } catch (error) {
      console.error('Error clearing lesson from storage:', error);
    }
  };

  const setActiveDocument = (type: 'exam' | 'lesson' | null) => {
    setDocumentState(prev => ({ ...prev, activeDocument: type }));
    
    try {
      if (type) {
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE, type);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.ACTIVE);
      }
    } catch (error) {
      console.error('Error setting active document:', error);
    }
  };

  return (
    <DocumentStateContext.Provider value={{
      documentState,
      saveGeneratedExam,
      saveGeneratedLesson,
      clearGeneratedExam,
      clearGeneratedLesson,
      setActiveDocument
    }}>
      {children}
    </DocumentStateContext.Provider>
  );
}

export function useDocumentState() {
  const context = useContext(DocumentStateContext);
  if (context === undefined) {
    throw new Error('useDocumentState must be used within a DocumentStateProvider');
  }
  return context;
}