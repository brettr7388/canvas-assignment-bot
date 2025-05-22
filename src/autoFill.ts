import puppeteer from 'puppeteer';
import { Question } from './scrape';

export class QuizAutoFiller {
  constructor(private page: puppeteer.Page) {}

  async fillAnswers(questions: Question[]): Promise<void> {
    for (const question of questions) {
      if (question.type === 'multiple_choice') {
        await this.fillMultipleChoice(question);
      } else if (question.type === 'matching') {
        await this.fillMatching(question);
      }
    }
  }

  private async fillMultipleChoice(question: Question): Promise<void> {
    if (!question.options || question.options.length === 0) {
      throw new Error('No options available for multiple choice question');
    }

    // Select the first option (placeholder for future logic)
    const firstOptionSelector = '.answer input[type="radio"]';
    const firstOption = await this.page.$(firstOptionSelector);
    
    if (!firstOption) {
      throw new Error('Could not find radio button for multiple choice question');
    }

    await firstOption.click();
  }

  private async fillMatching(question: Question): Promise<void> {
    if (!question.matches || question.matches.length === 0) {
      throw new Error('No matches available for matching question');
    }

    // For each term, drag it to its corresponding definition
    for (let i = 0; i < question.matches.length; i++) {
      const termSelector = `.matching_term:nth-child(${i + 1})`;
      const definitionSelector = `.matching_definition:nth-child(${i + 1})`;

      const term = await this.page.$(termSelector);
      const definition = await this.page.$(definitionSelector);

      if (!term || !definition) {
        throw new Error(`Could not find term or definition at index ${i}`);
      }

      // Get the positions of the term and definition
      const termBox = await term.boundingBox();
      const definitionBox = await definition.boundingBox();

      if (!termBox || !definitionBox) {
        throw new Error('Could not get positions of term or definition');
      }

      // Drag and drop
      await this.page.mouse.move(termBox.x + termBox.width / 2, termBox.y + termBox.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(definitionBox.x + definitionBox.width / 2, definitionBox.y + definitionBox.height / 2);
      await this.page.mouse.up();
    }
  }

  async submitQuiz(): Promise<void> {
    const submitButton = await this.page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error('Could not find submit button');
    }

    await submitButton.click();
    
    // Wait for confirmation dialog and confirm
    await this.page.waitForSelector('.quiz-submission-confirmation');
    const confirmButton = await this.page.$('.quiz-submission-confirmation button[type="submit"]');
    if (confirmButton) {
      await confirmButton.click();
    }
  }
} 