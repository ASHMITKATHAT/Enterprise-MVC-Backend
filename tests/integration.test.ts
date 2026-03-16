import request from 'supertest';
import app from '../src/index'; // Import the Express app
import mongoose from 'mongoose';
import { QueryModel } from '../src/models/QueryModel';
import { UserModel } from '../src/models/UserModel';

// Mock logger and errorHandler to prevent console output during tests
jest.mock('../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
jest.mock('../src/middlewares/errorHandler', () => ({
  errorHandler: jest.fn((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ message: err.message || 'Internal Server Error' });
  }),
}));

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Connect to a test database or mock mongoose
    // For simplicity, we'll use a real connection but clean up.
    // In a real project, consider 'mongodb-memory-server' for isolated tests.
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test_software_project_db';
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    // Clean up database after each test
    await QueryModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  it('GET /api/status should return healthy status', async () => {
    const res = await request(app).get('/api/status');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ healthy: true, engine: 'TypeScript Express AI Vector-Proxy' });
  });

  it('POST /api/analyze should return insights for a valid query', async () => {
    // First, register and login a user to get a token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', pwd: 'testpassword' });
    expect(registerRes.statusCode).toEqual(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', pwd: 'testpassword' });
    expect(loginRes.statusCode).toEqual(200);
    const token = loginRes.body.token;

    const payload = {
      query: 'Analyze system performance metrics for production server.',
      context: 'High CPU usage observed during peak hours.'
    };

    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.query).toEqual(payload.query);
    expect(res.body.insights).toBeDefined();
    expect(res.body.insights.confidence).toBeGreaterThanOrEqual(0.7);
    expect(res.body.insights.status).toEqual('COMPLETED');

    // Verify it was saved to the database
    const savedQuery = await QueryModel.findOne({ query: payload.query });
    expect(savedQuery).toBeDefined();
    expect(savedQuery?.insights?.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('POST /api/analyze should return 400 for an invalid query payload', async () => {
    // First, register and login a user to get a token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser2', email: 'test2@example.com', pwd: 'testpassword' });
    expect(registerRes.statusCode).toEqual(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test2@example.com', pwd: 'testpassword' });
    expect(loginRes.statusCode).toEqual(200);
    const token = loginRes.body.token;

    const invalidPayload = {
      query: 'short', // Too short
      context: 'This is a valid context.'
    };

    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidPayload);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Validation failed');
    expect(res.body.errors[0].path).toEqual('body.query');
  });

  it('POST /api/analyze should return 401 if no token is provided', async () => {
    const payload = {
      query: 'Analyze system performance metrics for production server.',
      context: 'High CPU usage observed during peak hours.'
    };

    const res = await request(app)
      .post('/api/analyze')
      .send(payload); // No Authorization header

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Authentication failed: No token provided.');
  });
});

// Updated on 2026-03-16 08:06:22
