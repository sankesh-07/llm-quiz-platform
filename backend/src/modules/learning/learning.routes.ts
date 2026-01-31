import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { QuizModel, QuestionType } from '../contests/contest.model';
import { generateQuizQuestions } from '../../services/llm.service';

const router = Router();

// Generate a Learning Mode quiz based on board/standard/subject/chapter
router.post('/quiz', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const {
      title,
      description,
      boardCode,
      standard,
      subject,
      chapter,
      difficulty,
      numQuestions,
      questionTypes,
      timerSeconds,
      startTime,
      endTime,
    } = req.body;

    // Only allow MCQ and NUMERIC question types; default to MCQ if none or invalid are provided
    const allowedTypes: QuestionType[] = ['MCQ', 'NUMERIC'];
    const sanitizedTypes = Array.isArray(questionTypes)
      ? (questionTypes.filter((t: string) => allowedTypes.includes(t as any)) as QuestionType[])
      : [];
    const effectiveQuestionTypes: QuestionType[] = sanitizedTypes.length > 0 ? sanitizedTypes : ['MCQ'];

    const questions = await generateQuizQuestions({
      boardCode,
      standard,
      subject,
      chapter,
      difficulty,
      numQuestions,
      questionTypes: effectiveQuestionTypes,
    });

    const quiz = await QuizModel.create({
      mode: 'LEARNING',
      studentId: req.user!.userId,
      title,
      description,
      boardCode,
      standard,
      subject,
      chapter,
      difficulty,
      numQuestions,
      timerSeconds,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      questions,
    });

    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
});

// List learning quizzes for current student
router.get('/quizzes', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const quizzes = await QuizModel.find({
      mode: 'LEARNING',
      studentId: req.user!.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(quizzes);
  } catch (err) {
    next(err);
  }
});

export default router;
