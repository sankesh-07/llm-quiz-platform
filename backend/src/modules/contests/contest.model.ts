import mongoose, { Document, Schema, Types } from 'mongoose';

export type QuestionType = 'MCQ' | 'NUMERIC';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface IQuestion {
  prompt: string;
  type: QuestionType;
  options?: string[]; // for MCQ
  correctOptionIndex?: number; // for MCQ
  correctAnswerText?: string; // for numeric/short
  explanation?: string;
  subject?: string;
  chapter?: string;
}

export interface IQuiz extends Document {
  mode: 'CONTEST' | 'LEARNING';
  contestId?: Types.ObjectId;
  studentId?: Types.ObjectId;
  title?: string;
  description?: string;
  boardCode?: string;
  standard?: number;
  subject?: string;
  chapter?: string;
  difficulty: DifficultyLevel;
  numQuestions: number;
  timerSeconds: number;
  startTime?: Date;
  endTime?: Date;
  questions: IQuestion[];
}

export interface IContest extends Document {
  title: string;
  description?: string;
  boardCode?: string;
  standard?: number;
  subject?: string;
  chapter?: string;
  difficulty: DifficultyLevel;
  numQuestions: number;
  questionTypes: QuestionType[];
  timerSeconds: number;
  startTime: Date;
  endTime: Date;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  quizTemplateId?: Types.ObjectId; // master quiz template for this contest
}

const QuestionSchema = new Schema<IQuestion>({
  prompt: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'NUMERIC'], required: true },
  options: { type: [String], default: [] },
  correctOptionIndex: { type: Number },
  correctAnswerText: { type: String },
  explanation: { type: String },
  subject: { type: String },
  chapter: { type: String },
});

const QuizSchema = new Schema<IQuiz>(
  {
    mode: { type: String, enum: ['CONTEST', 'LEARNING'], required: true },
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest' },
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String },
    description: { type: String },
    boardCode: { type: String },
    standard: { type: Number },
    subject: { type: String },
    chapter: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    numQuestions: { type: Number, required: true },
    timerSeconds: { type: Number, required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    questions: { type: [QuestionSchema], default: [] },
  },
  { timestamps: true }
);

const ContestSchema = new Schema<IContest>(
  {
    title: { type: String, required: true },
    description: { type: String },
    boardCode: { type: String },
    standard: { type: Number },
    subject: { type: String },
    chapter: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    numQuestions: { type: Number, required: true },
    // Only MCQ and NUMERIC questions are allowed going forward
    questionTypes: { type: [String], enum: ['MCQ', 'NUMERIC'], default: ['MCQ'] },
    timerSeconds: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED'], default: 'DRAFT' },
    quizTemplateId: { type: Schema.Types.ObjectId, ref: 'Quiz' },
    // Flags to control when contest results and solutions are visible to participants
    resultsPublished: { type: Boolean, default: false } as any,
    solutionsPublished: { type: Boolean, default: false } as any,
  } as any,
  { timestamps: true }
);

export const QuizModel = mongoose.model<IQuiz>('Quiz', QuizSchema);
export const ContestModel = mongoose.model<IContest>('Contest', ContestSchema);
