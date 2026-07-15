import { generateLiveSubmission, generateMockResponses } from '../data/mockResponses';
import { surveyQuestions } from '../data/questions';
import { QuestionDefinition, SurveyResponse, SurveyType } from '../types/survey';

export interface SurveyDataSource {
  getResponses(): Promise<SurveyResponse[]>;
  getSurveyTypes(): Promise<SurveyType[]>;
  getQuestions(): Promise<QuestionDefinition[]>;
  /** Optional: simulates a new respondent submitting the form, for live demo/notification purposes. */
  simulateNewSubmission?(): Promise<SurveyResponse[]>;
}

class MockSharePointService implements SurveyDataSource {
  private responses = generateMockResponses();

  async getResponses(): Promise<SurveyResponse[]> {
    return this.responses;
  }

  async getSurveyTypes(): Promise<SurveyType[]> {
    return ['Contractor', 'Supplier', 'Subcontractor'];
  }

  async getQuestions(): Promise<QuestionDefinition[]> {
    return surveyQuestions;
  }

  simulateNewSubmission = async (): Promise<SurveyResponse[]> => {
    const newRows = generateLiveSubmission();
    this.responses = [...this.responses, ...newRows];
    return newRows;
  };
}

class SharePointApiService implements SurveyDataSource {
  async getResponses(): Promise<SurveyResponse[]> {
    throw new Error('SharePoint API integration placeholder: implement Microsoft Graph or SharePoint REST calls here.');
  }

  async getSurveyTypes(): Promise<SurveyType[]> {
    throw new Error('SharePoint API integration placeholder: read distinct SurveyType values here.');
  }

  async getQuestions(): Promise<QuestionDefinition[]> {
    throw new Error('SharePoint API integration placeholder: read survey question metadata here.');
  }
}

export const sharePointService: SurveyDataSource =
  import.meta.env.VITE_DATA_SOURCE === 'sharepoint' ? new SharePointApiService() : new MockSharePointService();
