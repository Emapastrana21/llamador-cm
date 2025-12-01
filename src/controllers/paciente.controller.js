const pool = require('../db'); // Importa la conexión a la BBDD
const CM_VALUE = process.env.CM_VALUE; // Importa el valor de CM del .env

// Función para formatear fecha y hora
const formatearFechaHora = (horario) => {
    const fechaActual = new Date().toISOString().split('T')[0];
    const hora = new Date(horario).toTimeString().split(' ')[0];
    return `${fechaActual} ${hora}`;
};

// --- LÓGICA DE ENDPOINT: Registrar Paciente ---
const registrarPaciente = async (req, res) => {
    // 1. Obtener datos del formulario (del frontend)
    const { nombre, apellido, dni, horario, especialidad, nro_consultorio } = req.body;
    // 2. Obtener 'io' (el objeto de socket) que guardamos en index.js
    const io = req.app.get('socketio');
    
    try {
        const paciente = {
            nombre: nombre.toUpperCase(),
            apellido: apellido.toUpperCase(),
            dni: dni.toUpperCase(),
            horario: formatearFechaHora(horario),
            especialidad: especialidad.toUpperCase(),
            nro_consultorio: nro_consultorio.toString(),
        };

        // 3. Insertar en la base de datos
        await pool.query(
            'INSERT INTO pacientes (nombre, apellido, dni, horario, especialidad, nro_consultorio, cm) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [paciente.nombre, paciente.apellido, paciente.dni, paciente.horario, paciente.especialidad, paciente.nro_consultorio, CM_VALUE]
        );

        // 4. Avisar por socket a todos que hay un nuevo paciente
        io.emit('nuevo_paciente', paciente);
        
        // 5. Redirigir al usuario de vuelta al formulario de registro
        res.redirect('/register.html');

    } catch (err) {
        console.error('Error al registrar paciente:', err);
        res.status(500).send('Error al registrar paciente');
    }
};

// --- LÓGICA DE ENDPOINT: Obtener Pacientes ---
const getPacientes = async (req, res) => {
    const { nro_consultorio } = req.query; // Obtener el filtro (si existe)
    try {
        const values = nro_consultorio ? [nro_consultorio, CM_VALUE] : [CM_VALUE];
        const query = `
            SELECT * FROM pacientes 
            WHERE atendido = FALSE AND cm = $${nro_consultorio ? '2' : '1'} 
            ${nro_consultorio ? 'AND nro_consultorio = $1' : ''} 
            ORDER BY horario ASC
        `;
        
        const { rows } = await pool.query(query, values);
        res.json(rows); // Devolver la lista como JSON

    } catch (err) {
        console.error('Error al obtener pacientes:', err);
        res.status(500).send('Error al obtener pacientes');
    }
};

// --- LÓGICA DE ENDPOINT: Llamar Paciente ---
const llamarPaciente = async (req, res) => {
    const { id } = req.params; // Obtener el ID de la URL
    const io = req.app.get('socketio');
    
    try {
        const { rows } = await pool.query(
            'SELECT nombre, apellido, especialidad, nro_consultorio FROM pacientes WHERE id = $1 AND cm = $2',
            [id, CM_VALUE]
        );

        if (rows.length > 0) {
            io.emit('llamada', rows[0]); // Enviar socket a las pantallas
            res.status(200).json({ success: true, message: 'Llamada enviada' });
        } else {
            res.status(404).json({ success: false, message: 'Paciente no encontrado' });
        }
    } catch (err) {
        console.error('Error al llamar al paciente:', err);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

// --- LÓGICA DE ENDPOINT: Marcar Atendido ---
const marcarAtendido = async (req, res) => {
    const { id } = req.params;
    const { motivo } = req.body;
    const io = req.app.get('socketio');

    if (!['ATENDIDO', 'NO ATENDIDO'].includes(motivo)) {
        return res.status(400).send('Motivo no válido');
    }

    try {
        await pool.query(
            'UPDATE pacientes SET atendido = TRUE, motivo = $1 WHERE id = $2 AND cm = $3',
            [motivo, id, CM_VALUE]
        );
        
        io.emit('actualizar_lista'); // Avisar a los paneles que actualicen
        res.status(200).send(`Paciente actualizado como ${motivo}`);
    } catch (err) {
        console.error('Error al actualizar paciente:', err);
        res.status(500).send('Error al actualizar paciente');
    }
};

// --- LÓGICA DE ENDPOINT: Buscar por DNI ---
const getPacienteInfo = async (req, res) => {
    const { dni } = req.query;
    try {
        const { rows } = await pool.query(
            'SELECT nombre, apellido FROM pacientes WHERE dni = $1 AND cm = $2',
            [dni, CM_VALUE]
        );
        if (rows.length > 0) {
            res.json({ success: true, ...rows[0] });
        } else {
            res.json({ success: false, message: 'Paciente no encontrado' });
        }
    } catch (err) {
        console.error('Error al obtener paciente:', err);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

// --- LÓGICA DE ENDPOINT: Obtener Historial ---
const getHistorial = async (req, res) => {
    try {
        // Buscamos pacientes atendidos (= TRUE), ordenados del más reciente al más antiguo
        // Limitamos a 50 para que no explote la pantalla si hay miles
        const query = `
            SELECT * FROM pacientes 
            WHERE atendido = TRUE AND cm = $1 
            ORDER BY id DESC 
            LIMIT 50
        `;
        
        const { rows } = await pool.query(query, [CM_VALUE]);
        res.json(rows);

    } catch (err) {
        console.error('Error al obtener historial:', err);
        res.status(500).send('Error al obtener historial');
    }
};

// --- LÓGICA: Borrar todo (Resetear sistema) ---
const resetearDia = async (req, res) => {
    try {
        // TRUNCATE borra los datos y RESTART IDENTITY pone los IDs en 1 de nuevo
        await pool.query('TRUNCATE TABLE pacientes RESTART IDENTITY');
        
        const io = req.app.get('socketio');
        io.emit('actualizar_lista'); // Avisa a todas las pantallas que se vació todo
        
        res.json({ success: true, message: 'Sistema reiniciado correctamente' });
    } catch (err) {
        console.error('Error al resetear:', err);
        res.status(500).json({ success: false });
    }
};

// Exportamos todas las funciones para usarlas en las rutas
module.exports = {
    registrarPaciente,
    getPacientes,
    llamarPaciente,
    marcarAtendido,
    getPacienteInfo,
    getHistorial,
    resetearDia 
};