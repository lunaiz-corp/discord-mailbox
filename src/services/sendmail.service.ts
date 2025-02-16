import { EmailMessage } from 'cloudflare:email';

import { Marked } from 'marked';
import { createMimeMessage } from 'mimetext/browser';

import { MailParams, MailParamsBase } from '../types/mailbox';

export class SendMailService {
	private readonly env: Env;
	private readonly marked: Marked;

	// prettier-ignore
	private readonly autoReplyTemplate: string = `
    <!-- Desktop Outlook chokes on web font references and defaults to Times New Roman, so we force a safe fallback font. -->
    <!--[if mso]>
      <style>
        * { font-family: sans-serif !important; }
      </style>
    <![endif]-->
    
    <!-- All other clients get the webfont reference; some will render the font and others will silently fail to the fallbacks. -->
    <!--[if !mso]><!-->
    <link
      href="https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/static/split/WantedSans.min.css"
      type="text/css">
    <!--<![endif]-->
    
    <div
      style="padding: 10px; color: #444444; font-size: 12px; line-height: 18px; font-family: 'Wanted Sans', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;">
      <div style="color: #b5b5b5;">## 회신을 보내실 경우 이 줄 위에 내용을 입력해 주세요 ##</div>
      <div style="color: #b5b5b5;">## In replies all text above this line is added to the ticket ##</div>
    
      <p dir="ltr"></p>
    
      <div style="margin-top: 25px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tbody>
            <tr>
              <td width="100%" style="padding: 15px 0; border-top: 1px dotted #c5c5c5;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;"
                  role="presentation">
                  <tbody>
                    <tr>
                      <td valign="top" style="padding: 0 15px 0 15px; width: 40px;">
                        <img width="40" height="40" alt=""
                          style="height: auto; line-height: 100%; outline: none; text-decoration: none; border-radius: 5px;"
                          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAAAAACreq1xAAAA6UlEQVR4Ae3XBWKEQAxA0d7/jAuLu7unruiQ1PMP8IAx4EYijkEGGWSQQQa/FDTiZpj6yldoQLWEp8ZIJgCtEV6rFTRoTPC2VkaC1wHelyPBGD5moEB5nIE5CrRh1ogCI5inY8B0AbToQfpHpp8U+mVDv7Dptx794UB/fNEfsPhXwP9566mWGwSupdKAZtLBU11iokG7hnfVNgpUSphVKudBa4CFBuss6Eyw2OSIg3NvLoqC2girjdoJsIGNGnEwhM1CUVAetsFBFgQD2CkQBNs9sBUDFdhNEQLdfdDl/xQGGWSQQQb/O3gLsljx5kzaDnoAAAAASUVORK5CYII=" data-bit="iit" />
                      </td>
                      <td width="100%" style="padding: 0; margin: 0;" valign="top">
                        <p style="font-size: 15px; line-height: 18px; margin-bottom: 0; margin-top: 0; padding: 0; color: #1b1d1e;"
                          dir="ltr"><strong>{{channel_name}}</strong></p>
                        <p style="font-size: 13px; line-height: 25px; margin-bottom: 15px; margin-top: 0; padding: 0; color: #bbbbbb;"
                          dir="ltr">{{send_date}} (KST)</p>
                        <div dir="auto" style="color: #2b2e2f; line-height: 22px; margin: 15px 0;">
                          <p dir="ltr" style="color: #2b2e2f; line-height: 22px; margin: 15px 0;">고객님의
                            문의(#{{ticket_no}})가 성공적으로 접수되었습니다.<br />빠른 시간 내에 답변 드리겠습니다.</p>
                          <p dir="ltr" style="color: #2b2e2f; line-height: 22px; margin: 15px 0;">스페이스왁 서비스를 이용해 주셔서
                            감사합니다.</p>
                          <p dir="ltr"></p>
                          <p dir="ltr" style="color: #b5b5b5;">이 메시지는 문의 접수 완료시에 안내되는 자동화 메시지입니다. 추가하실 내용이 있으시면 답장으로 편하게
                            연락 주시기 바랍니다.</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    
      <div style="color: #9e9e9e; margin: 10px 0 14px 0; padding-top: 10px; border-top: 1px solid #eeeeee;">
        This email delivered by
        <a href="http://www.cloudflare.com" style="color: black;" target="_blank">
          <span class="il">Cloudflare</span>
        </a>
      </div>
    </div>
  `;

	// prettier-ignore
	private readonly responseTemplate: string = `
    <!-- Desktop Outlook chokes on web font references and defaults to Times New Roman, so we force a safe fallback font. -->
    <!--[if mso]>
      <style>
        * { font-family: sans-serif !important; }
      </style>
    <![endif]-->
    
    <!-- All other clients get the webfont reference; some will render the font and others will silently fail to the fallbacks. -->
    <!--[if !mso]><!-->
    <link
      href="https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/static/split/WantedSans.min.css"
      type="text/css">
    <!--<![endif]-->
    
    <div
      style="padding: 10px; color: #444444; font-size: 12px; line-height: 18px; font-family: 'Wanted Sans', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;">
      <div style="color: #b5b5b5;">## 회신을 보내실 경우 이 줄 위에 내용을 입력해 주세요 ##</div>
      <div style="color: #b5b5b5;">## In replies all text above this line is added to the ticket ##</div>
    
      <p dir="ltr"></p>
    
      <div style="margin-top: 25px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tbody>
            <tr>
              <td width="100%" style="padding: 15px 0; border-top: 1px dotted #c5c5c5;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;"
                  role="presentation">
                  <tbody>
                    <tr>
                      <td valign="top" style="padding: 0 15px 0 15px; width: 40px;">
                        <img width="40" height="40" alt=""
                          style="height: auto; line-height: 100%; outline: none; text-decoration: none; border-radius: 5px;"
                          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAAAAACreq1xAAAA6UlEQVR4Ae3XBWKEQAxA0d7/jAuLu7unruiQ1PMP8IAx4EYijkEGGWSQQQa/FDTiZpj6yldoQLWEp8ZIJgCtEV6rFTRoTPC2VkaC1wHelyPBGD5moEB5nIE5CrRh1ogCI5inY8B0AbToQfpHpp8U+mVDv7Dptx794UB/fNEfsPhXwP9566mWGwSupdKAZtLBU11iokG7hnfVNgpUSphVKudBa4CFBuss6Eyw2OSIg3NvLoqC2girjdoJsIGNGnEwhM1CUVAetsFBFgQD2CkQBNs9sBUDFdhNEQLdfdDl/xQGGWSQQQb/O3gLsljx5kzaDnoAAAAASUVORK5CYII=" data-bit="iit" />
                      </td>
                      <td width="100%" style="padding: 0; margin: 0;" valign="top">
                        <p style="font-size: 15px; line-height: 18px; margin-bottom: 0; margin-top: 0; padding: 0; color: #1b1d1e;"
                          dir="ltr"><strong>{{manager_name}}</strong> ({{manager_team}})</p>
                        <p style="font-size: 13px; line-height: 25px; margin-bottom: 15px; margin-top: 0; padding: 0; color: #bbbbbb;"
                          dir="ltr">{{send_date}} (KST)</p>
                        <div dir="auto" style="color: #2b2e2f; line-height: 22px; margin: 15px 0;">
                          <p dir="ltr" style="color: #2b2e2f; line-height: 22px; margin: 15px 0;">
                            {{content}}</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="color: #9e9e9e; margin: 10px 0 14px 0; padding-top: 10px; border-top: 1px solid #eeeeee;">
        This email delivered by
        <a href="hhttps://www.mailgun.com" style="color: black;" target="_blank">
          <span class="il">Sinch Mailgun</span>
        </a> and <a href="http://www.cloudflare.com" style="color: black;" target="_blank">
          <span class="il">Cloudflare</span>
        </a>
      </div>
    </div>
  `;

	constructor(env: Env) {
		this.env = env;
		this.marked = new Marked({ async: true });
	}

	public async sendMail(data: MailParams) {
		const form = new FormData();
		form.append('from', `${data.from.name} <${data.from.address}>`);
		form.append('to', data.to.address);
		form.append('subject', `[${this.env.EMAIL_PREFIX}] #${data.id}: ${data.subject}`);
		form.append(
			'html',

			// prettier-ignore
			this.responseTemplate
				.replaceAll('{{manager_name}}', data.from.name)
				.replaceAll('{{manager_team}}', this.env.EMAIL_PREFIX)
        .replaceAll('{{send_date}}', new Intl.DateTimeFormat('ko-KR', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Asia/Seoul',
          }).format(new Date()))
				.replaceAll('{{content}}', await this.marked.parse(data.content)),
		);

		const response = await fetch(`https://api.mailgun.net/v3/${this.env.MAILGUN_DOMAIN}/messages`, {
			method: 'POST',
			headers: {
				Authorization: 'Basic ' + btoa(`api:${this.env.MAILGUN_API_KEY}`),
			},
			body: form,
		});

		console.log(await response.json());
	}

	public async replyMail(message: ForwardableEmailMessage, data: MailParamsBase) {
		const msg = createMimeMessage();

		msg.setHeader('In-Reply-To', message.headers.get('Message-ID')!);
		msg.setSender({
			name: `${this.env.EMAIL_PREFIX} Support`,
			addr: message.to,
		});
		msg.setRecipient(message.from);

		msg.setSubject(`[${this.env.EMAIL_PREFIX}] #${data.id}: ${data.subject}`);
		msg.addMessage({
			contentType: 'text/html',

			// prettier-ignore
			data: this.autoReplyTemplate
        .replaceAll('{{channel_name}}', `${this.env.EMAIL_PREFIX} Support`)
        .replaceAll('{{send_date}}', new Intl.DateTimeFormat('ko-KR', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Asia/Seoul',
          }).format(new Date()))
        .replaceAll('{{ticket_no}}', data.id),
		});

		const replyMessage = new EmailMessage(message.to, message.from, msg.asRaw());
		return await message.reply(replyMessage);
	}
}
