import { Resend } from 'resend';

if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
  throw new Error('NEXT_PUBLIC_RESEND_API_KEY is not defined');
}

export const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY); 