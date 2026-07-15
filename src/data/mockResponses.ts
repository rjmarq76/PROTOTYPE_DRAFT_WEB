import { Rating, SurveyResponse, SurveyType, CustomForm, PartnerCompany } from '../types/survey';

const respondentTypes = [
  'Rank & File',
  'Supervisory',
  'Managerial',
  'Director',
  'Executive'
];

const departments = [
  'Accounts Payable - Trade',
  'Business Solutions Manager',
  'Logistics',
  'Procurement Group',
  'TASS'
];

const positiveComments = [
  'Clear coordination and professional follow-through.',
  'The team was responsive and easy to work with.',
  'Process is improving and communication has been consistent.',
  'Good collaboration across the recent reporting period.',
  'Consistently meets or exceeds our service standards.'
];

const neutralComments = [
  'Generally acceptable, with a few items that need attention.',
  'Service was adequate but communication could be more proactive.',
  'No major issues, though status updates could be clearer.',
  'The process worked, but handoffs need more consistency.',
  'Satisfactory performance overall, minor improvements suggested.'
];

const negativeComments = [
  'Response times were slower than expected.',
  'Documentation gaps created avoidable follow-up work.',
  'Escalations need clearer ownership and faster closure.',
  'Several updates arrived late in the process.',
  'Quality of deliverables fell short in some critical areas.'
];

function seededRandom(seed: number) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function pick<T>(items: T[], seed: number): T {
  return items[Math.floor(seededRandom(seed) * items.length)];
}

function getMockRespondentEmail(rType: string, dept: string) {
  if (rType === 'Rank & File') return 'rankfile@mgenesis.com';
  if (rType === 'Supervisory') return 'supervisory@mgenesis.com';
  if (rType === 'Managerial') return 'managerial@mgenesis.com';
  if (rType === 'Director') return 'director@mgenesis.com';
  if (rType === 'Executive') return 'executive@mgenesis.com';
  return 'rankfile@mgenesis.com';
}

function generateCommentForRating(rating: Rating, max: number, seed: number) {
  if (rating === 'N/A') return 'Not applicable for this evaluation period.';
  const pct = (rating as number) / max;
  if (pct >= 0.75) return pick(positiveComments, seed);
  if (pct >= 0.4) return pick(neutralComments, seed);
  return pick(negativeComments, seed);
}

export function generateMockResponses(
  customSurveys?: CustomForm[],
  customCompanies?: PartnerCompany[]
): SurveyResponse[] {
  let surveysToUse: CustomForm[] = [];
  let companiesToUse: PartnerCompany[] = [];

  // Try to load from localStorage or arguments
  if (customSurveys && customSurveys.length > 0) {
    surveysToUse = customSurveys;
  } else {
    try {
      const saved = localStorage.getItem('survey_analytics_surveys_v5');
      if (saved) surveysToUse = JSON.parse(saved);
    } catch (_) {}
  }

  if (customCompanies && customCompanies.length > 0) {
    companiesToUse = customCompanies;
  } else {
    try {
      const saved = localStorage.getItem('survey_analytics_partner_companies_v5');
      if (saved) companiesToUse = JSON.parse(saved);
    } catch (_) {}
  }

  // Fallback if still empty
  if (surveysToUse.length === 0) {
    return [];
  }

  const rows: SurveyResponse[] = [];
  let submissionCounter = 0;

  // Let's generate mock evaluations
  surveysToUse.forEach((survey) => {
    // Filter companies matching this survey's type
    const matchingCompanies = companiesToUse.filter((c) => c.type === survey.surveyType);
    
    matchingCompanies.forEach((company, compIdx) => {
      // Create 2-3 evaluations per company, from different users (avoid duplicate user evaluations for same company)
      const mockUsers = [
        { rType: 'Rank & File', dept: 'Logistics', email: 'rankfile@mgenesis.com' },
        { rType: 'Supervisory', dept: 'Logistics', email: 'supervisory@mgenesis.com' },
        { rType: 'Managerial', dept: 'Procurement Group', email: 'managerial@mgenesis.com' }
      ];

      mockUsers.forEach((user, userIdx) => {
        submissionCounter++;
        const seedBase = submissionCounter * 123 + compIdx * 17 + userIdx * 31;
        const responseId = `RESP-MOCK-${submissionCounter}-${10000 + Math.floor(seededRandom(seedBase) * 90000)}`;
        
        // submission date: spread over the past 6 months
        const submissionDate = new Date();
        submissionDate.setDate(submissionDate.getDate() - Math.floor(seededRandom(seedBase + 5) * 180));
        const submissionDateStr = submissionDate.toISOString();

        // Ensure we answer EVERY single question in the survey
        survey.questions.forEach((q, qIdx) => {
          const qSeed = seedBase + qIdx * 53;
          
          if (q.inputType === 'matrix' && q.subQuestions) {
            // A matrix question produces responses for each of its sub-questions
            q.subQuestions.forEach((sub, subIdx) => {
              const subSeed = qSeed + subIdx * 11;
              const max = sub.validationRange?.max ?? 2;
              const min = sub.validationRange?.min ?? 0;
              
              // 10% chance of N/A, otherwise weighted high score
              const isNa = seededRandom(subSeed) < 0.10 && (sub.validationRange?.allowNa ?? true);
              const rating: Rating = isNa ? 'N/A' : Math.floor(min + seededRandom(subSeed + 2) * (max - min + 1));
              const comment = generateCommentForRating(rating, max || 2, subSeed + 3);

              rows.push({
                responseId,
                surveyType: survey.surveyType,
                respondentType: user.rType,
                submissionDate: submissionDateStr,
                company: company.name,
                department: user.dept,
                questionId: `${q.questionId}-${sub.id}`,
                questionNumber: q.questionNumber + (subIdx * 0.1),
                question: `${q.question} - ${sub.label}`,
                questionCategory: q.questionCategory,
                rating,
                comment,
                respondentEmail: user.email
              });
            });
          } else {
            // Normal question
            let rating: Rating = 'N/A';
            let comment = '';

            const max = q.validationRange?.max ?? 4;
            const min = q.validationRange?.min ?? 0;

            if (q.question === 'Period Covered' || q.inputType === 'select') {
              const options = q.options && q.options.length > 0 ? q.options : ['1st Half', '2nd Half', 'Annual'];
              comment = pick(options, qSeed);
              rating = 'N/A';
            } else if (q.inputType === 'checkbox') {
              const options = q.options && q.options.length > 0 ? q.options : ['System Delivery', 'Maintenance', 'Billing Support'];
              const count = 1 + Math.floor(seededRandom(qSeed) * Math.min(options.length, 3));
              const selected: string[] = [];
              for (let i = 0; i < count; i++) {
                const opt = pick(options, qSeed + i * 7);
                if (!selected.includes(opt)) selected.push(opt);
              }
              comment = selected.join(', ');
              rating = 'N/A';
            } else if (q.inputType === 'date-range') {
              comment = 'From: 01/01/2026 To: 30/06/2026';
              rating = 'N/A';
            } else if (q.inputType === 'text') {
              comment = pick(positiveComments.concat(neutralComments), qSeed);
              rating = 'N/A';
            } else if (q.inputType === 'typed-rating') {
              const isNa = seededRandom(qSeed) < 0.08 && (q.validationRange?.allowNa ?? true);
              rating = isNa ? 'N/A' : Math.floor(min + seededRandom(qSeed + 4) * (max - min + 1));
              comment = generateCommentForRating(rating, max, qSeed + 5);
            } else {
              // slider or default rating
              const isNa = seededRandom(qSeed) < 0.05;
              rating = isNa ? 'N/A' : Math.floor(min + seededRandom(qSeed + 6) * (max - min + 1));
              comment = generateCommentForRating(rating, max, qSeed + 7);
            }

            rows.push({
              responseId,
              surveyType: survey.surveyType,
              respondentType: user.rType,
              submissionDate: submissionDateStr,
              company: company.name,
              department: user.dept,
              questionId: q.questionId,
              questionNumber: q.questionNumber,
              question: q.question,
              questionCategory: q.questionCategory,
              rating,
              comment,
              respondentEmail: user.email
            });
          }
        });
      });
    });
  });

  return rows;
}

export function generateLiveSubmission(): SurveyResponse[] {
  // Simple fallback implementation matching the schema
  return [];
}

export function generateAllMockResponses(
  surveysToUse: CustomForm[],
  companiesToUse: PartnerCompany[],
  usersToUse: { rType: string; dept: string; email: string }[]
): SurveyResponse[] {
  const rows: SurveyResponse[] = [];
  let submissionCounter = 0;

  surveysToUse.forEach((survey) => {
    const matchingCompanies = companiesToUse.filter((c) => c.type === survey.surveyType);
    matchingCompanies.forEach((company, compIdx) => {
      usersToUse.forEach((user, userIdx) => {
        submissionCounter++;
        const seedBase = submissionCounter * 123 + compIdx * 17 + userIdx * 31;
        const responseId = `RESP-MOCK-${submissionCounter}-${10000 + Math.floor(seededRandom(seedBase) * 90000)}`;
        const submissionDate = new Date();
        submissionDate.setDate(submissionDate.getDate() - Math.floor(seededRandom(seedBase + 5) * 180));
        const submissionDateStr = submissionDate.toISOString();

        survey.questions.forEach((q, qIdx) => {
          const qSeed = seedBase + qIdx * 53;
          if (q.inputType === 'matrix' && q.subQuestions) {
            q.subQuestions.forEach((sub, subIdx) => {
              const subSeed = qSeed + subIdx * 11;
              const max = sub.validationRange?.max ?? 2;
              const min = sub.validationRange?.min ?? 0;
              const isNa = seededRandom(subSeed) < 0.10 && (sub.validationRange?.allowNa ?? true);
              const rating: Rating = isNa ? 'N/A' : Math.floor(min + seededRandom(subSeed + 2) * (max - min + 1));
              const comment = generateCommentForRating(rating, max || 2, subSeed + 3);

              rows.push({
                responseId,
                surveyType: survey.surveyType,
                respondentType: user.rType,
                submissionDate: submissionDateStr,
                company: company.name,
                department: user.dept,
                questionId: `${q.questionId}-${sub.id}`,
                questionNumber: q.questionNumber + (subIdx * 0.1),
                question: `${q.question} - ${sub.label}`,
                questionCategory: q.questionCategory,
                rating,
                comment,
                respondentEmail: user.email
              });
            });
          } else {
            let rating: Rating = 'N/A';
            let comment = '';
            const max = q.validationRange?.max ?? 4;
            const min = q.validationRange?.min ?? 0;

            if (q.question === 'Period Covered' || q.inputType === 'select') {
              const options = q.options && q.options.length > 0 ? q.options : ['1st Half', '2nd Half', 'Annual'];
              comment = pick(options, qSeed);
              rating = 'N/A';
            } else if (q.inputType === 'checkbox') {
              const options = q.options && q.options.length > 0 ? q.options : ['System Delivery', 'Maintenance', 'Billing Support'];
              const count = 1 + Math.floor(seededRandom(qSeed) * Math.min(options.length, 3));
              const selected: string[] = [];
              for (let i = 0; i < count; i++) {
                const opt = pick(options, qSeed + i * 7);
                if (!selected.includes(opt)) selected.push(opt);
              }
              comment = selected.join(', ');
              rating = 'N/A';
            } else if (q.inputType === 'date-range') {
              comment = 'From: 01/01/2026 To: 30/06/2026';
              rating = 'N/A';
            } else if (q.inputType === 'text') {
              comment = pick(positiveComments.concat(neutralComments), qSeed);
              rating = 'N/A';
            } else if (q.inputType === 'typed-rating') {
              const isNa = seededRandom(qSeed) < 0.08 && (q.validationRange?.allowNa ?? true);
              rating = isNa ? 'N/A' : Math.floor(min + seededRandom(qSeed + 4) * (max - min + 1));
              comment = generateCommentForRating(rating, max, qSeed + 5);
            } else {
              const isNa = seededRandom(qSeed) < 0.05;
              rating = isNa ? 'N/A' : Math.floor(min + seededRandom(qSeed + 6) * (max - min + 1));
              comment = generateCommentForRating(rating, max, qSeed + 7);
            }

            rows.push({
              responseId,
              surveyType: survey.surveyType,
              respondentType: user.rType,
              submissionDate: submissionDateStr,
              company: company.name,
              department: user.dept,
              questionId: q.questionId,
              questionNumber: q.questionNumber,
              question: q.question,
              questionCategory: q.questionCategory,
              rating,
              comment,
              respondentEmail: user.email
            });
          }
        });
      });
    });
  });

  return rows;
}

export function generateSingleMockResponse(
  surveysToUse: CustomForm[],
  companiesToUse: PartnerCompany[],
  usersToUse: { rType: string; dept: string; email: string }[]
): SurveyResponse[] {
  if (surveysToUse.length === 0 || companiesToUse.length === 0 || usersToUse.length === 0) {
    return [];
  }

  // Pick a random user
  const user = usersToUse[Math.floor(Math.random() * usersToUse.length)];

  // Pick a random survey
  const survey = surveysToUse[Math.floor(Math.random() * surveysToUse.length)];

  // Pick a random company of that survey's type
  const matchingCompanies = companiesToUse.filter((c) => c.type === survey.surveyType);
  if (matchingCompanies.length === 0) {
    return [];
  }
  const company = matchingCompanies[Math.floor(Math.random() * matchingCompanies.length)];

  const responseId = `RESP-SINGLE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const submissionDateStr = new Date().toISOString();

  const rows: SurveyResponse[] = [];
  const seedBase = Math.floor(Math.random() * 100000);

  survey.questions.forEach((q, qIdx) => {
    const qSeed = seedBase + qIdx * 53;

    if (q.inputType === 'matrix' && q.subQuestions) {
      q.subQuestions.forEach((sub, subIdx) => {
        const subSeed = qSeed + subIdx * 11;
        const max = sub.validationRange?.max ?? 2;
        const min = sub.validationRange?.min ?? 0;
        const isNa = Math.random() < 0.10 && (sub.validationRange?.allowNa ?? true);
        const rating: Rating = isNa ? 'N/A' : Math.floor(min + Math.random() * (max - min + 1));
        const comment = generateCommentForRating(rating, max || 2, subSeed + 3);

        rows.push({
          responseId,
          surveyType: survey.surveyType,
          respondentType: user.rType,
          submissionDate: submissionDateStr,
          company: company.name,
          department: user.dept,
          questionId: `${q.questionId}-${sub.id}`,
          questionNumber: q.questionNumber + (subIdx * 0.1),
          question: `${q.question} - ${sub.label}`,
          questionCategory: q.questionCategory,
          rating,
          comment,
          respondentEmail: user.email
        });
      });
    } else {
      let rating: Rating = 'N/A';
      let comment = '';
      const max = q.validationRange?.max ?? 4;
      const min = q.validationRange?.min ?? 0;

      if (q.question === 'Period Covered' || q.inputType === 'select') {
        const options = q.options && q.options.length > 0 ? q.options : ['1st Half', '2nd Half', 'Annual'];
        comment = options[Math.floor(Math.random() * options.length)];
        rating = 'N/A';
      } else if (q.inputType === 'checkbox') {
        const options = q.options && q.options.length > 0 ? q.options : ['System Delivery', 'Maintenance', 'Billing Support'];
        const count = 1 + Math.floor(Math.random() * Math.min(options.length, 3));
        const selected: string[] = [];
        for (let i = 0; i < count; i++) {
          const opt = options[Math.floor(Math.random() * options.length)];
          if (!selected.includes(opt)) selected.push(opt);
        }
        comment = selected.join(', ');
        rating = 'N/A';
      } else if (q.inputType === 'date-range') {
        comment = 'From: 01/01/2026 To: 30/06/2026';
        rating = 'N/A';
      } else if (q.inputType === 'text') {
        comment = pick(positiveComments.concat(neutralComments), qSeed);
        rating = 'N/A';
      } else if (q.inputType === 'typed-rating') {
        const isNa = Math.random() < 0.08 && (q.validationRange?.allowNa ?? true);
        rating = isNa ? 'N/A' : Math.floor(min + Math.random() * (max - min + 1));
        comment = generateCommentForRating(rating, max, qSeed + 5);
      } else {
        const isNa = Math.random() < 0.05;
        rating = isNa ? 'N/A' : Math.floor(min + Math.random() * (max - min + 1));
        comment = generateCommentForRating(rating, max, qSeed + 7);
      }

      rows.push({
        responseId,
        surveyType: survey.surveyType,
        respondentType: user.rType,
        submissionDate: submissionDateStr,
        company: company.name,
        department: user.dept,
        questionId: q.questionId,
        questionNumber: q.questionNumber,
        question: q.question,
        questionCategory: q.questionCategory,
        rating,
        comment,
        respondentEmail: user.email
      });
    }
  });

  return rows;
}
