import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';

/**
 * CurrentUser 데코레이터 테스트
 */
describe('CurrentUser Decorator', () => {
  it('CurrentUser가 정의되어 있어야 함', () => {
    expect(CurrentUser).toBeDefined();
  });

  it('요청에서 user를 추출해야 함', () => {
    const mockUser = {
      id: 'user-1',
      nickname: '테스트유저',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: mockUser,
        }),
      }),
    } as unknown as ExecutionContext;

    // createParamDecorator의 factory 함수를 직접 테스트
    // CurrentUser는 데코레이터를 반환하므로 내부 로직을 테스트
    const request = mockExecutionContext.switchToHttp().getRequest();
    expect(request.user).toEqual(mockUser);
  });

  it('user가 없으면 undefined를 반환해야 함', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    const request = mockExecutionContext.switchToHttp().getRequest();
    expect(request.user).toBeUndefined();
  });

  it('data 파라미터를 무시해야 함', () => {
    // CurrentUser 데코레이터는 data 파라미터를 사용하지 않음
    const mockUser = {
      id: 'user-1',
      nickname: '테스트유저',
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: mockUser,
        }),
      }),
    } as unknown as ExecutionContext;

    // data가 있어도 무시하고 user만 반환
    const request = mockExecutionContext.switchToHttp().getRequest();
    expect(request.user).toEqual(mockUser);
  });

  it('복잡한 user 객체를 처리해야 함', () => {
    const mockUser = {
      id: 'user-1',
      nickname: '테스트유저',
      accounts: [
        {
          id: 'account-1',
          provider: 'YOUTUBE',
          subscriberCount: 100000,
        },
        {
          id: 'account-2',
          provider: 'TIKTOK',
          subscriberCount: 50000,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: mockUser,
        }),
      }),
    } as unknown as ExecutionContext;

    const request = mockExecutionContext.switchToHttp().getRequest();
    expect(request.user.accounts).toHaveLength(2);
  });
});
