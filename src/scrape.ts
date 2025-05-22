import puppeteer from 'puppeteer';

export interface Question {
  type: 'multiple_choice' | 'matching';
  text: string;
  options?: string[];
  matches?: {
    term: string;
    definition: string;
  }[];
}

export class QuizScraper {
  constructor(private page: puppeteer.Page) {}

  async navigateToQuiz(courseId: string, quizId: string): Promise<void> {
    const url = `/courses/${courseId}/quizzes/${quizId}/take`;
    await this.page.goto(url);
    await this.page.waitForSelector('.question');
  }

  async extractQuestions(): Promise<Question[]> {
    const questions: Question[] = [];
    const questionElements = await this.page.$$('.question');

    for (const element of questionElements) {
      const questionType = await this.getQuestionType(element);
      const questionText = await this.getQuestionText(element);

      if (questionType === 'multiple_choice') {
        const options = await this.getMultipleChoiceOptions(element);
        questions.push({
          type: 'multiple_choice',
          text: questionText,
          options,
        });
      } else if (questionType === 'matching') {
        const matches = await this.getMatchingPairs(element);
        questions.push({
          type: 'matching',
          text: questionText,
          matches,
        });
      }
    }

    return questions;
  }

  private async getQuestionType(element: puppeteer.ElementHandle): Promise<string> {
    const classList = await element.evaluate((el) => Array.from(el.classList));
    if (classList.includes('multiple_choice_question')) {
      return 'multiple_choice';
    } else if (classList.includes('matching_question')) {
      return 'matching';
    }
    throw new Error('Unsupported question type');
  }

  private async getQuestionText(element: puppeteer.ElementHandle): Promise<string> {
    const questionTextElement = await element.$('.question_text');
    if (!questionTextElement) {
      throw new Error('Question text not found');
    }
    return questionTextElement.evaluate((el) => el.textContent?.trim() || '');
  }

  private async getMultipleChoiceOptions(element: puppeteer.ElementHandle): Promise<string[]> {
    const optionElements = await element.$$('.answer');
    const options: string[] = [];

    for (const optionElement of optionElements) {
      const optionText = await optionElement.evaluate((el) => el.textContent?.trim() || '');
      options.push(optionText);
    }

    return options;
  }

  private async getMatchingPairs(element: puppeteer.ElementHandle): Promise<{ term: string; definition: string }[]> {
    const termElements = await element.$$('.matching_term');
    const definitionElements = await element.$$('.matching_definition');
    const matches: { term: string; definition: string }[] = [];

    for (let i = 0; i < termElements.length; i++) {
      const term = await termElements[i].evaluate((el) => el.textContent?.trim() || '');
      const definition = await definitionElements[i].evaluate((el) => el.textContent?.trim() || '');
      matches.push({ term, definition });
    }

    return matches;
  }
} 