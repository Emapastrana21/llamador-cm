const { Router } = require('express');
const router = Router();

// 1. Importamos todas las funciones (la lógica)
//    desde el controlador que creamos en el paso anterior.
const {
    registrarPaciente,
    getPacientes,
    llamarPaciente,
    marcarAtendido,
    getPacienteInfo,
    getHistorial,
    resetearDia // <--- ¡Agrégalo aquí!
} = require('../controllers/paciente.controller');

// 2. Definimos las URLs de nuestra API.
//    A cada URL le asignamos una función del controlador.

// Cuando llegue un POST a /register, 
// se ejecutará la función registrarPaciente.
router.post('/register', registrarPaciente);

// Cuando llegue un GET a /pacientes, 
// se ejecutará la función getPacientes.
router.get('/pacientes', getPacientes);

// Cuando llegue un POST a /llamar/un-id (ej: /llamar/123),
// se ejecutará la función llamarPaciente.
router.post('/llamar/:id', llamarPaciente);

// Cuando llegue un PATCH a /atendido/un-id (ej: /atendido/123),
// se ejecutará la función marcarAtendido.
router.patch('/atendido/:id', marcarAtendido);

// Cuando llegue un GET a /paciente (ej: /paciente?dni=123456),
// se ejecutará la función getPacienteInfo.
router.get('/paciente', getPacienteInfo);

// Ruta para ver los atendidos
router.get('/historial', getHistorial);

// Definimos la ruta de reset (al final o junto a las otras)
router.delete('/api/reset', resetearDia);

// 3. Exportamos el 'router' para que index.js pueda usarlo.
module.exports = router;