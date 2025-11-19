// Función para buscar al paciente por DNI y autocompletar
async function buscarPaciente() {
    const dni = document.getElementById("dni").value;

    if (dni) { // Solo busca si el campo DNI tiene valor
        try {
            // Llama al endpoint /paciente?dni=... que creamos
            const response = await fetch(`/paciente?dni=${dni}`);
            const data = await response.json();
            
            if (data.success) {
                // Autocompleta los campos
                document.getElementById("nombre").value = data.nombre;
                document.getElementById("apellido").value = data.apellido;
            } else {
                // Limpia por si el DNI es nuevo
                document.getElementById("nombre").value = '';
                document.getElementById("apellido").value = '';
            }
        } catch (error) {
            console.error('Error al buscar paciente:', error);
        }
    }
}

// Función para poner la fecha y hora actual por defecto
document.addEventListener("DOMContentLoaded", () => {
    const horarioInput = document.getElementById("horario");
    const ahora = new Date();
    
    // Ajustamos la zona horaria (esto es clave en JavaScript)
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    
    // Formateamos a 'YYYY-MM-DDTHH:MM'
    const valorPorDefecto = ahora.toISOString().slice(0, 16);
    horarioInput.value = valorPorDefecto;
});

// Función simple de confirmación
function mostrarMensajeExito() {
    alert("Paciente cargado con éxito");
    return true; // Permite que el formulario se envíe
}