import { DifficultyLevel, IQuestion, QuestionType } from '../modules/contests/contest.model';
import OpenAI from 'openai';

interface GenerateQuizParams {
  boardCode?: string;
  standard?: number;
  subject?: string;
  chapter?: string;
  difficulty: DifficultyLevel;
  numQuestions: number;
  questionTypes: QuestionType[];
}

// LLM configuration
// Preferred for Groq:
//   GROQ_API_KEY=...
//   GROQ_MODEL=llama-3.1-8b-instant (or another Groq model)
// Optionally override base URL via LLM_BASE_URL.
// Fallbacks for OpenAI are still supported.
const isGroq = !!process.env.GROQ_API_KEY;
const apiKey =
  process.env.GROQ_API_KEY ||
  process.env.OPENAI_API_KEY ||
  process.env.LLM_API_KEY;

const model =
  process.env.LLM_MODEL ||
  process.env.GROQ_MODEL ||
  process.env.OPENAI_MODEL ||
  (isGroq ? 'llama-3.1-8b-instant' : 'gpt-4.1-mini');

const baseURL =
  process.env.LLM_BASE_URL ||
  (isGroq ? 'https://api.groq.com/openai/v1' : undefined);

// Safe debug of LLM config (no secrets)
console.log('[LLM] init config', {
  provider: isGroq ? 'groq' : 'openai-or-other',
  hasApiKey: !!apiKey,
  model,
  baseURL,
});

const openai = apiKey
  ? new OpenAI({
      apiKey,
      // When using Groq, baseURL points to Groq's OpenAI-compatible endpoint
      ...(baseURL ? { baseURL } : {}),
    })
  : null;

export const isLlmConfigured = (): boolean => !!apiKey;

export const generateQuizQuestions = async (params: GenerateQuizParams): Promise<IQuestion[]> => {
  const {
    boardCode,
    standard,
    subject,
    chapter,
    difficulty,
    numQuestions,
    questionTypes,
  } = params;

  // Only MCQ and NUMERIC are allowed; fall back to MCQ for anything else
  const allowedTypes: QuestionType[] = ['MCQ', 'NUMERIC'];
  const qType: QuestionType =
    (questionTypes.find((t) => allowedTypes.includes(t)) as QuestionType | undefined) || 'MCQ';

  // If no API key is configured, fall back to deterministic stub questions
  if (!openai) {
    console.warn('[LLM] openai client is not configured, using stub questions');
    const questions: IQuestion[] = [];
    for (let i = 0; i < numQuestions; i += 1) {
      if (qType === 'MCQ') {
        questions.push({
          prompt: `Sample ${difficulty} question ${i + 1} for ${boardCode || 'board'} std ${
            standard || ''
          } ${subject || ''} ${chapter || ''}`.trim(),
          type: 'MCQ',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: 0,
          explanation:
            'This is a placeholder explanation. Configure GROQ_API_KEY (or OPENAI_API_KEY) to enable real LLM questions and solutions.',
          subject,
          chapter,
        });
      } else {
        questions.push({
          prompt: `Sample ${qType} ${difficulty} question ${i + 1} for ${subject || ''} ${
            chapter || ''
          }`.trim(),
          type: qType,
          correctAnswerText: '42',
          explanation:
            'Placeholder explanation. Configure GROQ_API_KEY (or OPENAI_API_KEY) to enable real LLM-generated reasoning.',
          subject,
          chapter,
        });
      }
    }
    return questions;
  }

  const system =
    'You are an educational quiz generator for school students (classes 1-12). ' +
    'Generate well-structured questions aligned to the specified education board, standard, subject, and chapter. ' +
    'Only two question types are allowed: MCQ (4 options) and NUMERIC (numeric answer as decimal/floating-point). ' +
    'For NUMERIC questions, answers must be pure numbers (no units, no words), with at most 5 digits total, optionally including a decimal point. ' +
    'Return JSON only, no prose, matching the given schema.';

  const typeDescription = qType === 'MCQ' ? 'multiple-choice' : 'numeric';

  const userPrompt = `Generate ${numQuestions} ${typeDescription} questions.
Board: ${boardCode || 'generic'}
Standard/Class: ${standard || 'N/A'}
Subject: ${subject || 'N/A'}
Chapter/Topic: ${chapter || 'N/A'}
Difficulty: ${difficulty}

All questions must be strictly about the given subject and chapter/topic; do not mix in other topics.

Return a JSON array called "questions" where each item has:
- "prompt": string (the question)
- "type": one of ["MCQ","NUMERIC"]
- "options": array of 4 strings (required for MCQ, omitted for NUMERIC)
- "correctOptionIndex": integer 0-3 (required for MCQ)
- "correctAnswerText": string (required for NUMERIC). It must be a pure number (only digits and at most one decimal point), with at most 5 digits total when decimal point is removed, and no units or words.
- "explanation": string (step-by-step explanation suitable for grade level)
- "subject": string
- "chapter": string`;

  try {
    const completion = await openai!.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      // Ask the model to return strict JSON so parsing is reliable
      response_format: { type: 'json_object' } as any,
    });

    const raw = completion.choices[0]?.message?.content || '{"questions": []}';

    let parsed: { questions: any[] };
    try {
      parsed = JSON.parse(raw) as { questions: any[] };
    } catch (parseErr) {
      console.error('[LLM] Failed to parse JSON from LLM response, raw content:', raw);
      throw parseErr;
    }

    const llmQuestions = parsed.questions || [];
    console.log('[LLM] received questions from provider:', llmQuestions.length, 'requested:', numQuestions);

    const questions: IQuestion[] = llmQuestions.slice(0, numQuestions).map((q, index) => ({
      prompt: q.prompt,
      type: q.type as QuestionType,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      correctAnswerText: q.correctAnswerText,
      explanation: q.explanation,
      subject: q.subject || subject,
      chapter: q.chapter || chapter,
    }));

    // If the LLM returned fewer questions than requested, top up with simple fallback questions
    if (questions.length < numQuestions) {
      const missing = numQuestions - questions.length;
      console.warn('[LLM] provider returned fewer questions than requested, topping up with', missing, 'stub questions');
      for (let i = questions.length; i < numQuestions; i += 1) {
        if (qType === 'MCQ') {
          questions.push({
            prompt: `Additional ${difficulty} question ${i + 1} for ${boardCode || 'board'} std ${
              standard || ''
            } ${subject || ''} ${chapter || ''}`.trim(),
            type: 'MCQ',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctOptionIndex: 0,
            explanation:
              'Fallback question added because the LLM returned fewer questions than requested.',
            subject,
            chapter,
          });
        } else {
          questions.push({
            prompt: `Additional ${qType} ${difficulty} question ${i + 1} for ${subject || ''} ${
              chapter || ''
            }`.trim(),
            type: qType,
            correctAnswerText: '42',
            explanation:
              'Fallback question added because the LLM returned fewer questions than requested.',
            subject,
            chapter,
          });
        }
      }
    }

    return questions;
  } catch (err) {
    console.error('LLM quiz generation failed, falling back to stub questions', err);
    const questions: IQuestion[] = [];
    for (let i = 0; i < numQuestions; i += 1) {
      if (qType === 'MCQ') {
        questions.push({
          prompt: `Fallback ${difficulty} question ${i + 1} for ${boardCode || 'board'} std ${
            standard || ''
          } ${subject || ''} ${chapter || ''}`.trim(),
          type: 'MCQ',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: 0,
          explanation:
            'Fallback explanation because the LLM call failed. Check API key and network, then retry.',
          subject,
          chapter,
        });
      } else {
        questions.push({
          prompt: `Fallback ${qType} ${difficulty} question ${i + 1} for ${subject || ''} ${
            chapter || ''
          }`.trim(),
          type: qType,
          correctAnswerText: '42',
          explanation:
            'Fallback explanation because the LLM call failed. Check API key and network, then retry.',
          subject,
          chapter,
        });
      }
    }
    return questions;
  }
};
