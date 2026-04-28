import nodemailer from "nodemailer";

type PasswordRecoveryTemplateParams = {
  userName: string;
  temporaryPassword: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}

function buildPasswordRecoveryTemplate({ userName, temporaryPassword }: PasswordRecoveryTemplateParams) {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Recuperación de contraseña</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f7f8;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f8;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #d5e3e0;">
                <tr>
                  <td style="padding:32px;background:linear-gradient(135deg,#0e7c72,#18a999);color:#ffffff;">
                    <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">OnDent</p>
                    <h1 style="margin:0;font-size:28px;line-height:1.2;">Recuperación de contraseña</h1>
                    <p style="margin:12px 0 0;font-size:15px;line-height:1.6;opacity:0.92;">Generamos una nueva contraseña temporal para que puedas volver a ingresar al sistema.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hola ${userName},</p>
                    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#334155;">
                      Recibimos una solicitud para restablecer tu acceso. Esta es tu nueva contraseña temporal:
                    </p>
                    <div style="margin:0 0 24px;padding:18px 20px;border-radius:18px;background:#ecfeff;border:1px solid #a5f3fc;text-align:center;">
                      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#0f766e;">Contraseña temporal</p>
                      <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.08em;color:#0f172a;">${temporaryPassword}</p>
                    </div>
                    <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">
                      Te recomendamos iniciar sesión y cambiarla desde tu perfil apenas ingreses.
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">
                      Si no solicitaste este cambio, avisá al administrador del sistema.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                      Este correo fue enviado automáticamente por OnDent.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const smtpHost = getRequiredEnv("SMTP_HOST");
  const smtpPort = Number(getRequiredEnv("SMTP_PORT"));
  const smtpUser = getRequiredEnv("SMTP_USER");
  const smtpPass = getRequiredEnv("SMTP_PASS");
  const smtpSecure = process.env.SMTP_SECURE === "true";

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
}

export async function sendPasswordRecoveryEmail(to: string, params: PasswordRecoveryTemplateParams) {
  const smtpFrom = getRequiredEnv("SMTP_FROM");

  await getTransporter().sendMail({
    from: smtpFrom,
    to,
    subject: "OnDent | Nueva contraseña temporal",
    html: buildPasswordRecoveryTemplate(params),
  });
}
