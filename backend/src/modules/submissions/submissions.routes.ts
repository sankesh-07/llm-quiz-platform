import { Router } from 'express';
import { Types } from 'mongoose';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { QuizModel } from '../contests/contest.model';
import { SubmissionModel } from './submission.model';
import { ParentModel } from '../parents/parent.model';

const router = Router();

// Submit answers for a quiz
router.post('/:quizId/submit', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body as {
      answers: Array<{ questionIndex: number; selectedOptionIndex?: number; answerText?: string }>;
    };

    const quiz = await QuizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const isValidNumeric = (value: string): boolean => {
      const trimmed = value.trim();
      // Only digits and at most one decimal point
      if (!/^\d*(?:\.\d*)?$/.test(trimmed)) return false;
      const digitsOnly = trimmed.replace(/\./g, '');
      // Must have between 1 and 5 digits total
      return digitsOnly.length > 0 && digitsOnly.length <= 5;
    };

    let correctCount = 0;
    const evaluatedAnswers = answers.map((ans) => {
      const q = quiz.questions[ans.questionIndex];
      if (!q) {
        return { ...ans, isCorrect: false };
      }
      let isCorrect = false;
      if (q.type === 'MCQ' && typeof ans.selectedOptionIndex === 'number') {
        isCorrect = ans.selectedOptionIndex === q.correctOptionIndex;
      } else if (q.type === 'NUMERIC' && typeof ans.answerText === 'string') {
        const correctRaw = (q.correctAnswerText || '').trim();
        const givenRaw = ans.answerText.trim();

        // Enforce numeric format and digit limit on both stored answer and student answer
        if (isValidNumeric(correctRaw) && isValidNumeric(givenRaw)) {
          const correctNum = parseFloat(correctRaw);
          const givenNum = parseFloat(givenRaw);
          isCorrect = Number.isFinite(correctNum) && Number.isFinite(givenNum) && correctNum === givenNum;
        } else {
          // If either side is invalid, treat as incorrect; the question should be fixed in authoring.
          isCorrect = false;
        }
      }
      if (isCorrect) correctCount += 1;
      return { ...ans, isCorrect };
    });

    const totalQuestions = quiz.questions.length;
    const score = correctCount;
    const accuracy = (correctCount / totalQuestions) * 100;

    const submission = await SubmissionModel.create({
      quizId: new Types.ObjectId(quizId),
      studentId: new Types.ObjectId(req.user!.userId),
      contestId: quiz.contestId,
      score,
      totalQuestions,
      accuracy,
      startedAt: new Date(), // In a real app track actual start
      completedAt: new Date(),
      answers: evaluatedAnswers,
    });

    res.status(201).json(submission);
  } catch (err) {
    next(err);
  }
});

// List submissions for the logged-in student
router.get('/me', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const submissions = await SubmissionModel.find({ studentId: new Types.ObjectId(req.user!.userId) })
      .sort({ createdAt: -1 })
      .populate('quizId', 'title mode subject chapter')
      .populate('contestId', 'title');

    // Flatten quiz & contest metadata so the frontend can show human-readable names
    const result = submissions.map((sub: any) => {
      const quiz = sub.quizId as any;
      const quizTitle = quiz && typeof quiz === 'object' ? quiz.title : null;
      const quizMode = quiz && typeof quiz === 'object' ? quiz.mode : null;
      const quizSubject = quiz && typeof quiz === 'object' ? quiz.subject : null;
      const quizChapter = quiz && typeof quiz === 'object' ? quiz.chapter : null;

      const contest = sub.contestId as any;
      const contestTitle = contest && typeof contest === 'object' ? contest.title : null;

      // quizId may be an ObjectId or a populated document; normalize to string _id
      let quizIdStr: string;
      if ((sub.quizId as any)?._id) {
        quizIdStr = (sub.quizId as any)._id.toString();
      } else if (sub.quizId instanceof Types.ObjectId) {
        quizIdStr = sub.quizId.toString();
      } else {
        quizIdStr = String(sub.quizId);
      }

      return {
        _id: sub._id,
        quizId: quizIdStr,
        studentId: sub.studentId,
        contestId: sub.contestId,
        score: sub.score,
        totalQuestions: sub.totalQuestions,
        accuracy: sub.accuracy,
        startedAt: sub.startedAt,
        completedAt: sub.completedAt,
        answers: sub.answers,
        quizTitle,
        quizMode,
        quizSubject,
        quizChapter,
        contestTitle,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get a single submission with quiz details for the logged-in student
router.get('/:id', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const submission = await SubmissionModel.findById(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.studentId.toString() !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized to view this submission' });
    }

    const quiz = await QuizModel.findById(submission.quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found for this submission' });
    }

    res.json({ submission, quiz });
  } catch (err) {
    next(err);
  }
});

// List submissions for a specific student (Parent access only)
router.get('/student/:studentId', requireAuth, requireRole(['parent']), async (req: AuthRequest, res, next) => {
  try {
    const { studentId } = req.params;
    const parentId = req.user!.userId;

    const parent = await ParentModel.findById(parentId);
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const isChild = parent.children.some((child) => child.toString() === studentId);
    if (!isChild) {
      return res.status(403).json({ error: 'Not authorized to view this student\'s submissions' });
    }

    const submissions = await SubmissionModel.find({ studentId: new Types.ObjectId(studentId) })
      .sort({ createdAt: -1 })
      .populate('quizId', 'title mode subject chapter')
      .populate('contestId', 'title');

    const result = submissions.map((sub: any) => {
      const quiz = sub.quizId as any;
      const quizTitle = quiz && typeof quiz === 'object' ? quiz.title : null;
      const quizMode = quiz && typeof quiz === 'object' ? quiz.mode : null;
      const quizSubject = quiz && typeof quiz === 'object' ? quiz.subject : null;
      const quizChapter = quiz && typeof quiz === 'object' ? quiz.chapter : null;
      const quizDifficulty = quiz && typeof quiz === 'object' ? quiz.difficulty : null;
      const contest = sub.contestId as any;
      const contestTitle = contest && typeof contest === 'object' ? contest.title : null;

      let quizIdStr: string;
      if ((sub.quizId as any)?._id) {
        quizIdStr = (sub.quizId as any)._id.toString();
      } else if (sub.quizId instanceof Types.ObjectId) {
        quizIdStr = sub.quizId.toString();
      } else {
        quizIdStr = String(sub.quizId);
      }

      return {
        _id: sub._id,
        quizId: quizIdStr,
        studentId: sub.studentId,
        contestId: sub.contestId,
        score: sub.score,
        totalQuestions: sub.totalQuestions,
        accuracy: sub.accuracy,
        startedAt: sub.startedAt,
        completedAt: sub.completedAt,
        answers: sub.answers,
        quizTitle,
        quizMode,
        quizSubject,
        quizChapter,
        quizDifficulty,
        contestTitle,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
