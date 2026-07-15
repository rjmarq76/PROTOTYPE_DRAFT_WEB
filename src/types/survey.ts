export type SurveyType = 'Contractor' | 'Supplier' | 'Subcontractor';
export type Rating = number | 'N/A';

export interface PartnerCompany {
  id: string;
  name: string;
  type: SurveyType;
  affiliation?: string;
  createdAt: string;
}

export interface SurveyResponse {
  responseId: string;
  surveyType: SurveyType;
  respondentType: string;
  submissionDate: string;
  company: string;
  department?: string;
  address?: string;
  questionId: string;
  questionNumber: number;
  question: string;
  questionCategory: string;
  rating: Rating;
  comment: string;
  respondentEmail?: string;
}

export interface FilterState {
  surveyType: SurveyType[];
  questionId: string;
  rating: 'All' | Rating;
  company: string;
  search: string;
}

export interface QuestionDefinition {
  questionId: string;
  questionNumber: number;
  question: string;
  questionCategory: string;
  surveyTypes: SurveyType[];
}

export interface KpiSummary {
  overallSatisfactionScore: number;
  totalResponses: number;
  averageRating: number;
  naPercentage: number;
  highestRatedQuestion: string;
  lowestRatedQuestion: string;
  maxRating?: number;
}

export interface ResponseNotification {
  id: string;
  company: string;
  surveyType: SurveyType;
  respondentType: string;
  submissionDate: string;
  questionCount: number;
  respondentEmail?: string;
  department?: string;
  designation?: string;
}

export interface CustomForm {
  id: string;
  title: string;
  surveyType: SurveyType;
  description: string;
  createdAt: string;
  deadlineDate?: string;
  status?: 'Running' | 'Paused' | 'Completed' | 'Archived';
  maxRating?: number;
  questions: {
    questionId: string;
    questionNumber: number;
    question: string;
    questionCategory: string;
    inputType?: 'text' | 'rating' | 'typed-rating' | 'select' | 'checkbox' | 'date-range' | 'matrix';
    options?: string[];
    subQuestions?: { id: string; label: string; description?: string; validationRange?: { min: number; max: number; allowNa: boolean } }[];
    validationRange?: { min: number; max: number; allowNa: boolean };
    section?: string;
  }[];
}

