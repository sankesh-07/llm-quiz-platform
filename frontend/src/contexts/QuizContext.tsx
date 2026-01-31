import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Quiz } from '../services/learning.service';

interface QuizContextType {
  currentQuiz: Quiz | null;
  setCurrentQuiz: (quiz: Quiz | null) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);

  return (
    <QuizContext.Provider value={{ currentQuiz, setCurrentQuiz }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};


