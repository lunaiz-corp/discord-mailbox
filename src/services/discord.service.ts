/**
 * This file is meant to be run from the command line, and is not used by the application server.
 * It's allowed to use node.js primitives, and only needs to be run once.
 */

import { H3Event, EventHandlerRequest, getRequestHeader, toWebRequest } from 'h3';

import { REST } from '@discordjs/rest';
import { verifyKey } from 'discord-interactions';
import { type APIInteraction, Routes } from 'discord-api-types/v10';

import * as commandsMeta from '../discord/commands';
import type { Commands, CommandsMeta } from '../types/commands';

export class DiscordService {
	private env?: Env = undefined;

	init(env: Env): void {
		this.env = env;

		/**
		 * Validate environment variables.
		 */
		if (!env.DISCORD_BOT_TOKEN) {
			throw new Error('The DISCORD_BOT_TOKEN environment variable is required.');
		}

		if (!env.DISCORD_CLIENT_ID) {
			throw new Error('The DISCORD_CLIENT_ID environment variable is required.');
		}

		if (!env.DISCORD_GUILD_ID) {
			throw new Error('The DISCORD_GUILD_ID environment variable is required.');
		}
	}

	async registerCommands(): Promise<void> {
		if (!this.env) {
			throw new Error('Environment variables are not correctly set.');
		}

		const token = this.env.DISCORD_BOT_TOKEN;
		const clientId = this.env.DISCORD_CLIENT_ID;
		const guildId = this.env.DISCORD_GUILD_ID;

		/**
		 * Register all commands.
		 * This can take o(minutes), so wait until you're sure these are the commands you want.
		 */

		const rest = new REST({ version: '10' }).setToken(token);

		const commands: Commands[] = [];
		Object.values(commandsMeta).forEach((command: CommandsMeta) => {
			commands.push({
				name: command.name,
				description: command.description,
			});
		});

		try {
			await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
				body: commands,
			});

			console.log('[Deploy] Successfully deployed ✅');
		} catch (error) {
			console.error(`[Deploy] Deploy failed ❌ -> ${error}`);
		}
	}

	async verifyDiscordRequest(e: H3Event<EventHandlerRequest>): Promise<{ interaction: APIInteraction; isValid: boolean }> {
		if (!this.env) {
			throw new Error('Environment variables are not correctly set.');
		}

		const signature = getRequestHeader(e, 'x-signature-ed25519');
		const timestamp = getRequestHeader(e, 'x-signature-timestamp');

		const body = await toWebRequest(e).clone().text();

		if (!body) {
			return { interaction: {} as APIInteraction, isValid: false };
		}

		const isValidRequest = signature && timestamp && verifyKey(body, signature, timestamp, this.env.DISCORD_PUBLIC_KEY);
		if (!isValidRequest) {
			return { interaction: {} as APIInteraction, isValid: false };
		}

		return { interaction: JSON.parse(body) as APIInteraction, isValid: true };
	}
}
