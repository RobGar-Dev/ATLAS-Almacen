// Crea el primer usuario administrador. Ejecutar una sola vez:
//   npm run seed
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

const USUARIO_ADMIN = 'admin';
const PASSWORD_ADMIN = 'admin123'; // Cámbiala después del primer login

async function seed() {
    const [existente] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [USUARIO_ADMIN]);

    if (existente[0]) {
        console.log('El usuario "admin" ya existe. No se creó ninguno nuevo.');
        process.exit(0);
    }

    const passwordHash = await bcrypt.hash(PASSWORD_ADMIN, 12);

    await pool.query(
        'INSERT INTO usuarios (nombre, usuario, password_hash, rol, activo) VALUES (?, ?, ?, ?, TRUE)',
        ['Administrador', USUARIO_ADMIN, passwordHash, 'administrador']
    );

    console.log(`Usuario administrador creado -> usuario: "${USUARIO_ADMIN}" · contraseña: "${PASSWORD_ADMIN}"`);
    console.log('Cámbiala en cuanto inicies sesión por primera vez.');
    process.exit(0);
}

seed().catch((error) => {
    console.error('Error al crear el usuario administrador:', error);
    process.exit(1);
});