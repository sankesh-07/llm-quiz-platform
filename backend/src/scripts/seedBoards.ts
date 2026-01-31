import dotenv from 'dotenv';
import { connectToDatabase } from '../config/db';
import { BoardModel } from '../modules/boards/board.model';

dotenv.config();

const createStandards = () => {
  const primarySubjects = [
    {
      name: 'English',
      chapters: [
        { name: 'Alphabets and Words' },
        { name: 'Reading and Comprehension' },
        { name: 'Grammar Basics' },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Numbers and Counting' },
        { name: 'Addition and Subtraction' },
        { name: 'Shapes and Measurements' },
      ],
    },
    {
      name: 'EVS',
      chapters: [
        { name: 'Myself and My Family' },
        { name: 'Plants and Animals' },
        { name: 'Our Surroundings' },
      ],
    },
  ];

  const middleSubjectsCommon = [
    {
      name: 'English',
      chapters: [
        { name: 'Prose and Poetry' },
        { name: 'Grammar and Composition' },
        { name: 'Reading Skills' },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Number Systems' },
        { name: 'Algebra Basics' },
        { name: 'Geometry Basics' },
      ],
    },
    {
      name: 'Science',
      chapters: [
        { name: 'Living Organisms' },
        { name: 'Matter and Materials' },
        { name: 'Force and Motion' },
      ],
    },
    {
      name: 'Social Science',
      chapters: [
        { name: 'History: Early Civilizations' },
        { name: 'Geography: Our Earth' },
        { name: 'Civics: Citizenship' },
      ],
    },
  ];

  const middleSubjectsGuj = [
    ...middleSubjectsCommon,
    {
      name: 'Gujarati',
      chapters: [
        { name: 'Gujarati Prose' },
        { name: 'Gujarati Poetry' },
        { name: 'Grammar Basics' },
      ],
    },
  ];

  const secondarySubjectsCommon = [
    {
      name: 'English',
      chapters: [
        { name: 'Prose' },
        { name: 'Poetry' },
        { name: 'Writing Skills' },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Algebra' },
        { name: 'Trigonometry' },
        { name: 'Geometry and Mensuration' },
      ],
    },
    {
      name: 'Science',
      chapters: [
        { name: 'Physics Basics' },
        { name: 'Chemistry Basics' },
        { name: 'Biology Basics' },
      ],
    },
    {
      name: 'Social Science',
      chapters: [
        { name: 'History: Modern India' },
        { name: 'Geography: Resources' },
        { name: 'Civics: Democracy' },
      ],
    },
  ];

  const secondarySubjectsGuj = [
    ...secondarySubjectsCommon,
    {
      name: 'Gujarati',
      chapters: [
        { name: 'Gujarati Prose' },
        { name: 'Gujarati Poetry' },
        { name: 'Grammar' },
      ],
    },
  ];

  const seniorScienceSubjects = [
    {
      name: 'Physics',
      chapters: [
        { name: 'Mechanics' },
        { name: 'Electricity and Magnetism' },
        { name: 'Waves and Optics' },
      ],
    },
    {
      name: 'Chemistry',
      chapters: [
        { name: 'Physical Chemistry' },
        { name: 'Organic Chemistry' },
        { name: 'Inorganic Chemistry' },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Algebra and Functions' },
        { name: 'Calculus' },
        { name: 'Coordinate Geometry' },
      ],
    },
    {
      name: 'Biology',
      chapters: [
        { name: 'Cell Biology' },
        { name: 'Genetics' },
        { name: 'Human Physiology' },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'Reading Comprehension' },
        { name: 'Writing Skills' },
        { name: 'Literature' },
      ],
    },
  ];

  const seniorScienceSubjectsGuj = [
    ...seniorScienceSubjects,
    {
      name: 'Gujarati',
      chapters: [
        { name: 'Gujarati Prose' },
        { name: 'Gujarati Poetry' },
        { name: 'Advanced Grammar' },
      ],
    },
  ];

  const cbseStandards = [] as any[];
  const gsebStandards = [] as any[];

  for (let grade = 1; grade <= 12; grade += 1) {
    if (grade <= 5) {
      cbseStandards.push({ grade, subjects: primarySubjects });
      gsebStandards.push({ grade, subjects: [...primarySubjects, {
        name: 'Gujarati',
        chapters: [
          { name: 'Alphabets and Words' },
          { name: 'Reading and Comprehension' },
          { name: 'Grammar Basics' },
        ],
      }] });
    } else if (grade <= 8) {
      cbseStandards.push({ grade, subjects: middleSubjectsCommon });
      gsebStandards.push({ grade, subjects: middleSubjectsGuj });
    } else if (grade <= 10) {
      cbseStandards.push({ grade, subjects: secondarySubjectsCommon });
      gsebStandards.push({ grade, subjects: secondarySubjectsGuj });
    } else {
      cbseStandards.push({ grade, subjects: seniorScienceSubjects });
      gsebStandards.push({ grade, subjects: seniorScienceSubjectsGuj });
    }
  }

  return { cbseStandards, gsebStandards };
};

export const seedBoards = async () => {
  await connectToDatabase();

  const { cbseStandards, gsebStandards } = createStandards();

  const boards = [
    {
      name: 'Central Board of Secondary Education',
      code: 'CBSE',
      standards: cbseStandards,
    },
    {
      name: 'Gujarat Secondary and Higher Secondary Education Board',
      code: 'GSEB',
      standards: gsebStandards,
    },
  ];

  for (const board of boards) {
    // upsert by code
    await BoardModel.findOneAndUpdate(
      { code: board.code },
      board,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Seeded board ${board.code}`);
  }

  console.log('Board seeding completed');
  process.exit(0);
};

if (require.main === module) {
  seedBoards().catch((err) => {
    console.error('Failed to seed boards', err);
    process.exit(1);
  });
}
