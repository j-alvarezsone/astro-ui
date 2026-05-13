import {
  mergeInterceptors,
  runOnRequestErrorInterceptors,
  runOnRequestInterceptors,
  runOnResponseErrorInterceptors,
  runOnResponseInterceptors,
} from '@utils/query/interceptors';
import type { QueryInterceptor, QueryLifecycleContext, QueryOptions } from '@utils/query/types';

describe('query interceptors', () => {
  const options: QueryOptions<string, Error> = {
    queryKey: ['test'],
    queryFn: async () => await Promise.resolve('ok'),
  };

  const context: QueryLifecycleContext<string, Error> = {
    queryKey: ['test'],
    keyHash: 'test',
    options,
    attempt: 1,
    client: false,
  };

  it('preserves global interceptor order before local interceptors', async () => {
    const order: string[] = [];
    const global: QueryInterceptor<unknown> = { onRequest: () => { order.push('global'); } };
    const local: QueryInterceptor<string, Error> = { onRequest: () => { order.push('local'); } };
    const interceptors = mergeInterceptors([global], [local]);

    await runOnRequestInterceptors(interceptors, context);

    expect(order).toEqual(['global', 'local']);
  });

  it('runs response interceptors in sequence', async () => {
    const order: string[] = [];
    const global: QueryInterceptor<unknown> = { onResponse: () => { order.push('global'); } };
    const local: QueryInterceptor<string, Error> = { onResponse: () => { order.push('local'); } };
    const interceptors = mergeInterceptors([global], [local]);

    await runOnResponseInterceptors(interceptors, context, 'data');

    expect(order).toEqual(['global', 'local']);
  });

  it('runs request error and response error interceptors properly', async () => {
    const order: string[] = [];
    const global: QueryInterceptor<unknown> = {
      onRequestError: () => { order.push('global-request-error'); },
      onResponseError: () => { order.push('global-response-error'); },
    };
    const local: QueryInterceptor<string, Error> = {
      onRequestError: () => { order.push('local-request-error'); },
      onResponseError: () => { order.push('local-response-error'); },
    };
    const interceptors = mergeInterceptors([global], [local]);

    await runOnRequestErrorInterceptors(interceptors, context, new Error('fail'));
    await runOnResponseErrorInterceptors(interceptors, context, new Error('fail'));

    expect(order).toEqual([
      'global-request-error',
      'local-request-error',
      'global-response-error',
      'local-response-error',
    ]);
  });
});
