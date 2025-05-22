import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createAuthFromEnv } from './auth';
import { QuizScraper } from './scrape';
import { QuizAutoFiller } from './autoFill';

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .option('courseId', {
      type: 'string',
      description: 'The ID of the Canvas course',
      demandOption: true,
    })
    .option('quizId', {
      type: 'string',
      description: 'The ID of the quiz to take',
      demandOption: true,
    })
    .help()
    .alias('help', 'h')
    .parse();

  const auth = createAuthFromEnv();
  
  try {
    // Initialize and login
    await auth.initialize();
    await auth.login();

    const page = await auth.getPage();
    const scraper = new QuizScraper(page);
    const autoFiller = new QuizAutoFiller(page);

    // Navigate to quiz and extract questions
    await scraper.navigateToQuiz(argv.courseId, argv.quizId);
    const questions = await scraper.extractQuestions();

    console.log('Found questions:', questions.length);

    // Fill answers and submit
    await autoFiller.fillAnswers(questions);
    await autoFiller.submitQuiz();

    console.log('Quiz completed successfully!');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await auth.close();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 