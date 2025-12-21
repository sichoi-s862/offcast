import { IS_PUBLIC_KEY, Public } from './public.decorator';

/**
 * Public 데코레이터 테스트
 */
describe('Public Decorator', () => {
  it('IS_PUBLIC_KEY가 정의되어 있어야 함', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('Public 데코레이터가 정의되어 있어야 함', () => {
    expect(Public).toBeDefined();
    expect(typeof Public).toBe('function');
  });

  it('Public 데코레이터가 함수를 반환해야 함', () => {
    const decorator = Public();
    expect(typeof decorator).toBe('function');
  });

  it('메타데이터를 올바르게 설정해야 함', () => {
    // SetMetadata를 사용하므로 데코레이터를 클래스나 메서드에 적용하면
    // Reflect.getMetadata로 확인 가능
    class TestClass {
      @Public()
      testMethod() {
        return;
      }
    }

    // 데코레이터가 적용되면 IS_PUBLIC_KEY로 true 설정됨
    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass.prototype.testMethod);
    expect(metadata).toBe(true);
  });

  it('클래스에도 적용할 수 있어야 함', () => {
    @Public()
    class TestController {}

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestController);
    expect(metadata).toBe(true);
  });

  it('Public 데코레이터가 없는 메서드는 메타데이터가 undefined이어야 함', () => {
    class TestClass {
      nonPublicMethod() {
        return;
      }
    }

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass.prototype.nonPublicMethod);
    expect(metadata).toBeUndefined();
  });
});
