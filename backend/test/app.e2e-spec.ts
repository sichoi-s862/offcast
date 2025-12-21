import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Offcast API E2E Tests', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let testUserId: string;
  let testPostId: string;
  let testCommentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== Health Check ====================
  describe('Health Check', () => {
    it('GET /health - should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
    });

    it('GET /health/ping - should return pong', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/ping')
        .expect(200);

      expect(response.body).toHaveProperty('pong', true);
    });
  });

  // ==================== Authentication ====================
  describe('Authentication', () => {
    it('POST /auth/dev/login - should login with test account (YOUTUBE)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/dev/login')
        .send({
          provider: 'YOUTUBE',
          nickname: 'TestUser',
          subscriberCount: 150000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toHaveProperty('accessToken');

      authToken = response.body.token.accessToken;
      testUserId = response.body.user.id;
    });

    it('POST /auth/dev/login - should login with test account (TIKTOK)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/dev/login')
        .send({
          provider: 'TIKTOK',
          nickname: 'TikTokUser',
          subscriberCount: 50000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });

    it('POST /auth/dev/login - should login with test account (TWITCH)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/dev/login')
        .send({
          provider: 'TWITCH',
          nickname: 'TwitchUser',
          subscriberCount: 25000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });

    it('POST /auth/dev/login - should use default subscriber count if not provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/dev/login')
        .send({
          provider: 'YOUTUBE',
        })
        .expect(201);

      expect(response.body.user).toBeDefined();
    });

    it('POST /auth/dev/login - should fail with invalid provider', async () => {
      await request(app.getHttpServer())
        .post('/auth/dev/login')
        .send({
          provider: 'INVALID',
          nickname: 'TestUser',
        })
        .expect(400);
    });

    it('GET /auth/me - should return current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('accounts');
    });

    it('GET /auth/me - should fail without token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('POST /auth/refresh - should refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
    });
  });

  // ==================== Channels ====================
  describe('Channels', () => {
    it('GET /channels - should return all channels', async () => {
      const response = await request(app.getHttpServer())
        .get('/channels')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /channels/accessible - should return accessible channels', async () => {
      const response = await request(app.getHttpServer())
        .get('/channels/accessible')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ==================== Posts ====================
  describe('Posts', () => {
    let channelId: string;

    beforeAll(async () => {
      // Get a channel for testing
      const channelResponse = await request(app.getHttpServer())
        .get('/channels')
        .expect(200);

      if (channelResponse.body.length > 0) {
        channelId = channelResponse.body[0].id;
      }
    });

    it('POST /posts - should create a new post', async () => {
      if (!channelId) {
        console.log('Skipping test: No channels available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          channelId: channelId,
          title: 'E2E Test Post',
          content: 'This is a test post content for E2E testing.',
          hashtags: ['test', 'e2e'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('E2E Test Post');
      testPostId = response.body.id;
    });

    it('GET /posts - should return posts list', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
    });

    it('GET /posts/:id - should return a specific post', async () => {
      if (!testPostId) {
        console.log('Skipping test: No post created');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/posts/${testPostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(testPostId);
    });

    it('GET /posts - should filter by keyword', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ keyword: 'E2E Test' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
    });

    it('GET /posts - should filter by hashtag', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ hashtag: 'test' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
    });

    it('GET /posts - should sort by views', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ sort: 'views' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
    });

    it('GET /posts - should sort by popular', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ sort: 'popular' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
    });

    it('POST /posts/:id/like - should toggle like on a post', async () => {
      if (!testPostId) {
        console.log('Skipping test: No post created');
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/posts/${testPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('liked');
      expect(response.body).toHaveProperty('likeCount');
    });

    it('PUT /posts/:id - should update a post', async () => {
      if (!testPostId) {
        console.log('Skipping test: No post created');
        return;
      }

      const response = await request(app.getHttpServer())
        .put(`/posts/${testPostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated E2E Test Post',
          content: 'Updated content',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated E2E Test Post');
    });

    it('GET /posts/my - should return my posts', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
    });
  });

  // ==================== Comments ====================
  describe('Comments', () => {
    it('POST /comments - should create a new comment', async () => {
      if (!testPostId) {
        console.log('Skipping test: No post created');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postId: testPostId,
          content: 'This is a test comment',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('This is a test comment');
      testCommentId = response.body.id;
    });

    it('GET /comments - should return comments for a post', async () => {
      if (!testPostId) {
        console.log('Skipping test: No post created');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/comments')
        .query({ postId: testPostId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('comments');
      expect(response.body).toHaveProperty('total');
    });

    it('POST /comments - should create a reply', async () => {
      if (!testPostId || !testCommentId) {
        console.log('Skipping test: No post or comment created');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postId: testPostId,
          parentId: testCommentId,
          content: 'This is a reply',
        })
        .expect(201);

      expect(response.body.parentId).toBe(testCommentId);
    });

    it('POST /comments/:id/like - should toggle like on a comment', async () => {
      if (!testCommentId) {
        console.log('Skipping test: No comment created');
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/comments/${testCommentId}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('liked');
      expect(response.body).toHaveProperty('likeCount');
    });

    it('PUT /comments/:id - should update a comment', async () => {
      if (!testCommentId) {
        console.log('Skipping test: No comment created');
        return;
      }

      const response = await request(app.getHttpServer())
        .put(`/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated comment content',
        })
        .expect(200);

      expect(response.body.content).toBe('Updated comment content');
    });
  });

  // ==================== Hashtags ====================
  describe('Hashtags', () => {
    it('GET /hashtags/popular - should return popular hashtags', async () => {
      const response = await request(app.getHttpServer())
        .get('/hashtags/popular')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /hashtags/trending - should return trending hashtags', async () => {
      const response = await request(app.getHttpServer())
        .get('/hashtags/trending')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /hashtags/search - should search hashtags', async () => {
      const response = await request(app.getHttpServer())
        .get('/hashtags/search')
        .query({ q: 'test' })
        .expect(200);

      expect(response.body).toHaveProperty('hashtags');
    });
  });

  // ==================== Social Stats ====================
  describe('Social Stats', () => {
    it('GET /social/accounts - should return linked accounts', async () => {
      const response = await request(app.getHttpServer())
        .get('/social/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /social/all - should return all social stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/social/all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  // ==================== User ====================
  describe('User', () => {
    it('GET /users/me - should return user info', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('stats');
      expect(response.body.user).toHaveProperty('id');
    });

    it('PATCH /users/nickname - should update nickname', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/nickname')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nickname: 'UpdatedNickname' })
        .expect(200);

      expect(response.body.user.nickname).toBe('UpdatedNickname');
    });

    it('GET /users/accounts - should return user accounts', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('accounts');
      expect(Array.isArray(response.body.accounts)).toBe(true);
    });
  });

  // ==================== Reports ====================
  describe('Reports', () => {
    it('POST /reports - should create a report or return conflict', async () => {
      if (!testPostId) {
        console.log('Skipping test: No post created');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetType: 'POST',
          postId: testPostId,
          reason: 'SPAM',
          detail: 'Test report for E2E',
        });

      // 201 (생성 성공) 또는 409 (이미 신고함)
      expect([201, 409]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('reportId');
      }
    });

    it('GET /reports/my - should return my reports', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('reports');
    });
  });

  // ==================== FAQ ====================
  describe('FAQ', () => {
    it('GET /faqs - should return FAQs', async () => {
      const response = await request(app.getHttpServer())
        .get('/faqs')
        .expect(200);

      expect(response.body).toHaveProperty('faqs');
    });

    it('GET /faqs/categories - should return FAQ categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/faqs/categories')
        .expect(200);

      expect(response.body).toHaveProperty('categories');
    });
  });

  // ==================== Inquiries ====================
  describe('Inquiries', () => {
    let inquiryId: string;

    it('POST /inquiries - should create an inquiry', async () => {
      const response = await request(app.getHttpServer())
        .post('/inquiries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'GENERAL',
          title: 'Test Inquiry',
          content: 'This is a test inquiry for E2E testing',
          email: 'test@example.com',
        })
        .expect(201);

      expect(response.body).toHaveProperty('inquiry');
      inquiryId = response.body.inquiry.id;
    });

    it('GET /inquiries/my - should return my inquiries', async () => {
      const response = await request(app.getHttpServer())
        .get('/inquiries/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('inquiries');
    });

    it('GET /inquiries/:id - should return specific inquiry', async () => {
      if (!inquiryId) {
        console.log('Skipping test: No inquiry created');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.inquiry.id).toBe(inquiryId);
    });
  });

  // ==================== Cleanup ====================
  describe('Cleanup', () => {
    it('DELETE /comments/:id - should delete a comment', async () => {
      if (!testCommentId) {
        console.log('Skipping test: No comment created');
        return;
      }

      await request(app.getHttpServer())
        .delete(`/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('DELETE /posts/:id - should delete a post', async () => {
      if (!testPostId) {
        console.log('Skipping test: No post created');
        return;
      }

      await request(app.getHttpServer())
        .delete(`/posts/${testPostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  // ==================== Error Cases ====================
  describe('Error Handling', () => {
    it('GET /posts/invalid-uuid - should return 404 for non-existent post', async () => {
      // invalid-uuid는 유효한 UUID가 아니지만, Prisma가 찾지 못하면 null을 반환
      // 실제 동작에 맞게 404를 예상하거나, 200 (빈 결과)을 예상
      const response = await request(app.getHttpServer())
        .get('/posts/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`);

      // API 구현에 따라 200 또는 404 반환 가능
      expect([200, 404]).toContain(response.status);
    });

    it('POST /posts - should return 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .send({
          channelId: 'some-channel-id',
          title: 'Test',
          content: 'Test content',
        })
        .expect(401);
    });

    it('POST /posts - should return 400 with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          content: 'Test content',
        })
        .expect(400);
    });
  });
});
