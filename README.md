# Canvas Assistant Bot

An automated tool for answering Canvas LMS quizzes using browser automation. This project uses TypeScript and Puppeteer to interact with Canvas quizzes in a headless Chrome browser.

⚠️ **Disclaimer**: This tool is for educational purposes only. Using automated tools to complete quizzes may violate your institution's academic integrity policies. Use responsibly and ethically.

## Features

- Secure Canvas authentication
- Automated quiz navigation
- Support for multiple-choice questions
- Support for matching questions
- Headless browser automation
- TypeScript implementation

## Prerequisites

- Node.js (LTS version)
- npm or yarn
- Google Chrome browser

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/canvas-assistant-bot.git
   cd canvas-assistant-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   CANVAS_URL=your_canvas_instance_url
   CANVAS_USERNAME=your_username
   CANVAS_PASSWORD=your_password
   ```

## Usage

Run the bot with a specific course and quiz:

```bash
npm run start -- --courseId=<COURSE_ID> --quizId=<QUIZ_ID>
```

### Command Line Arguments

- `--courseId`: The ID of the Canvas course
- `--quizId`: The ID of the specific quiz
- `--help`: Display help information

## Development

1. Install development dependencies:
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Project Structure

```
canvas-assistant-bot/
├── src/
│   ├── auth.ts         # Authentication module
│   ├── scrape.ts       # Quiz scraping logic
│   ├── autoFill.ts     # Answer filling implementation
│   └── index.ts        # CLI entrypoint
├── tests/              # Test suite
├── .github/            # GitHub Actions workflows
└── package.json        # Project configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

- Never commit your `.env` file
- Use environment variables for sensitive information
- Keep your dependencies updated

## Roadmap

- [ ] Add support for more question types
- [ ] Implement answer validation
- [ ] Add progress tracking
- [ ] Improve error handling
- [ ] Add retry mechanisms 