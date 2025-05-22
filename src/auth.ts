import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

interface AuthConfig {
  canvasUrl: string;
  username: string;
  password: string;
}

export class CanvasAuth {
  private browser: puppeteer.Browser | null = null;
  private page: puppeteer.Page | null = null;

  constructor(private config: AuthConfig) {}

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();
  }

  async login(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    try {
      // Navigate to the login page
      await this.page.goto(`${this.config.canvasUrl}/login`);

      // Wait for the login form
      await this.page.waitForSelector('input[name="pseudonym_session[unique_id]"]');

      // Fill in credentials
      await this.page.type('input[name="pseudonym_session[unique_id]"]', this.config.username);
      await this.page.type('input[name="pseudonym_session[password]"]', this.config.password);

      // Submit the form
      await Promise.all([
        this.page.waitForNavigation(),
        this.page.click('button[type="submit"]'),
      ]);

      // Verify login success
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('Login failed. Please check your credentials.');
      }
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPage(): Promise<puppeteer.Page> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }
    return this.page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

export function createAuthFromEnv(): CanvasAuth {
  const canvasUrl = process.env.CANVAS_URL;
  const username = process.env.CANVAS_USERNAME;
  const password = process.env.CANVAS_PASSWORD;

  if (!canvasUrl || !username || !password) {
    throw new Error(
      'Missing environment variables. Please set CANVAS_URL, CANVAS_USERNAME, and CANVAS_PASSWORD.',
    );
  }

  return new CanvasAuth({
    canvasUrl,
    username,
    password,
  });
} 