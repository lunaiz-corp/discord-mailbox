import { APIInteraction, APIInteractionResponse } from 'discord-api-types/v10';

export type Commands = {
	name: string;
	description: string;
};

export interface CommandsMeta extends Commands {
	execute: (interaction: APIInteraction, env: Env) => Promise<APIInteractionResponse>;
}
