import { createRouter, defineEventHandler, setResponseHeader, setResponseStatus } from 'h3';
import { InteractionResponseType, InteractionType } from 'discord-api-types/v10';

import { H3EventContextWithCloudflare } from '../types/cloudflare';

import * as commands from '../discord/commands';
import * as actions from '../discord/actions';

import { DiscordService } from '../services/discord.service';

const router = createRouter();
const discordService = new DiscordService();

/**
 * A simple :wave: hello page to verify the worker is working.
 */
router.get(
	'/',
	defineEventHandler(async (e) => {
		const c = e.context as H3EventContextWithCloudflare;

		if (
			!c.cloudflare.env.DISCORD_CLIENT_ID ||
			!c.cloudflare.env.DISCORD_GUILD_ID ||
			!c.cloudflare.env.DISCORD_BOT_TOKEN ||
			!c.cloudflare.env.DISCORD_PUBLIC_KEY
		) {
			return Response.json(
				{
					code: 'INTERNAL_SERVER_ERROR',
					status: 500,

					message: 'Required environment variables are not correctly set. Ask your administrator for assistance.',
					data: null,

					responseAt: new Date().toISOString(),
				},
				{ status: 500 },
			);
		}

		setResponseHeader(e, 'Content-Type', 'application/json;charset=UTF-8');

		return {
			code: 'OPERATION_COMPLETE',
			status: 200,

			message: '👋 Worker is currently running.',
			data: {
				clientId: c.cloudflare.env.DISCORD_CLIENT_ID,
			},

			responseAt: new Date().toISOString(),
		};
	}),
);

router.get(
	'/register',
	defineEventHandler(async (e) => {
		const c = e.context as H3EventContextWithCloudflare;

		discordService.init(c.cloudflare.env);
		await discordService.registerCommands();

		setResponseHeader(e, 'Content-Type', 'text/plain');

		return 'OK';
	}),
);

/**
 * Main route for all requests sent from Discord.
 * All incoming messages will include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post(
	'/',
	defineEventHandler(async (e) => {
		const c = e.context as H3EventContextWithCloudflare;
		discordService.init(c.cloudflare.env);

		const { isValid, interaction } = await discordService.verifyDiscordRequest(e);

		if (!isValid || !interaction) {
			setResponseHeader(e, 'Content-Type', 'text/plain');
			setResponseStatus(e, 401, 'Unauthorized');
			return 'Bad request signature.';
		}

		if (interaction.type === InteractionType.Ping) {
			//* The `PING` message is used during the initial webhook handshake,
			//* and is required to configure the webhook in the developer portal.

			setResponseHeader(e, 'Content-Type', 'application/json;charset=UTF-8');
			return { type: InteractionResponseType.Pong };
		}

		if (interaction.type === InteractionType.ApplicationCommand) {
			//* Most user commands will come as `APPLICATION_COMMAND`.
			switch (interaction.data.name.toLowerCase()) {
				case commands.replyCommand.name:
					setResponseHeader(e, 'Content-Type', 'application/json;charset=UTF-8');
					return await commands.replyCommand.execute(interaction, c.cloudflare.env);

				default:
					setResponseHeader(e, 'Content-Type', 'text/plain');
					setResponseStatus(e, 400, 'Bad Request');
					return 'Unknown Type';
			}
		}

		if (interaction.type === InteractionType.ModalSubmit) {
			switch (interaction.data.custom_id) {
				case actions.replyAction.name:
					setResponseHeader(e, 'Content-Type', 'application/json;charset=UTF-8');
					return await actions.replyAction.execute(interaction, c.cloudflare.env);

				default:
					setResponseHeader(e, 'Content-Type', 'text/plain');
					setResponseStatus(e, 400, 'Bad Request');
					return 'Unknown Type';
			}
		}

		setResponseHeader(e, 'Content-Type', 'text/plain');
		setResponseStatus(e, 400, 'Bad Request');
		return 'Unknown Type';
	}),
);

export default router;
