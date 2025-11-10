import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/auth.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('rejects request without email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ password: 'test123' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    it('rejects request without password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
    });

    it('rejects invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'invalid-email', password: 'test123' });

      expect(response.status).toBe(400);
    });

    it('rejects passwords shorter than 6 characters', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: '12345' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/signin', () => {
    it('rejects request without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
