/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Share command metadata from a common spot to be used for both runtime and registration.
 */

import { APIInteraction, InteractionResponseType, ComponentType, APIModalInteractionResponse } from 'discord-api-types/v10';

export const replyCommand = {
	name: 'reply',
	description: '메일 답변을 전송합니다.',
	execute: async (_interaction: APIInteraction, _env: Env): Promise<APIModalInteractionResponse> => {
		return {
			type: InteractionResponseType.Modal,
			data: {
				title: '문의 답변 보내기',
				custom_id: 'reply',
				components: [
					{
						type: ComponentType.ActionRow,
						components: [
							{
								type: ComponentType.TextInput,
								custom_id: 'content',
								label: '답변 내용',
								style: 2,
								min_length: 1,
								max_length: 4000,
								placeholder: '답변 내용을 입력해주세요.',
								required: true,
							},
						],
					},
				],
			},
		};
	},
};
