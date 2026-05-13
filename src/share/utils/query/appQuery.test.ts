import { useClientQuery, useServerQuery } from '@utils/query/appQuery';

describe('query app wrapper', () => {
  it('returns client and server query controllers from shared wrapper functions', async () => {
    const clientFn = vi.fn(async () => await Promise.resolve('client-ok'));
    const serverFn = vi.fn(async () => await Promise.resolve('server-ok'));

    const client = useClientQuery({
      queryKey: ['app-client'],
      queryFn: clientFn,
      autoExecute: false,
    });

    const server = useServerQuery({
      queryKey: ['app-server'],
      queryFn: serverFn,
      autoExecute: false,
    });

    const clientResult = await client.execute();
    const serverResult = await server.execute();

    expect(clientFn).toHaveBeenCalledTimes(1);
    expect(serverFn).toHaveBeenCalledTimes(1);
    expect(clientResult.data).toBe('client-ok');
    expect(serverResult.data).toBe('server-ok');
  });
});
