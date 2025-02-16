import type { H3EventContext } from 'h3';

export interface H3EventContextWithCloudflare extends H3EventContext {
	cloudflare: {
		env: Env;
		ctx: ExecutionContext;
	};
}
