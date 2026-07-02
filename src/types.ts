export interface VocabItem {
  id: string;
  word: string;
  meaning: string;
  distractor1?: string;
  distractor2?: string;
  distractor3?: string;
  incorrectCount: number;
}

export interface VocabDeck {
  id: string;
  name: string;
  vocabList: VocabItem[];
}

export type QuizMode = 'multipleChoice' | 'flashcard';

export type RangeMode = 'byNumber' | 'incorrectOnly';

export type ByNumberSubMode = 'range' | 'random';

export interface QuizAnswer {
  id: string;
  word: string;
  meaning: string;
  chosen: string;
  isCorrect: boolean;
  timeSpent: number;
}

export type OptionStatus = 'normal' | 'correct' | 'incorrect' | 'faded';

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  status: OptionStatus;
}

export type AppScreen = 'deckList' | 'setup' | 'quiz' | 'results';
