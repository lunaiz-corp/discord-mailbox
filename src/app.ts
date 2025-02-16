import { createApp, defineEventHandler, setResponseHeader, setResponseStatus } from 'h3';

import discordController from './controllers/discord.controller';

export const app = createApp();

app.use(discordController);

app.use(
	defineEventHandler((e) => {
		setResponseHeader(e, 'Content-Type', 'application/json;charset=UTF-8');
		setResponseStatus(e, 404, 'Not Found');

		return {
			code: 'NOT_FOUND',
			status: 404,

			message: 'Not Found',
			data: null,

			responseAt: new Date().toISOString(),
		};
	}),
);
