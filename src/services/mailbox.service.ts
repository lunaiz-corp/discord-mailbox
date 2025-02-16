import PostalMime, { Email } from 'postal-mime';

export class MailBoxService {
	private readonly env: Env;
	private readonly parser = new PostalMime();

	constructor(env: Env) {
		this.env = env;
	}

	private _trim(str: string, limit: number) {
		return str.length > limit ? `${str.substring(0, limit - 3)}...` : str;
	}

	public _createTicketId() {
		// From: https://github.com/ai/nanoid/blob/main/non-secure/index.js
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		let id = '';

		let i = 13;
		while (i--) {
			id += characters[(Math.random() * characters.length) | 0];
		}

		return id;
	}

	public async parseMail(rawMessage: ReadableStream<Uint8Array<ArrayBufferLike>>): Promise<Email> {
		return await this.parser.parse(rawMessage);
	}

	public generateRequestBody(email: Email, emailText: string, ticketId: string, message: ForwardableEmailMessage, appliedTags?: string[]) {
		const formData = new FormData();

		formData.append(
			'payload_json',
			JSON.stringify({
				name: `#${ticketId}: ${this._trim(email.subject || '(제목 없음)', 100)}`,
				message: {
					embeds: [
						{
							title: this._trim(email.subject || '(제목 없음)', 256),
							description:
								emailText.length > this.env.DISCORD_EMBED_LIMIT
									? `${emailText.substring(0, this.env.DISCORD_EMBED_LIMIT - 3)}...`
									: emailText,
							author: {
								name: `${this._trim(email.from.name || '(발신자 정보 없음)', 100)}${email.from.name.length > 64 ? '\n' : ' '}<${this._trim(
									email.from.address || '(알 수 없음)',
									100,
								)}>`,
							},
							footer: {
								text: `${this._trim(message.to || '(알 수 없음)으', 100)}로 도착한 메일`,
							},
						},
					],
				},
				appliedTags: appliedTags,
			}),
		);

		if (emailText.length > this.env.DISCORD_EMBED_LIMIT) {
			const newTextBlob = new Blob([emailText], {
				type: 'text/plain',
			});

			if (newTextBlob.size < this.env.DISCORD_FILE_LIMIT) {
				formData.append('files[0]', newTextBlob, 'email.txt');
			} else {
				formData.append('files[0]', newTextBlob.slice(0, this.env.DISCORD_FILE_LIMIT, 'text/plain'), 'email-trimmed.txt');
			}
		}

		return formData;
	}

	public generateMessageRequestBody(email: Email, emailText: string, message: ForwardableEmailMessage) {
		const formData = new FormData();

		formData.append(
			'payload_json',
			JSON.stringify({
				embeds: [
					{
						title: this._trim(email.subject || '(제목 없음)', 256),
						description:
							emailText.length > this.env.DISCORD_EMBED_LIMIT
								? `${emailText.substring(0, this.env.DISCORD_EMBED_LIMIT - 3)}...`
								: emailText,
						author: {
							name: `${this._trim(email.from.name || '(발신자 정보 없음)', 100)}${email.from.name.length > 64 ? '\n' : ' '}<${this._trim(
								email.from.address || '(알 수 없음)',
								100,
							)}>`,
						},
						footer: {
							text: `${this._trim(message.to || '(알 수 없음)으', 100)}로 도착한 메일`,
						},
					},
				],
			}),
		);

		if (emailText.length > this.env.DISCORD_EMBED_LIMIT) {
			const newTextBlob = new Blob([emailText], {
				type: 'text/plain',
			});

			if (newTextBlob.size < this.env.DISCORD_FILE_LIMIT) {
				formData.append('files[0]', newTextBlob, 'email.txt');
			} else {
				formData.append('files[0]', newTextBlob.slice(0, this.env.DISCORD_FILE_LIMIT, 'text/plain'), 'email-trimmed.txt');
			}
		}

		return formData;
	}
}
