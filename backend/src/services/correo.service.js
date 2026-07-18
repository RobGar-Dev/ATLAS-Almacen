// TODO: este servicio todavía no envía correos reales. Cuando decidas el
// proveedor (ej. Nodemailer con SMTP, SendGrid, Resend), reemplaza el
// contenido de esta función. La forma de la función (recibe productos y
// remitente, regresa una promesa) puede quedarse igual para no tener que
// tocar el controller ni el frontend.
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
// async function enviarRequisicionCompras(productos, remitente) {
//     const filas = productos.map((p) => `<tr><td>${p.codigo}</td><td>${p.nombre}</td><td>${p.stock}</td></tr>`).join('');
//     await transporter.sendMail({
//         from: process.env.SMTP_FROM,
//         to: process.env.CORREO_COMPRAS,
//         subject: 'Requisición de productos',
//         html: `<table>${filas}</table>`,
//     });
// }

async function enviarRequisicionCompras(productos, remitente) {
    console.log(`[correo simulado] ${remitente} solicitó requisición de ${productos.length} producto(s).`);
    return { enviado: true };
}

module.exports = { enviarRequisicionCompras };
