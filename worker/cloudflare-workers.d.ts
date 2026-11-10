// The one member of the `cloudflare:workers` module this repo uses, declared
// by hand for the same reason as the KV and D1 types in worker/index.ts:
// @cloudflare/workers-types installs globals that collide with the DOM lib.
declare module 'cloudflare:workers' {
  export abstract class WorkerEntrypoint<Env = unknown> {
    protected ctx: unknown;
    protected env: Env;
    constructor(ctx: unknown, env: Env);
  }
}
