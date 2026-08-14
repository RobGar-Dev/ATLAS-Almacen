// TODO: este servicio todavía no envía correos reales. Cuando decidas el
// proveedor (ej. Nodemailer con SMTP, SendGrid, Resend), reemplaza el
// contenido de esta función. La forma de la función puede quedarse igual
// para no tener que tocar el controller ni el frontend.
//
// Ejemplo con Nodemailer + SMTP (una vez que instales "nodemailer"):
//
// const nodemailer = require('nodemailer');
// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
// });
//
// async function enviarRequisicionCompras({ productos, motivo, urgencia, remitente }) {
//     const filas = productos
//         .map((p) => `<tr><td>${p.nombre}</td><td>${p.cantidadSolicitada}</td></tr>`)
//         .join('');
//     await transporter.sendMail({
//         from: process.env.SMTP_FROM,
//         to: process.env.CORREO_COMPRAS,
//         subject: `Requisición de productos [${urgencia}]`,
//         html: `
//             <p>Solicitado por: ${remitente}</p>
//             <p>Urgencia: ${urgencia}</p>
//             <p>Motivo: ${motivo || '(sin especificar)'}</p>
//             <table><tr><th>Producto</th><th>Cantidad solicitada</th></tr>${filas}</table>
//         `,
//     });
// }

async function enviarRequisicionCompras({ productos, motivo, urgencia, remitente }) {
    console.log(
        `[correo simulado] ${remitente} solicitó requisición de ${productos.length} producto(s) ` +
        `· urgencia: ${urgencia} · motivo: ${motivo || '(sin especificar)'}`
    );
    productos.forEach((p) => {
        console.log(`  - ${p.nombre}: ${p.cantidadSolicitada} unidades`);
    });
    return { enviado: true };
}

module.exports = { enviarRequisicionCompras };