import { getRequiredEnv } from "../helpers/env";
import { sendEmail } from "./emailService";

type PasswordRecoveryTemplateParams = {
  userName: string;
  temporaryPassword: string;
};

function buildPasswordRecoveryTemplate({ userName, temporaryPassword }: PasswordRecoveryTemplateParams) {
  const frontendUrl = getRequiredEnv("FRONTEND_URL");

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Recuperación de contraseña</title>
      </head>
      <body style="margin:0;padding:0;background:#e4f3fa;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e4f3fa;padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #bfe3df;">
                <tr>
                  <td style="padding:32px;background:linear-gradient(135deg,#0f8f82,#15aa9a);color:#ffffff;">
                    <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">OnDent</p>
                    <h1 style="margin:0;font-size:28px;line-height:1.2;">Recuperación de contraseña</h1>
                    <p style="margin:12px 0 0;font-size:15px;line-height:1.7;opacity:0.95;">
                      Generamos una contraseña temporal para que puedas volver a ingresar al sistema.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 32px 24px;">
                    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hola ${userName},</p>
                    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334155;">
                      Recibimos una solicitud de recupero de contraseña. Usá esta contraseña temporal para iniciar sesión:
                    </p>
                    <div style="margin:0 0 24px;padding:18px;border-radius:18px;background:#e4f3fa;border:1px solid #b5dfda;text-align:center;">
                      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#0e7c72;">Contraseña temporal</p>
                      <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.08em;color:#0f172a;">${temporaryPassword}</p>
                    </div>
                    <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">
                      Ingresá en <a href="${frontendUrl}" style="color:#15aa9a;font-weight:700;text-decoration:none;">OnDent</a> y cambiala desde tu perfil apenas accedas.
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">
                      Si no solicitaste este cambio, comunicate con el administrador del sistema.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 32px;background:#f8fbfc;border-top:1px solid #d8ece8;">
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

export async function sendPasswordRecoveryEmail(to: string, params: PasswordRecoveryTemplateParams) {
  await sendEmail({
    to,
    subject: "OnDent | Nueva contraseña temporal",
    html: buildPasswordRecoveryTemplate(params),
  });
}
