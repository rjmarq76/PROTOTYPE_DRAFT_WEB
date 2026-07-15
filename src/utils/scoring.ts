import { SurveyResponse, SurveyType } from '../types/survey';
import { numericRating } from './analytics';
import { ScoreBand, getBand, questionWeights, getCanonicalQuestionId } from '../data/questionWeights';

export interface SectionScore {
  section: string;
  earned: number;
  possible: number;
  percent: number; // 0-100, this is what charts should plot
  responses: number;
}

export interface CompanyComposite {
  company: string;
  surveyType: SurveyType;
  compositeScore: number; // 0-100, normalized so every survey type shares one axis
  band: ScoreBand;
  sections: SectionScore[];
  ratedQuestionCount: number; // individual question ratings counted (excludes N/A)
  evaluationCount: number; // distinct evaluation submissions rolled into this score
  stdDev: number; // population std dev of per-question percent scores - consistency signal
  naRate: number; // % of applicable questions marked N/A
}

export interface OutlierFlag {
  company: string;
  zScore: number;
  isLowOutlier: boolean;
}

function weightMap(surveyType: SurveyType) {
  const map = new Map<string, { section: string; maxPoints: number }>();
  questionWeights[surveyType].forEach((w) => map.set(w.questionId, w));
  return map;
}

function getMaxRatingForResponse(questionId: string): number {
  try {
    const saved = localStorage.getItem('survey_analytics_surveys_v5');
    if (saved) {
      const parsed = JSON.parse(saved);
      const baseId = questionId.split('-')[0];
      const found = parsed.find((s: any) =>
        s.questions?.some((q: any) => q.questionId === baseId || q.questionId === questionId)
      );
      if (found && found.maxRating !== undefined) {
        return found.maxRating;
      }
    }
  } catch (e) {}
  return 4; // fallback
}

/**
 * Rolls every response for one company + survey type into a single
 * weighted composite score, matching that form's actual section point
 * values instead of a flat average. Ratings arrive on their real point
 * scale as defined in questionWeights.ts, and are summed directly.
 */
export function computeCompanyComposite(
  company: string,
  surveyType: SurveyType,
  responses: SurveyResponse[],
): CompanyComposite | null {
  const weights = weightMap(surveyType);
  const companyResponses = responses.filter((r) => r.company === company && r.surveyType === surveyType);
  if (!companyResponses.length) return null;

  const sectionMap = new Map<string, { earned: number; possible: number; responses: number }>();
  const percentScores: number[] = [];
  let naCount = 0;
  let applicableCount = 0;

  companyResponses.forEach((response) => {
    const canonicalId = getCanonicalQuestionId(response.questionId);
    const weight = weights.get(canonicalId);
    if (!weight) return; // question isn't part of this form's scored rubric (e.g. free-text fields)
    applicableCount += 1;

    const value = numericRating(response.rating);
    if (value === null) {
      naCount += 1;
      return;
    }

    const earned = value;
    const maxPoints = weight.maxPoints;

    const bucket = sectionMap.get(weight.section) ?? { earned: 0, possible: 0, responses: 0 };
    bucket.earned += earned;
    bucket.possible += maxPoints;
    bucket.responses += 1;
    sectionMap.set(weight.section, bucket);

    const fraction = maxPoints > 0 ? earned / maxPoints : 0;
    percentScores.push(fraction * 100);
  });

  // Build the section list from the form's full rubric (questionWeights), not
  // just the sections that happen to have a rated answer in this slice of
  // responses. This guarantees every chart that reads `sections` (the radar
  // chart in particular) always has one entry per canonical section - so it
  // renders as a complete pentagon/shape instead of collapsing to a single
  // point when a company only has partial data (e.g. a single evaluation,
  // or a month-filtered trend slice that only touched one section).
  const canonicalSections: string[] = [];
  weights.forEach((w) => {
    if (!canonicalSections.includes(w.section)) canonicalSections.push(w.section);
  });

  const sections: SectionScore[] = canonicalSections.map((section) => {
    const v = sectionMap.get(section);
    if (!v) {
      return { section, earned: 0, possible: 0, percent: 0, responses: 0 };
    }
    return {
      section,
      earned: Number(v.earned.toFixed(1)),
      possible: v.possible,
      percent: v.possible ? Number(((v.earned / v.possible) * 100).toFixed(1)) : 0,
      responses: v.responses,
    };
  });

  const totalEarned = sections.reduce((sum, s) => sum + s.earned, 0);
  const totalPossible = sections.reduce((sum, s) => sum + s.possible, 0);
  const compositeScore = totalPossible ? Number(((totalEarned / totalPossible) * 100).toFixed(1)) : 0;

  const mean = percentScores.length ? percentScores.reduce((a, b) => a + b, 0) / percentScores.length : 0;
  const variance = percentScores.length
    ? percentScores.reduce((sum, v) => sum + (v - mean) ** 2, 0) / percentScores.length
    : 0;

  return {
    company,
    surveyType,
    compositeScore,
    band: getBand(surveyType, compositeScore),
    sections,
    ratedQuestionCount: percentScores.length,
    evaluationCount: new Set(companyResponses.map((r) => `${r.submissionDate.slice(0, 10)}|${r.respondentEmail ?? ''}`)).size,
    stdDev: Number(Math.sqrt(variance).toFixed(1)),
    naRate: applicableCount ? Number(((naCount / applicableCount) * 100).toFixed(1)) : 0,
  };
}

/** Every company of a given survey type, ranked highest composite score first. */
export function getLeaderboard(responses: SurveyResponse[], surveyType: SurveyType): CompanyComposite[] {
  const companies = [...new Set(responses.filter((r) => r.surveyType === surveyType).map((r) => r.company))];
  return companies
    .map((company) => computeCompanyComposite(company, surveyType, responses))
    .filter((c): c is CompanyComposite => c !== null)
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

/**
 * Flags companies sitting meaningfully below their own peer group (same
 * survey type only - couriers are only compared against couriers, etc.)
 * rather than a single global threshold, since the three forms don't share
 * a baseline difficulty.
 */
export function getOutliers(leaderboard: CompanyComposite[], threshold = 1.5): OutlierFlag[] {
  if (leaderboard.length < 3) return [];
  const scores = leaderboard.map((c) => c.compositeScore);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, v) => sum + (v - mean) ** 2, 0) / scores.length;
  const sd = Math.sqrt(variance);
  if (sd === 0) return leaderboard.map((c) => ({ company: c.company, zScore: 0, isLowOutlier: false }));

  return leaderboard.map((c) => {
    const zScore = Number(((c.compositeScore - mean) / sd).toFixed(2));
    return { company: c.company, zScore, isLowOutlier: zScore <= -threshold };
  });
}

/** Section-by-section average across every company of a survey type, for radar peer comparison. */
export function getSectionPeerAverages(responses: SurveyResponse[], surveyType: SurveyType) {
  const leaderboard = getLeaderboard(responses, surveyType);
  const sectionTotals = new Map<string, { sum: number; count: number }>();

  leaderboard.forEach((composite) => {
    composite.sections.forEach((s) => {
      if (s.responses === 0) return; // no rated data for this section yet - don't let it skew the peer average
      const bucket = sectionTotals.get(s.section) ?? { sum: 0, count: 0 };
      bucket.sum += s.percent;
      bucket.count += 1;
      sectionTotals.set(s.section, bucket);
    });
  });

  return [...sectionTotals.entries()].map(([section, v]) => ({
    section,
    average: Number((v.sum / v.count).toFixed(1)),
  }));
}

/** One company's composite score by month, so a partner's trajectory can be read over time. */
export function getCompanyTrend(responses: SurveyResponse[], company: string, surveyType: SurveyType) {
  const filtered = responses.filter((r) => r.company === company && r.surveyType === surveyType);
  const months = [...new Set(filtered.map((r) => r.submissionDate.slice(0, 7)))].sort();

  return months.map((month) => {
    const monthResponses = filtered.filter((r) => r.submissionDate.slice(0, 7) === month);
    const composite = computeCompanyComposite(company, surveyType, monthResponses);
    return { month, score: composite?.compositeScore ?? 0, responses: monthResponses.length };
  });
}
