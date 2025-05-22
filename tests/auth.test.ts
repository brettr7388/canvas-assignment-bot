import { CanvasAuth } from '../src/auth';

describe('CanvasAuth', () => {
  let auth: CanvasAuth;

  beforeAll(() => {
    // Set up test environment variables
    process.env.CANVAS_URL = 'https://canvas.test';
    process.env.CANVAS_USERNAME = 'testuser';
    process.env.CANVAS_PASSWORD = 'testpass';
  });

  beforeEach(() => {
    auth = new CanvasAuth({
      canvasUrl: process.env.CANVAS_URL!,
      username: process.env.CANVAS_USERNAME!,
      password: process.env.CANVAS_PASSWORD!,
    });
  });

  afterEach(async () => {
    await auth.close();
  });

  it('should initialize browser', async () => {
    await expect(auth.initialize()).resolves.not.toThrow();
  });

  it('should throw error when getting page before initialization', async () => {
    await expect(auth.getPage()).rejects.toThrow('Browser not initialized');
  });

  it('should throw error when logging in before initialization', async () => {
    await expect(auth.login()).rejects.toThrow('Browser not initialized');
  });
}); 