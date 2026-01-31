import mongoose, { Document, Schema } from 'mongoose';

interface IChapter {
  name: string;
}

interface ISubject {
  name: string;
  chapters: IChapter[];
}

interface IStandard {
  grade: number;
  subjects: ISubject[];
}

export interface IBoard extends Document {
  name: string;
  code: string; // e.g., CBSE, ICSE, STATE_UP
  standards: IStandard[];
}

const ChapterSchema = new Schema<IChapter>({
  name: { type: String, required: true },
});

const SubjectSchema = new Schema<ISubject>({
  name: { type: String, required: true },
  chapters: { type: [ChapterSchema], default: [] },
});

const StandardSchema = new Schema<IStandard>({
  grade: { type: Number, required: true },
  subjects: { type: [SubjectSchema], default: [] },
});

const BoardSchema = new Schema<IBoard>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    standards: { type: [StandardSchema], default: [] },
  },
  { timestamps: true }
);

export const BoardModel = mongoose.model<IBoard>('Board', BoardSchema);
