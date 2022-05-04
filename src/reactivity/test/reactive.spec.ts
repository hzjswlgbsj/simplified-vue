import { reactive } from '../reactive';

describe('effect', () => {
  it('happy path', () => {
    const original = {
      foo: 1
    }
    const observed = reactive(original) // original 被observed代理
    expect(observed).not.toBe(original) // observed肯定不等于original
    expect(observed.foo).toBe(1) // observed 拥有original的属性和值
  });
});