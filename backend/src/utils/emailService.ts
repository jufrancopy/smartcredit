import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const getEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .highlight-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .amount { font-size: 24px; font-weight: bold; color: #28a745; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .info-label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .info-value { font-size: 16px; font-weight: bold; color: #333; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .status-success { color: #28a745; font-weight: bold; }
        .status-pending { color: #ffc107; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 SmartCredit</h1>
            <p>Tu socio financiero de confianza</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p><strong>SmartCredit</strong> - Sistema de Gestión de Préstamos</p>
            <p>📧 Contacto: soporte@smartcredit.com | 📞 Tel: +595 21 123-4567</p>
        </div>
    </div>
</body>
</html>
`;

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"SmartCredit" <noreply@smartcredit.com>',
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
};

// Plantilla para préstamo aprobado
export const sendLoanApprovalEmail = async (clientData: {
  email: string;
  nombre: string;
  monto_principal: number;
  total_a_devolver: number;
  plazo_dias: number;
  monto_diario: number;
  fecha_inicio_cobro: string;
}) => {
  const content = `
    <h2>🎉 ¡Felicitaciones! Tu préstamo ha sido aprobado</h2>
    <p>Estimado/a <strong>${clientData.nombre}</strong>,</p>
    <p>Nos complace informarte que tu solicitud de préstamo ha sido <span class="status-success">✅ APROBADA</span>.</p>
    
    <div class="highlight-box">
        <h3>📋 Detalles de tu Préstamo</h3>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Monto Aprobado</div>
                <div class="info-value amount">${clientData.monto_principal.toLocaleString('es-PY')} Gs</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total a Devolver</div>
                <div class="info-value">${clientData.total_a_devolver.toLocaleString('es-PY')} Gs</div>
            </div>
            <div class="info-item">
                <div class="info-label">Cuota Diaria</div>
                <div class="info-value">${clientData.monto_diario.toLocaleString('es-PY')} Gs</div>
            </div>
            <div class="info-item">
                <div class="info-label">Plazo</div>
                <div class="info-value">${clientData.plazo_dias} días</div>
            </div>
        </div>
        <p><strong>📅 Inicio de Cobro:</strong> ${new Date(clientData.fecha_inicio_cobro).toLocaleDateString('es-PY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <h3>📝 Próximos Pasos</h3>
    <ul style="margin: 15px 0; padding-left: 20px;">
        <li>Recibirás <strong>${clientData.plazo_dias} cuotas diarias</strong> de ${clientData.monto_diario.toLocaleString('es-PY')} Gs cada una</li>
        <li>Puedes realizar tus pagos subiendo el comprobante en nuestra plataforma</li>
        <li>Mantén al día tus pagos para mantener un buen historial crediticio</li>
    </ul>
    
    <p>¡Gracias por confiar en <strong>SmartCredit</strong>! Estamos aquí para apoyarte en tu crecimiento financiero.</p>
  `;
  
  await sendEmail({
    to: clientData.email,
    subject: '🎉 ¡Tu préstamo SmartCredit ha sido aprobado!',
    html: getEmailTemplate(content)
  });
};

// Plantilla para pago recibido
export const sendPaymentReceivedEmail = async (clientData: {
  email: string;
  nombre: string;
  monto: number;
  installmentId: number;
}) => {
  const content = `
    <h2>📨 Hemos recibido tu pago</h2>
    <p>Hola <strong>${clientData.nombre}</strong>,</p>
    <p>Te confirmamos que hemos recibido tu pago. Nuestro equipo lo está procesando.</p>
    
    <div class="highlight-box">
        <h3>💰 Detalles del Pago Recibido</h3>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Monto Recibido</div>
                <div class="info-value amount">${clientData.monto.toLocaleString('es-PY')} Gs</div>
            </div>
            <div class="info-item">
                <div class="info-label">Cuota #</div>
                <div class="info-value">${clientData.installmentId}</div>
            </div>
        </div>
        <p><strong>📅 Fecha de Recepción:</strong> ${new Date().toLocaleDateString('es-PY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </div>
    
    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>⏳ Estado:</strong> <span class="status-pending">En proceso de verificación</span></p>
        <p>Te notificaremos por email una vez que confirmemos tu pago (generalmente en las próximas 2-4 horas).</p>
    </div>
    
    <p>Gracias por mantener tus pagos al día. ¡Tu responsabilidad nos ayuda a seguir creciendo juntos!</p>
  `;
  
  await sendEmail({
    to: clientData.email,
    subject: '📨 Pago recibido - SmartCredit',
    html: getEmailTemplate(content)
  });
};

// Plantilla para pago confirmado
export const sendPaymentConfirmedEmail = async (clientData: {
  email: string;
  nombre: string;
  monto: number;
  installmentId: number;
}) => {
  const content = `
    <h2>✅ ¡Tu pago ha sido confirmado!</h2>
    <p>Estimado/a <strong>${clientData.nombre}</strong>,</p>
    <p>¡Excelente noticia! Tu pago ha sido <span class="status-success">✅ CONFIRMADO</span> exitosamente.</p>
    
    <div class="highlight-box">
        <h3>💳 Detalles del Pago Confirmado</h3>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Monto Confirmado</div>
                <div class="info-value amount">${clientData.monto.toLocaleString('es-PY')} Gs</div>
            </div>
            <div class="info-item">
                <div class="info-label">Cuota #</div>
                <div class="info-value">${clientData.installmentId}</div>
            </div>
        </div>
        <p><strong>📅 Fecha de Confirmación:</strong> ${new Date().toLocaleDateString('es-PY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </div>
    
    <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>🎯 ¡Felicitaciones!</strong> Mantienes un excelente historial de pagos.</p>
        <p>Tu responsabilidad financiera te abre las puertas a mejores oportunidades crediticias.</p>
    </div>
    
    <p>Gracias por ser parte de la familia <strong>SmartCredit</strong>. ¡Seguimos creciendo juntos!</p>
  `;
  
  await sendEmail({
    to: clientData.email,
    subject: '✅ Pago confirmado - SmartCredit',
    html: getEmailTemplate(content)
  });
};