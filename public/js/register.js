// GUARDIA DE SEGURIDAD
if (!localStorage.getItem('usuario_autorizado')) {
    window.location.href = '/login.html';
}

// 1. Función para buscar al paciente por DNI
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

                // Alerta pequeña (Toast) si encuentra al paciente
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.onmouseenter = Swal.stopTimer;
                        toast.onmouseleave = Swal.resumeTimer;
                    }
                });
                Toast.fire({
                    icon: 'success',
                    title: 'Paciente encontrado'
                });
                
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

// 2. Configuración de fecha y hora + Manejo del Formulario
document.addEventListener("DOMContentLoaded", () => {
    const horarioInput = document.getElementById("horario");
    const ahora = new Date();
    
    // Ajustamos la zona horaria
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    const valorPorDefecto = ahora.toISOString().slice(0, 16);
    horarioInput.value = valorPorDefecto;

    // 3. Manejo del envío con SweetAlert2
    const form = document.getElementById('form-registro');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Detenemos el envío real para mostrar la alerta

            // Mostramos la alerta linda
            Swal.fire({
                title: '¡Registrado!',
                text: 'El paciente fue cargado correctamente.',
                icon: 'success',
                confirmButtonText: 'Genial',
                confirmButtonColor: '#007bff',
                timer: 2000,
                timerProgressBar: true
            }).then((result) => {
                // Cuando termina la alerta, enviamos el formulario
                form.submit();
            });
        });
    }
});