
export type QuestionOption = {
  id: string;
  text: string;
};

export type QuestionType = {
  id: string;
  text: string;
  options: QuestionOption[];
  correctAnswerId: string;
  topic: string | null;
  subject?: string | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TestSeriesType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  subject: string | null;
  numberOfTests?: number | null;
  durationPerTest?: number | null;
  questions?: QuestionType[];
  data_ai_hint?: string | null;
  createdBy?: string | null;
  createdAt?: any; // Allow server timestamp
  updatedAt?: any; // Allow server timestamp
};

export type UserAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  isMarkedForReview: boolean;
  isAnswered: boolean;
  visited: boolean;
};

export type ExamPhase = 'instructions' | 'taking' | 'summary' | 'review' | 'loading' | 'error';

export type AdminOptionType = {
  id: string;
  text: string;
};

export type AdminQuestionType = {
  id: string;
  text: string;
  topic: string | null;
  subject: string | null;
  options: AdminOptionType[];
  correctAnswerId: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TestSeriesFullType = TestSeriesType & {
  questions?: AdminQuestionType[];
};
