import mongoose, { Document, Schema, Types } from 'mongoose';

interface IAnswer {
  questionIndex: number;
  selectedOptionIndex?: number;
  answerText?: string;
  isCorrect: boolean;
}

export interface ISubmission extends Document {
  quizId: Types.ObjectId;
  studentId: Types.ObjectId;
  contestId?: Types.ObjectId;
  score: number;
  totalQuestions: number;
  accuracy: number; // 0-100
  startedAt: Date;
  completedAt: Date;
  answers: IAnswer[];
}

const AnswerSchema = new Schema<IAnswer>({
  questionIndex: { type: Number, required: true },
  selectedOptionIndex: { type: Number },
  answerText: { type: String },
  isCorrect: { type: Boolean, required: true },
});

const SubmissionSchema = new Schema<ISubmission>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest' },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true },
    answers: { type: [AnswerSchema], default: [] },
  },
  { timestamps: true }
);

export const SubmissionModel = mongoose.model<ISubmission>('Submission', SubmissionSchema);
