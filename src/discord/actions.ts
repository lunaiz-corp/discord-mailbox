/**
 * Share command metadata from a common spot to be used for both runtime and registration.
 */

import { APIModalSubmitInteraction } from 'discord-api-types/v10';
import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';

import { MailParams, MailBox } from '../types/mailbox';
import { SendMailService } from '../services/sendmail.service';

export const replyAction = {
	name: 'reply',
	description: '메일 답변을 전송합니다.',
	execute: async (interaction: APIModalSubmitInteraction, env: Env) => {
		const sendMailService = new SendMailService(env);

		if (!interaction.channel?.name?.split('#')[1].split(':')[0]) {
			return {
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: ':warning: 메일함 채널이 아닙니다.',
					flags: InteractionResponseFlags.EPHEMERAL,
				},
			};
		}

		const mailBoxData = await env.DB.prepare('SELECT * FROM Tickets WHERE Id = ?')
			.bind(interaction.channel?.name?.split('#')[1].split(':')[0])
			.first<MailBox>();

		if (!mailBoxData) {
			return {
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: ':warning: 해당 메일이 존재하지 않습니다.',
					flags: InteractionResponseFlags.EPHEMERAL,
				},
			};
		}

		const mailParams: MailParams = {
			id: mailBoxData.Id,
			subject: mailBoxData.Subject,

			content:
				interaction.data.components.find((x) => x.type === 1)?.components.find((x) => x.type === 4 && x.custom_id === 'content')?.value ??
				'',

			from: {
				name: interaction.member?.user?.global_name ?? interaction.member?.user?.username ?? '',
				address: mailBoxData.Receiver,
			},
			to: {
				address: mailBoxData.Author,
			},
		};

		console.log(mailParams);

		await sendMailService.sendMail(mailParams);

		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				embeds: [
					{
						title: '티켓이 업데이트 되었습니다.',
						description:
							interaction.data.components.find((x) => x.type === 1)?.components.find((x) => x.type === 4 && x.custom_id === 'content')
								?.value ?? '',

						color: 0x2f3136,
						footer: {
							text: `#${mailBoxData.Id} (${mailBoxData.Receiver} -> ${mailBoxData.Author})`,
						},
					},
				],
			},
		};
	},
};
