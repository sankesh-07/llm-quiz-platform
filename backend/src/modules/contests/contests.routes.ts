import { Router } from 'express';
import { ContestModel, QuizModel } from './contest.model';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { generateQuizQuestions } from '../../services/llm.service';
import { SubmissionModel } from '../submissions/submission.model';
import { UserModel } from '../users/user.model';

const router = Router();

const computeContestStatus = (contest: any): 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' => {
  const now = new Date();
  if (now < contest.startTime) return 'SCHEDULED';
  if (now >= contest.startTime && now <= contest.endTime) return 'LIVE';
  return 'COMPLETED';
};

// Create a contest (admin only)
router.post('/', requireAuth, requireRole(['admin']), async (req: AuthRequest, res, next) => {
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

    const contest = await ContestModel.create({
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
      status: 'SCHEDULED',
    });

    res.status(201).json(contest);
  } catch (err) {
    next(err);
  }
});

// List contests (optionally filter by status)
// Status is computed from startTime/endTime so that:
// - Before startTime => SCHEDULED
// - Between startTime and endTime => LIVE
// - After endTime => COMPLETED
router.get('/', async (req, res, next) => {
  try {
    const requestedStatus = req.query.status as 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | undefined;

    // Load all contests, then compute and persist their status based on time
    const contests = await ContestModel.find().sort({ startTime: 1 });

    const updatedContests = await Promise.all(
      contests.map(async (contest) => {
        const previousStatus = contest.status as 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED';
        const computedStatus = computeContestStatus(contest);

        let changed = false;

        if (computedStatus !== contest.status && contest.status !== 'DRAFT') {
          contest.status = computedStatus;
          changed = true;
        }

        // When status actually moves into COMPLETED, auto-publish results & solutions once
        if (previousStatus !== 'COMPLETED' && contest.status === 'COMPLETED') {
          if (!(contest as any).resultsPublished) {
            (contest as any).resultsPublished = true;
            changed = true;
          }
          if (!(contest as any).solutionsPublished) {
            (contest as any).solutionsPublished = true;
            changed = true;
          }
        }

        if (changed) {
          await contest.save();
        }

        return contest;
      })
    );

    const filtered = requestedStatus
      ? updatedContests.filter((contest) => contest.status === requestedStatus)
      : updatedContests;

    res.json(filtered);
  } catch (err) {
    next(err);
  }
});

// List contests visible to the current student (filtered by board & class)
router.get('/student', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const requestedStatus = req.query.status as 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | undefined;

    const user = await UserModel.findById(req.user!.userId);
    if (!user || !user.boardCode || !user.standard) {
      // If student's education info is incomplete, they see no contests
      return res.json([]);
    }

    const contests = await ContestModel.find({
      boardCode: user.boardCode,
      standard: user.standard,
    }).sort({ startTime: 1 });

    const updatedContests = await Promise.all(
      contests.map(async (contest) => {
        const previousStatus = contest.status as 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED';
        const computedStatus = computeContestStatus(contest);

        let changed = false;

        if (computedStatus !== contest.status && contest.status !== 'DRAFT') {
          contest.status = computedStatus;
          changed = true;
        }

        if (previousStatus !== 'COMPLETED' && contest.status === 'COMPLETED') {
          if (!(contest as any).resultsPublished) {
            (contest as any).resultsPublished = true;
            changed = true;
          }
          if (!(contest as any).solutionsPublished) {
            (contest as any).solutionsPublished = true;
            changed = true;
          }
        }

        if (changed) {
          await contest.save();
        }

        return contest;
      })
    );

    const filtered = requestedStatus
      ? updatedContests.filter((contest) => contest.status === requestedStatus)
      : updatedContests;

    const contestsWithAttempt = await Promise.all(
      filtered.map(async (contest) => {
        const attempted = await SubmissionModel.exists({
          contestId: contest._id,
          studentId: req.user!.userId,
        });
        return { ...contest.toObject(), attempted: !!attempted };
      })
    );

    res.json(contestsWithAttempt);
  } catch (err) {
    next(err);
  }
});

// Get contest by id (includes computed status)
router.get('/:id', async (req, res, next) => {
  try {
    const contest = await ContestModel.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const previousStatus = contest.status as 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED';
    const status = computeContestStatus(contest);

    let changed = false;

    if (status !== contest.status && contest.status !== 'DRAFT') {
      contest.status = status;
      changed = true;
    }

    if (previousStatus !== 'COMPLETED' && contest.status === 'COMPLETED') {
      if (!(contest as any).resultsPublished) {
        (contest as any).resultsPublished = true;
        changed = true;
      }
      if (!(contest as any).solutionsPublished) {
        (contest as any).solutionsPublished = true;
        changed = true;
      }
    }

    if (changed) {
      await contest.save();
    }

    res.json(contest);
  } catch (err) {
    next(err);
  }
});

// Admin can manually update contest status
router.patch('/:id/status', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const { status } = req.body as { status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' };
    const contest = await ContestModel.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const previousStatus = contest.status;
    contest.status = status;

    // If admin explicitly marks contest as COMPLETED, also publish results & solutions
    if (previousStatus !== 'COMPLETED' && status === 'COMPLETED') {
      if (!(contest as any).resultsPublished) {
        (contest as any).resultsPublished = true;
      }
      if (!(contest as any).solutionsPublished) {
        (contest as any).solutionsPublished = true;
      }
    }

    await contest.save();
    res.json(contest);
  } catch (err) {
    next(err);
  }
});

// Admin can update contest timing (startTime, endTime, timerSeconds)
router.patch('/:id/timing', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const { startTime, endTime, timerSeconds } = req.body as {
      startTime?: string;
      endTime?: string;
      timerSeconds?: number;
    };

    const contest = await ContestModel.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const previousStatus = contest.status as 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED';

    if (startTime) {
      contest.startTime = new Date(startTime);
    }
    if (endTime) {
      contest.endTime = new Date(endTime);
    }
    if (typeof timerSeconds === 'number' && !Number.isNaN(timerSeconds)) {
      contest.timerSeconds = timerSeconds;
    }

    // Recompute status based on the updated timing
    const computedStatus = computeContestStatus(contest);

    if (computedStatus !== contest.status && contest.status !== 'DRAFT') {
      contest.status = computedStatus;
    }

    // Keep results/solutions flags consistent with completed status:
    // - They should be true only when the contest is COMPLETED
    // - If we move out of COMPLETED due to timing edits, reset them to false
    if (previousStatus === 'COMPLETED' && contest.status !== 'COMPLETED') {
      (contest as any).resultsPublished = false;
      (contest as any).solutionsPublished = false;
    } else if (previousStatus !== 'COMPLETED' && contest.status === 'COMPLETED') {
      (contest as any).resultsPublished = true;
      (contest as any).solutionsPublished = true;
    }

    await contest.save();
    res.json(contest);
  } catch (err) {
    next(err);
  }
});

// Delete a contest and its related data (admin only)
router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const contest = await ContestModel.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    // Delete related quiz template(s)
    await QuizModel.deleteMany({ contestId: contest._id });

    // Delete related submissions
    await SubmissionModel.deleteMany({ contestId: contest._id });

    // Delete the contest itself
    await ContestModel.findByIdAndDelete(contest._id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Generate quiz template for a contest using the LLM (admin only)
router.post('/:id/generate-quiz-template', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const contest = await ContestModel.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const isPreview = req.body.preview === true;

    // If preview mode, generate 1.5x - 2x questions for selection pool
    // Min 5 extra, max 30 total to avoid timeouts
    const requestedCount = contest.numQuestions;
    const generateCount = isPreview
      ? Math.min(Math.max(requestedCount * 2, requestedCount + 5), 30)
      : requestedCount;

    const questions = await generateQuizQuestions({
      boardCode: contest.boardCode,
      standard: contest.standard,
      subject: contest.subject,
      chapter: contest.chapter,
      difficulty: contest.difficulty,
      numQuestions: generateCount,
      questionTypes: contest.questionTypes,
    });

    if (isPreview) {
      // Return questions directly without saving
      return res.json({ questions });
    }

    const quiz = await QuizModel.create({
      mode: 'CONTEST',
      contestId: contest._id,
      boardCode: contest.boardCode,
      standard: contest.standard,
      subject: contest.subject,
      chapter: contest.chapter,
      difficulty: contest.difficulty,
      numQuestions: contest.numQuestions,
      timerSeconds: contest.timerSeconds,
      questions,
    });

    contest.quizTemplateId = quiz._id;
    await contest.save();

    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
});

// Save selected questions as the final quiz template (admin only)
router.post('/:id/save-quiz-template', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const contest = await ContestModel.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const { questions } = req.body;
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid questions provided' });
    }

    // Explicitly validate question count matches requirements? 
    // User might want to change it slightly, but let's stick to the contest def for now or allow flexibility.
    // Strict check:
    if (questions.length !== contest.numQuestions) {
      // Warning or Error? Let's just update the contest numQuestions if it differs, 
      // or assume the frontend handles the enforcement.
      // Let's update the contest's numQuestions to match what was actually saved.
      contest.numQuestions = questions.length;
    }

    const quiz = await QuizModel.create({
      mode: 'CONTEST',
      contestId: contest._id,
      boardCode: contest.boardCode,
      standard: contest.standard,
      subject: contest.subject,
      chapter: contest.chapter,
      difficulty: contest.difficulty,
      numQuestions: questions.length,
      timerSeconds: contest.timerSeconds,
      questions,
    });

    contest.quizTemplateId = quiz._id;
    await contest.save();

    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
});

// Student fetches contest quiz if contest is LIVE, matches student's board/class, and template exists
router.get('/:id/quiz', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const contest = await ContestModel.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const student = await UserModel.findById(req.user!.userId);
    if (
      !student ||
      !student.boardCode ||
      !student.standard ||
      !contest.boardCode ||
      !contest.standard ||
      student.boardCode !== contest.boardCode ||
      student.standard !== contest.standard
    ) {
      return res.status(403).json({ error: 'Contest is not available for your class and board' });
    }

    // Check if already attempted
    const existingSubmission = await SubmissionModel.exists({
      contestId: contest._id,
      studentId: req.user!.userId,
    });
    if (existingSubmission) {
      return res.status(403).json({ error: 'You have already attempted this contest' });
    }

    const status = computeContestStatus(contest);
    if (status !== 'LIVE') {
      return res.status(400).json({ error: 'Contest is not live' });
    }
    if (!contest.quizTemplateId) {
      return res.status(400).json({ error: 'Quiz template not generated for this contest' });
    }
    const quiz = await QuizModel.findById(contest.quizTemplateId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz template not found' });
    }
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

// Leaderboard for a contest (basic)
router.get('/:id/leaderboard', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const contest = await ContestModel.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const submissions = await SubmissionModel.find({ contestId: contest._id })
      .populate('studentId', 'name email')
      .sort({ score: -1, completedAt: 1 })
      .limit(100);

    const leaderboard = submissions.map((sub, index) => ({
      rank: index + 1,
      studentId: (sub.studentId as any)._id,
      studentName: (sub.studentId as any).name,
      studentEmail: (sub.studentId as any).email,
      score: sub.score,
      accuracy: sub.accuracy,
      completedAt: sub.completedAt,
    }));

    res.json({ contestId: contest._id, leaderboard });
  } catch (err) {
    next(err);
  }
});

// Contest statistics for Overview (Admin only)
router.get('/:id/stats', requireAuth, requireRole(['admin']), async (req: AuthRequest, res, next) => {
  try {
    const contest = await ContestModel.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const submissions = await SubmissionModel.find({ contestId: contest._id })
      .populate('studentId', 'name email');

    const totalParticipants = submissions.length;

    if (totalParticipants === 0) {
      return res.json({
        totalParticipants: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        scoreDistribution: {
          '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
        },
        topPerformers: []
      });
    }

    const scores = submissions.map(s => s.score);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / totalParticipants;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Score Distribution
    const distribution = {
      '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
    };

    scores.forEach(score => {
      // Assuming score is percentage or scaled to 100? 
      // Need to check how scores are stored. Usually purely points.
      // Let's normalize if totalQuestions/points is known, or just map points if contest.numQuestions is the max.
      // Assuming naive percentage calculation validation: score / contest.numQuestions * 100?
      // Wait, 's.score' in Submission model usually is total points (number of correct answers).
      // Let's use percentage for distribution buckets.
      const percentage = (score / contest.numQuestions) * 100;

      if (percentage <= 20) distribution['0-20']++;
      else if (percentage <= 40) distribution['21-40']++;
      else if (percentage <= 60) distribution['41-60']++;
      else if (percentage <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    // Top 5 Performers
    // Sort by score desc, then time taken (implied by completedAt asc? or separate duration field?)
    // Using completedAt for tie breaker roughly implies earlier submission is better if simultaneous start, 
    // but accuracy is the main metric usually. Here score is primary.
    const sortedSubmissions = [...submissions].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.accuracy || 0) - (a.accuracy || 0); // secondary sort by accuracy
    });

    const topPerformers = sortedSubmissions.slice(0, 5).map(sub => ({
      name: (sub.studentId as any).name,
      email: (sub.studentId as any).email,
      score: sub.score,
      accuracy: sub.accuracy
    }));

    const allStudents = await UserModel.find({
      boardCode: contest.boardCode,
      standard: contest.standard,
      role: 'student',
    }).select('name email');

    const participantIds = new Set(submissions.map(s => (s.studentId as any)._id.toString()));

    const missedStudents = allStudents
      .filter(student => !participantIds.has(student._id.toString()))
      .map(s => ({ name: s.name, email: s.email }));

    res.json({
      totalStudents: allStudents.length,
      totalParticipants,
      missedStudents,
      averageScore,
      highestScore,
      lowestScore,
      scoreDistribution: distribution,
      topPerformers
    });
  } catch (err) {
    next(err);
  }
});

// Return contest quiz with solutions if published
router.get('/:id/solutions', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const contest = await ContestModel.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }
    if (!(contest as any).solutionsPublished) {
      return res.status(403).json({ error: 'Solutions not yet published for this contest' });
    }
    if (!contest.quizTemplateId) {
      return res.status(400).json({ error: 'Quiz template not generated for this contest' });
    }
    const quiz = await QuizModel.findById(contest.quizTemplateId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz template not found' });
    }
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

export default router;
