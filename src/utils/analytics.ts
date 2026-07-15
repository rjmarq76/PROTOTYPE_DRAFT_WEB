import { FilterState, KpiSummary, Rating, SurveyResponse, SurveyType } from '../types/survey';
import { getQuestionMaxPoints } from '../data/questionWeights';

export const initialFilters: FilterState = {
  surveyType: [],
  questionId: '',
  rating: 'All',
  company: '',
  search: '',
};

export function numericRating(rating: Rating): number | null {
  return rating === 'N/A' ? null : rating;
}

export type CompletionStatus = 'not-started' | 'in-progress' | 'completed' | 'no-companies';

export interface CompletionStyle {
  status: CompletionStatus;
  percentage: number;
  barColorClass: string;
  textColorClass: string;
}

/**
 * Determines the visual treatment for a company-evaluation completion percentage:
 * - red under 50%, orange 50-64%, yellow 65-74%, light green 75-89%, darker green 90-99%.
 * - "completed" when 100% (bar goes away, replaced with a "Completed" badge elsewhere).
 * - "not-started" when 0 (no bar at all, just a "Not Yet Started" label elsewhere).
 */
export function getCompletionStyle(completed: number, total: number): CompletionStyle {
  if (total <= 0) {
    return { status: 'no-companies', percentage: 0, barColorClass: 'bg-slate-300 dark:bg-slate-700', textColorClass: 'text-slate-400' };
  }

  const percentage = Math.round((completed / total) * 100);

  if (completed <= 0) {
    return { status: 'not-started', percentage: 0, barColorClass: 'bg-slate-300 dark:bg-slate-700', textColorClass: 'text-slate-400' };
  }

  if (completed >= total) {
    return { status: 'completed', percentage: 100, barColorClass: 'bg-emerald-600 dark:bg-emerald-500', textColorClass: 'text-emerald-600 dark:text-emerald-400' };
  }

  if (percentage < 50) {
    return { status: 'in-progress', percentage, barColorClass: 'bg-rose-500', textColorClass: 'text-rose-600 dark:text-rose-400' };
  }
  if (percentage < 65) {
    return { status: 'in-progress', percentage, barColorClass: 'bg-orange-500', textColorClass: 'text-orange-600 dark:text-orange-400' };
  }
  if (percentage < 75) {
    return { status: 'in-progress', percentage, barColorClass: 'bg-yellow-400', textColorClass: 'text-yellow-600 dark:text-yellow-400' };
  }
  if (percentage < 90) {
    return { status: 'in-progress', percentage, barColorClass: 'bg-green-400', textColorClass: 'text-green-600 dark:text-green-400' };
  }
  return { status: 'in-progress', percentage, barColorClass: 'bg-emerald-700 dark:bg-emerald-600', textColorClass: 'text-emerald-700 dark:text-emerald-400' };
}

export function formatNumber(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.0';
}

export function applyFilters(responses: SurveyResponse[], filters: FilterState) {
  const search = filters.search.trim().toLowerCase();

  return responses.filter((response) => {
    const matchesSurvey = filters.surveyType.length === 0 || filters.surveyType.includes(response.surveyType);
    const matchesQuestion = !filters.questionId || response.questionId === filters.questionId;
    const matchesRating = filters.rating === 'All' || response.rating === filters.rating;
    const matchesCompany = !filters.company || response.company === filters.company;
    const matchesSearch =
      !search ||
      [response.company, response.department, response.respondentType, response.question, response.comment, response.surveyType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));

    return matchesSurvey && matchesQuestion && matchesRating && matchesCompany && matchesSearch;
  });
}

export function averageRating(responses: SurveyResponse[]) {
  const values = responses.map((response) => numericRating(response.rating)).filter((rating): rating is number => rating !== null);
  return values.length ? values.reduce((sum, rating) => sum + rating, 0) / values.length : 0;
}

function averageByQuestion(responses: SurveyResponse[]) {
  const groups = new Map<string, SurveyResponse[]>();
  responses.forEach((response) => {
    groups.set(response.question, [...(groups.get(response.question) ?? []), response]);
  });

  return [...groups.entries()]
    .map(([question, questionResponses]) => {
      const validRatings = questionResponses
        .map((r) => numericRating(r.rating))
        .filter((rating): rating is number => rating !== null);

      if (validRatings.length === 0) {
        return null;
      }

      const average = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;

      return {
        question,
        average,
        responses: questionResponses.length,
      };
    })
    .filter((q): q is NonNullable<typeof q> => q !== null);
}

export function getMaxRatingForResponses(responses: SurveyResponse[]): number {
  if (responses.length === 0) return 4;
  let maxVal = 4;
  try {
    const saved = localStorage.getItem('survey_analytics_surveys_v5');
    if (saved) {
      const parsed = JSON.parse(saved);
      const questionIdSet = new Set(responses.map(r => r.questionId));
      for (const qId of questionIdSet) {
        const baseId = qId.split('-')[0];
        const found = parsed.find((s: any) =>
          s.questions?.some((q: any) => q.questionId === baseId || q.questionId === qId)
        );
        if (found && found.maxRating !== undefined) {
          if (found.maxRating > maxVal) {
            maxVal = found.maxRating;
          }
        }
      }
    }
  } catch (e) {}

  responses.forEach((resp) => {
    const r = numericRating(resp.rating);
    if (r !== null && r > maxVal) {
      maxVal = r;
    }
  });

  return maxVal;
}

export function getKpiSummary(responses: SurveyResponse[]): KpiSummary {
  const questionAverages = averageByQuestion(responses).filter((item) => item.responses > 0);
  const sorted = [...questionAverages].sort((left, right) => right.average - left.average);
  const naCount = responses.filter((response) => response.rating === 'N/A').length;
  const average = averageRating(responses);

  // Calculate normalized satisfaction percentage based on the survey's max rating
  let totalScoreRatio = 0;
  let countWithRatio = 0;
  let maxRatingDetected = 4;

  responses.forEach((resp) => {
    const r = numericRating(resp.rating);
    if (r !== null) {
      const maxOfThis = getQuestionMaxPoints(resp.surveyType, resp.questionId);
      if (maxOfThis > maxRatingDetected) {
        maxRatingDetected = maxOfThis;
      }
      totalScoreRatio += (r / maxOfThis);
      countWithRatio++;
    }
  });

  const satScore = countWithRatio > 0 ? (totalScoreRatio / countWithRatio) * 100 : 0;

  return {
    overallSatisfactionScore: satScore,
    totalResponses: responses.length,
    averageRating: average,
    naPercentage: responses.length ? (naCount / responses.length) * 100 : 0,
    highestRatedQuestion: sorted[0]?.question ?? 'No responses',
    lowestRatedQuestion: sorted[sorted.length - 1]?.question ?? 'No responses',
    maxRating: maxRatingDetected,
  };
}

export function ratingDistribution(responses: SurveyResponse[]) {
  const uniqueRatings = new Set<Rating>();
  responses.forEach((response) => {
    uniqueRatings.add(response.rating);
  });

  const list = [...uniqueRatings].sort((a, b) => {
    if (a === 'N/A') return 1;
    if (b === 'N/A') return -1;
    return (a as number) - (b as number);
  });

  if (list.length === 0) {
    return [0, 1, 2, 3, 4, 'N/A'].map((r) => ({
      rating: String(r),
      count: 0,
    }));
  }

  return list.map((rating) => ({
    rating: String(rating),
    count: responses.filter((response) => response.rating === rating).length,
  }));
}

export function averageBySurveyType(responses: SurveyResponse[], types: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor']) {
  return types.map((surveyType) => ({
    surveyType,
    average: Number(formatNumber(averageRating(responses.filter((response) => response.surveyType === surveyType)))),
    responses: responses.filter((response) => response.surveyType === surveyType).length,
  }));
}

export function monthlyTrend(responses: SurveyResponse[]) {
  const groups = new Map<string, SurveyResponse[]>();
  responses.forEach((response) => {
    const month = response.submissionDate.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), response]);
  });

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, monthResponses]) => ({
      month,
      average: Number(formatNumber(averageRating(monthResponses))),
      responses: monthResponses.length,
    }));
}

export function questionPerformance(responses: SurveyResponse[]) {
  return averageByQuestion(responses)
    .sort((left, right) => right.average - left.average)
    .map((item) => ({
      question: item.question.replace('How satisfied are you with ', '').replace('How would you rate ', ''),
      average: Number(formatNumber(item.average)),
      responses: item.responses,
    }));
}

export function responseVolume(responses: SurveyResponse[], types: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor']) {
  return types.map((surveyType) => ({
    surveyType,
    responses: responses.filter((response) => response.surveyType === surveyType).length,
  }));
}

export function categoryPerformance(responses: SurveyResponse[]) {
  const groups = new Map<string, SurveyResponse[]>();
  responses.forEach((response) => {
    groups.set(response.questionCategory, [...(groups.get(response.questionCategory) ?? []), response]);
  });

  return [...groups.entries()]
    .map(([category, categoryResponses]) => ({
      category,
      average: Number(formatNumber(averageRating(categoryResponses))),
      responses: categoryResponses.length,
      naCount: categoryResponses.filter((response) => response.rating === 'N/A').length,
    }))
    .sort((left, right) => right.average - left.average);
}

export function naFrequency(responses: SurveyResponse[]) {
  const groups = new Map<string, SurveyResponse[]>();
  responses.forEach((response) => {
    groups.set(response.questionCategory, [...(groups.get(response.questionCategory) ?? []), response]);
  });

  return [...groups.entries()].map(([category, categoryResponses]) => ({
    category,
    count: categoryResponses.filter((response) => response.rating === 'N/A').length,
  }));
}


