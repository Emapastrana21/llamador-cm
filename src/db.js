const { Pool } = require('pg');
require('dotenv').config(); // Carga las variables de .env

// Configuración de la conexión a la base de datos PostgreSQL
// Lee los datos del archivo .env que crearemos luego
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Exportamos el 'pool' para poder hacer consultas desde otros archivos
module.exports = pool;