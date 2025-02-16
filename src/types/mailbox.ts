import { type Email } from 'postal-mime';

export interface MailParamsBase {
	id: string;
	subject: string;
}

export interface MailParams extends MailParamsBase {
	content: string;

	from: {
		name: string;
		address: string;
	};
	to: {
		address: string;
	};
}

export interface MailBox {
	Id: string;
	ThreadId: string;

	Subject: string;
	Description: string;

	Author: string;
	Receiver: string;
}

export interface ExtendedEmail extends Email {
	message: ForwardableEmailMessage;
	content: string | undefined;
}
