import { toWebHandler } from 'h3';

import { app } from './app';
import { email as emailHandler } from './controllers/email.controller';

const handler = toWebHandler(app);

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		return handler(request, {
			cloudflare: { env, ctx },
		});
	},
	async email(message: ForwardableEmailMessage, env: Env) {
		return emailHandler(message, env);
	},
};
