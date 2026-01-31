import { Router } from 'express';
import { Types } from 'mongoose';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { SubmissionModel } from '../submissions/submission.model';
import { ParentModel } from '../parents/parent.model';
import { ContestModel } from '../contests/contest.model';
import { UserModel } from '../users/user.model';

const router = Router();

// Map UI filter values to Quiz.mode in DB
const getQuizModeFilter = (modeParam?: string): 'CONTEST' | 'LEARNING' | undefined => {
  if (!modeParam) return undefined;
  if (modeParam === 'CONTEST') return 'CONTEST';
  if (modeParam === 'PRACTICE') return 'LEARNING';
  return undefined;
};

// Student summary analytics
router.get('/student/me/summary', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const quizMode = getQuizModeFilter(req.query.mode as string | undefined);

    const submissions = await SubmissionModel.find({
      studentId: new Types.ObjectId(req.user!.userId),
    }).populate('quizId');

    const filtered = submissions.filter((sub: any) => {
      if (!quizMode) return true;
      const quiz = sub.quizId as any;
      if (!quiz) return false;
      return quiz.mode === quizMode;
    });

    const totalQuizzes = filtered.length;
    const totalScore = filtered.reduce((sum, s) => sum + s.score, 0);
    const totalAccuracy = filtered.reduce((sum, s) => sum + s.accuracy, 0);

    const avgScore = totalQuizzes ? totalScore / totalQuizzes : 0;
    const avgAccuracy = totalQuizzes ? totalAccuracy / totalQuizzes : 0;

    res.json({ totalQuizzes, avgScore, avgAccuracy });
  } catch (err) {
    next(err);
  }
});

// Subject-wise analytics for logged-in student
router.get('/student/me/by-subject', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const quizMode = getQuizModeFilter(req.query.mode as string | undefined);

    const submissions = await SubmissionModel.find({ studentId: new Types.ObjectId(req.user!.userId) }).populate(
      'quizId'
    );

    const subjectStats: Record<string, { totalQuestions: number; correct: number }> = {};

    for (const sub of submissions) {
      const quiz: any = (sub as any).quizId;
      if (!quiz) continue;
      if (quizMode && quiz.mode !== quizMode) continue;

      // Ensure subject is tracked even if no answers
      if (quiz.subject) {
        if (!subjectStats[quiz.subject]) {
          subjectStats[quiz.subject] = { totalQuestions: 0, correct: 0 };
        }
      }

      sub.answers.forEach((ans) => {
        const q = quiz.questions[ans.questionIndex];
        if (!q) return;
        const subj = q.subject || quiz.subject || 'Unknown';
        if (!subjectStats[subj]) {
          subjectStats[subj] = { totalQuestions: 0, correct: 0 };
        }
        subjectStats[subj].totalQuestions += 1;
        if (ans.isCorrect) subjectStats[subj].correct += 1;
      });
    }

    const result = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      totalQuestions: stats.totalQuestions,
      correct: stats.correct,
      accuracy: stats.totalQuestions ? (stats.correct / stats.totalQuestions) * 100 : 0,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Chapter-wise analytics for logged-in student (optionally filter by subject)
router.get('/student/me/by-chapter', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const subjectFilter = (req.query.subject as string | undefined) || undefined;
    const quizMode = getQuizModeFilter(req.query.mode as string | undefined);

    const submissions = await SubmissionModel.find({ studentId: new Types.ObjectId(req.user!.userId) }).populate(
      'quizId'
    );

    const chapterStats: Record<string, { totalQuestions: number; correct: number; subject: string }> = {};

    for (const sub of submissions) {
      const quiz: any = (sub as any).quizId;
      if (!quiz) continue;
      if (quizMode && quiz.mode !== quizMode) continue;

      // Ensure chapter is tracked even if no answers
      if (quiz.subject && quiz.chapter) {
        if (subjectFilter && quiz.subject !== subjectFilter) {
          // skip if filter doesn't match
        } else {
          const key = `${quiz.subject}::${quiz.chapter}`;
          if (!chapterStats[key]) {
            chapterStats[key] = { totalQuestions: 0, correct: 0, subject: quiz.subject };
          }
        }
      }

      sub.answers.forEach((ans) => {
        const q = quiz.questions[ans.questionIndex];
        if (!q) return;
        const subj = q.subject || quiz.subject || 'Unknown';
        if (subjectFilter && subj !== subjectFilter) return;
        const chap = q.chapter || 'Unknown';
        const key = `${subj}::${chap}`;
        if (!chapterStats[key]) {
          chapterStats[key] = { totalQuestions: 0, correct: 0, subject: subj };
        }
        chapterStats[key].totalQuestions += 1;
        if (ans.isCorrect) chapterStats[key].correct += 1;
      });
    }

    const result = Object.entries(chapterStats).map(([key, stats]) => {
      const [, chapter] = key.split('::');
      return {
        subject: stats.subject,
        chapter,
        totalQuestions: stats.totalQuestions,
        correct: stats.correct,
        accuracy: stats.totalQuestions ? (stats.correct / stats.totalQuestions) * 100 : 0,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Contest-wise analytics for current student
router.get('/student/me/contests', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const user = await UserModel.findById(req.user!.userId);
    if (!user || !user.boardCode || !user.standard) {
      return res.json({ totalContests: 0, attemptedContests: 0, missedContests: 0, contests: [] });
    }

    const contests = await ContestModel.find({
      boardCode: user.boardCode,
      standard: user.standard,
    }).sort({ startTime: 1 });

    const submissions = await SubmissionModel.find({
      studentId: new Types.ObjectId(req.user!.userId),
      contestId: { $ne: null },
    });

    const submissionByContest = new Map<string, typeof submissions[number]>();
    for (const sub of submissions) {
      const key = sub.contestId ? sub.contestId.toString() : '';
      if (!key) continue;
      const existing = submissionByContest.get(key);
      // Keep the best accuracy per contest if multiple attempts exist
      if (!existing || sub.accuracy > existing.accuracy) {
        submissionByContest.set(key, sub);
      }
    }

    const contestEntries = contests.map((contest) => {
      const sub = submissionByContest.get(contest._id.toString()) || null;
      const attempted = !!sub;
      return {
        id: contest._id,
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        status: contest.status,
        attempted,
        score: sub ? sub.score : null,
        totalQuestions: sub ? sub.totalQuestions : contest.numQuestions,
        accuracy: sub ? sub.accuracy : null,
        completedAt: sub ? sub.completedAt : null,
      };
    });

    const totalContests = contestEntries.length;
    const attemptedContests = contestEntries.filter((c) => c.attempted).length;
    const missedContests = totalContests - attemptedContests;

    // Calculate averages from submissions (only for contests that were actually attempted)
    const attemptedSubmissions = submissions.filter(s => s.contestId);
    // Note: 'submissions' already filtered by contestId: { $ne: null } above, so it's safe to use directly, 
    // but let's double check if we need to filter by unique contest if multiple attempts were allowed (though typically contest is 1 attempt).
    // The previous logic used 'submissionByContest' map which picks the best attempt.

    let totalScore = 0;
    let totalAccuracy = 0;
    let count = 0;

    submissionByContest.forEach((sub) => {
      totalScore += sub.score;
      totalAccuracy += sub.accuracy;
      count++;
    });

    const avgScore = count > 0 ? totalScore / count : 0;
    const avgAccuracy = count > 0 ? totalAccuracy / count : 0;

    res.json({
      totalContests,
      attemptedContests,
      missedContests,
      avgScore,
      avgAccuracy,
      contests: contestEntries
    });
  } catch (err) {
    next(err);
  }
});

// Parent view of children and basic stats
router.get('/parent/me/children', requireAuth, requireRole(['parent']), async (req: AuthRequest, res, next) => {
  try {
    const parent = await ParentModel.findById(req.user!.userId).populate('children');
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const childrenWithStats = await Promise.all(
      parent.children.map(async (child: any) => {
        // 1. Get IDs of ALL completed contests for this student's board/standard
        const completedContests = await ContestModel.find({
          boardCode: child.boardCode,
          standard: child.standard,
          status: 'COMPLETED',
        }).select('_id');

        const completedContestIds = new Set(completedContests.map((c) => c._id.toString()));
        const contestCount = completedContests.length;

        // 2. Get all submissions
        const submissions = await SubmissionModel.find({ studentId: child._id });

        // 3. Filter submissions:
        //    - Keep if it's a practice quiz (contestId is null)
        //    - Keep if it's a contest submission AND the contest is COMPLETED
        const validSubmissions = submissions.filter((s) => {
          if (!s.contestId) return true; // Practice quiz
          return completedContestIds.has(s.contestId.toString());
        });

        // Deduplicate valid contest submissions (in case of historic multiple attempts)
        const uniqueContestIds = new Set<string>();
        let practiceAttempts = 0;

        validSubmissions.forEach((s) => {
          if (s.contestId) {
            uniqueContestIds.add(s.contestId.toString());
          } else {
            practiceAttempts++;
          }
        });

        const totalAppeared = uniqueContestIds.size + practiceAttempts;

        // Total Quizzes = All Available COMPLETED Contests + Practice Quizzes Taken
        const totalQuizzes = contestCount + practiceAttempts;

        const totalScore = validSubmissions.reduce((sum, s) => sum + s.score, 0);
        const totalAccuracy = validSubmissions.reduce((sum, s) => sum + s.accuracy, 0);
        const avgScore = totalAppeared ? totalScore / totalAppeared : 0;
        const avgAccuracy = totalAppeared ? totalAccuracy / totalAppeared : 0;
        return {
          id: child._id,
          name: child.name,
          email: child.email,
          boardCode: child.boardCode,
          standard: child.standard,
          totalQuizzes,
          totalAppeared,
          avgScore,
          avgAccuracy,
        };
      })
    );

    res.json({
      parent: {
        id: parent._id,
        parentId: parent.parentId,
        name: parent.name,
        email: parent.email,
      },
      children: childrenWithStats,
    });
  } catch (err) {
    next(err);
  }
});

// Detailed contest analytics for a specific child (Parent access)
router.get('/parent/child/:childId/contests', requireAuth, requireRole(['parent']), async (req: AuthRequest, res, next) => {
  try {
    const { childId } = req.params;
    const parentId = req.user!.userId;

    // Verify parent has access to this child
    const parent = await ParentModel.findById(parentId);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    const isChild = parent.children.some((c) => c.toString() === childId);
    if (!isChild) return res.status(403).json({ error: 'Not authorized for this student' });

    const student = await UserModel.findById(childId);
    if (!student || !student.boardCode || !student.standard) {
      return res.json({ contests: [] });
    }

    // 1. Get all contests relevant to the student
    const allContests = await ContestModel.find({
      boardCode: student.boardCode,
      standard: student.standard,
    }).sort({ startTime: -1 });

    // 2. Get student's submissions for these contests
    const submissions = await SubmissionModel.find({
      studentId: new Types.ObjectId(childId),
      contestId: { $ne: null },
    });

    // 3. Map submissions by contestId
    const subMap = new Map<string, typeof submissions[number]>();
    submissions.forEach((sub) => {
      const key = sub.contestId ? sub.contestId.toString() : '';
      if (!key) return;
      const existing = subMap.get(key);
      if (!existing || sub.accuracy > existing.accuracy) {
        subMap.set(key, sub);
      }
    });

    // 4. Combine into final result
    const results = allContests.map((contest) => {
      const sub = subMap.get(contest._id.toString());
      const attempted = !!sub;

      return {
        id: contest._id,
        title: contest.title,
        status: contest.status, // LIVE, COMPLETED, etc.
        userStatus: attempted ? 'Attempted' : 'Not Given',
        score: sub ? sub.score : null,
        totalQuestions: contest.numQuestions,
        accuracy: sub ? sub.accuracy : null,
        startTime: contest.startTime,
        endTime: contest.endTime,
        completedAt: sub ? sub.completedAt : null,
      };
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
