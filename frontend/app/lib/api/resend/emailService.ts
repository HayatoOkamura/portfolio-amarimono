import { resend } from './resendClient';

export const sendVerificationEmail = async (email: string, verificationLink: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resendのテスト用ドメインを使用
      to: email,
      subject: 'メール認証のご案内',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">メール認証のご案内</h2>
          <p>以下のリンクをクリックして、メールアドレスの認証を完了してください。</p>
          <p style="margin: 20px 0;">
            <a href="${verificationLink}" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               認証を完了する
            </a>
          </p>
          <p>このリンクは24時間有効です。</p>
          <p>もしこのメールに心当たりがない場合は、このメールを無視してください。</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">このメールは自動送信されています。返信はできませんのでご注意ください。</p>
        </div>
      `,
    });

    if (error) {
      console.error('Email sending error:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}; 