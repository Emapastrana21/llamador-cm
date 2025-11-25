const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// --- IMPORTAMOS LAS RUTAS ---
const pacienteRoutes = require('./src/routes/paciente.routes');
const videoRoutes = require('./src/routes/video.routes'); // <--- ¡ESTA ES CLAVE!
const authRoutes = require('./src/routes/auth.routes'); // <--- 1. NUEVO

// --- Configuración Inicial ---
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// --- Middlewares ---
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Sockets ---
app.set('socketio', io);

io.on('connection', (socket) => {
    console.log('Cliente conectado');
    socket.on('disconnect', () => console.log('Cliente desconectado'));
});

// --- ACTIVAMOS LAS RUTAS ---
app.use(pacienteRoutes);
app.use(videoRoutes); // <--- ¡Y ESTA TAMBIÉN!
app.use(authRoutes);

// --- Iniciar el servidor ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> ¡ÉXITO! Servidor escuchando en el puerto ${PORT} <<<`);
});