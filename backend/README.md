# Offcast Backend API

크리에이터 익명 커뮤니티 앱 Offcast의 백엔드 API 서버입니다.

## 기술 스택

- **Framework**: NestJS 11
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: JWT (개발환경에서는 devLogin 지원)
- **Storage**: AWS S3 (이미지 업로드)
- **Documentation**: Swagger/OpenAPI

## 아키텍처 설계

### 모듈 구조

```
src/
├── auth/           # 인증 (OAuth, JWT, 개발용 로그인)
├── user/           # 사용자 관리
├── social/         # 소셜 계정 연동
├── channel/        # 채널 (구독자 수 기반 접근 제어)
├── post/           # 게시글 CRUD
├── comment/        # 댓글/답글 (2단계 깊이)
├── hashtag/        # 해시태그 검색
├── upload/         # S3 이미지 업로드
├── health/         # 헬스체크, 버전 관리
└── prisma/         # Prisma 서비스
```

### 데이터베이스 스키마

#### 핵심 테이블

- **User**: 사용자 기본 정보 (익명성 보장)
- **Account**: 소셜 계정 연동 (YouTube, TikTok 등)
- **Channel**: 구독자 수 기반 채널 (자유게시판, 10만 라운지 등)
- **Post**: 게시글 (soft delete, 카운터 캐싱)
- **Comment**: 댓글 (self-referencing으로 2단계 답글 지원)
- **Hashtag**: 해시태그 (usageCount 기반 인기 태그)

#### 인덱스 전략

```sql
-- 게시글 검색 최적화
@@index([channelId, status, deletedAt, createdAt(sort: Desc)])
@@index([authorId, deletedAt])

-- 해시태그 검색 최적화
@@index([name])  -- Full-text search 지원

-- 댓글 조회 최적화
@@index([postId, parentId, status, deletedAt, createdAt(sort: Desc)])
```

### 주요 설계 결정

1. **Soft Delete**: 데이터 복구 가능성 및 참조 무결성 유지
2. **Counter Caching**: viewCount, likeCount, commentCount 등 실시간 집계 부하 감소
3. **2단계 댓글**: 과도한 depth 방지로 UX 및 성능 최적화
4. **채널 접근 제어**: 구독자 수 범위(minSubscribers, maxSubscribers)로 유연한 권한 관리
5. **Presigned URL**: 대용량 이미지 직접 S3 업로드로 서버 부하 감소

## API 엔드포인트

### 인증 (Auth)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/auth/dev-login` | 개발용 테스트 로그인 |
| POST | `/auth/refresh` | JWT 토큰 갱신 |
| GET | `/auth/profile` | 현재 사용자 정보 |

### 채널 (Channel)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/channels` | 채널 목록 조회 |
| GET | `/channels/:id` | 채널 상세 조회 |
| GET | `/channels/accessible` | 접근 가능 채널 목록 |

### 게시글 (Post)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/posts` | 게시글 목록 (페이지네이션, 검색, 정렬) |
| GET | `/posts/:id` | 게시글 상세 |
| POST | `/posts` | 게시글 작성 |
| PATCH | `/posts/:id` | 게시글 수정 |
| DELETE | `/posts/:id` | 게시글 삭제 (soft delete) |
| POST | `/posts/:id/like` | 좋아요 토글 |

### 댓글 (Comment)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/comments/post/:postId` | 게시글 댓글 목록 |
| POST | `/comments` | 댓글/답글 작성 |
| PATCH | `/comments/:id` | 댓글 수정 |
| DELETE | `/comments/:id` | 댓글 삭제 |
| POST | `/comments/:id/like` | 좋아요 토글 |

### 해시태그 (Hashtag)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/hashtags/search` | 해시태그 검색 (자동완성) |
| GET | `/hashtags/popular` | 인기 해시태그 |
| GET | `/hashtags/trending` | 트렌딩 해시태그 |

### 이미지 업로드 (Upload)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/upload/image` | 단일 이미지 업로드 |
| POST | `/upload/images` | 다중 이미지 업로드 (최대 5개) |
| POST | `/upload/presigned-url` | Presigned URL 발급 |
| DELETE | `/upload/:key` | 이미지 삭제 |

### 헬스체크 (Health)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/health` | 서버 상태 (DB, 메모리, uptime) |
| GET | `/health/ping` | 간단한 liveness 체크 |
| GET | `/health/version` | 최신 앱 버전 정보 |
| GET | `/health/version/check` | 버전 호환성 확인 |

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
# .env 파일 생성
DATABASE_URL="postgresql://offcast:offcast123@localhost:5432/offcast?schema=public"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"

# AWS S3 (선택사항)
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET="your-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
CDN_URL=""  # CloudFront 사용 시
```

### 3. 데이터베이스 마이그레이션

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. 개발 서버 실행

```bash
npm run start:dev
```

### 5. API 문서 확인

서버 실행 후 `http://localhost:3000/api` 에서 Swagger 문서 확인

## 테스트

### 유닛 테스트 실행

```bash
npm test
```

### 테스트 커버리지

```bash
npm run test:cov
```

### 테스트 현황

```
Test Suites: 7 passed, 7 total
Tests:       96 passed, 96 total
```

테스트 대상:
- AuthService: OAuth 로그인, devLogin, 토큰 갱신
- ChannelService: 채널 조회, 접근 권한 확인
- PostService: CRUD, 좋아요, 조회수
- CommentService: 댓글/답글, 2단계 depth 제한
- HashtagService: 검색, 인기/트렌딩
- UploadService: MIME 타입 검증, 파일 크기 제한
- HealthService: 헬스체크, 버전 호환성

## 개발용 로그인

프로덕션 OAuth 연동 전 테스트를 위한 개발용 로그인 API:

```bash
curl -X POST http://localhost:3000/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "YOUTUBE",
    "nickname": "테스트유저",
    "subscriberCount": 150000
  }'
```

응답:
```json
{
  "user": {
    "id": "...",
    "nickname": "테스트유저",
    "accounts": [...]
  },
  "token": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "7d"
  }
}
```

## 확장 가능한 구조

향후 기능 추가를 위한 준비된 구조:

- **User.status**: ACTIVE, SUSPENDED, WITHDRAWN 상태 관리
- **User.deletedAt**: 회원 탈퇴 시 soft delete
- **AppVersion 테이블**: 강제 업데이트, 최소 버전 관리
- **ChannelAccess 테이블**: 특별 채널 접근 권한 (유료 기능 등)
- **Post/Comment.status**: 신고/관리자 숨김 처리

## 성능 최적화

### 쿼리 최적화

- 복합 인덱스로 빈번한 쿼리 패턴 최적화
- Counter caching으로 집계 쿼리 제거
- Cursor-based pagination 지원 (대용량 데이터)

### 이미지 업로드

- Presigned URL로 서버 bypass
- CDN 연동 지원 (CDN_URL 환경변수)
- MIME 타입/크기 서버사이드 검증

## 보안

- JWT 기반 인증 (7일 만료)
- 작성자 본인만 수정/삭제 가능
- Soft delete로 데이터 복구 가능
- 프로덕션에서 devLogin 자동 비활성화

## 라이선스

UNLICENSED - Private Project
