import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || 'LLM Quiz Platform <no-reply@example.com>';

const isEmailConfigured = !!(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

export interface ParentWelcomeEmailParams {
  parentEmail: string;
  parentName: string;
  parentId: string;
  password: string;
  studentName: string;
}

export const sendParentWelcomeEmail = async (params: ParentWelcomeEmailParams): Promise<void> => {
  if (!isEmailConfigured || !transporter) {
    console.warn('Email not sent: SMTP is not configured');
    return;
  }

  const { parentEmail, parentName, parentId, password, studentName } = params;

  const subject = 'Your Parent Account for LLM Quiz Platform';
  const text = `Hello ${parentName},

An account has been created for you to monitor the progress of ${studentName} on the LLM Quiz Platform.

Login details:
Parent ID: ${parentId}
Password: ${password}

You can log in as a Parent and view analytics for your child.

If you did not expect this email, you can ignore it.

Thanks,
LLM Quiz Platform`;

  const html = `<p>Hello ${parentName},</p>
<p>An account has been created for you to monitor the progress of <strong>${studentName}</strong> on the <strong>LLM Quiz Platform</strong>.</p>
<p><strong>Login details:</strong><br/>
Parent ID: <code>${parentId}</code><br/>
Password: <code>${password}</code></p>
<p>You can log in as a <strong>Parent</strong> and view analytics for your child.</p>
<p>If you did not expect this email, you can ignore it.</p>
<p>Thanks,<br/>LLM Quiz Platform</p>`;

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: parentEmail,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('Failed to send parent welcome email', err);
  }
};
