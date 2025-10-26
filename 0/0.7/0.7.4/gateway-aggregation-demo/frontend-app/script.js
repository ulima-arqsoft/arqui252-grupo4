document.addEventListener('DOMContentLoaded', () => {
    const profileDiv = document.getElementById('profile');
    const coursesUl = document.getElementById('courses');
    const assignmentsUl = document.getElementById('assignments');

    // Limpiar mensajes iniciales de carga
    profileDiv.innerHTML = '<h2>Perfil</h2><p>Cargando...</p>';
    coursesUl.innerHTML = '<li>Cargando...</li>';
    assignmentsUl.innerHTML = '<li>Cargando...</li>';

    fetch('http://localhost:8080/dashboard-data') // Llama al API Gateway
        .then(response => {
            // Verifica si la respuesta HTTP fue exitosa
            if (!response.ok) {
                throw new Error(`Error HTTP! estado: ${response.status}`);
            }
            return response.json(); // Convierte la respuesta a JSON
        })
        .then(data => {
            // Actualizar Perfil
            profileDiv.innerHTML = `<h2>Perfil</h2><p>Nombre: ${data.profile.name}<br>Email: ${data.profile.email}</p>`;

            // Actualizar Cursos
            coursesUl.innerHTML = ''; // Limpiar mensaje de carga
            if (data.courses && data.courses.length > 0) {
                data.courses.forEach(course => {
                    const li = document.createElement('li');
                    li.textContent = `${course.title} (Progreso: ${course.progress}%)`;
                    coursesUl.appendChild(li);
                });
            } else {
                coursesUl.innerHTML = '<li>No hay cursos inscritos.</li>'; // Mensaje si no hay cursos
            }

            // Actualizar Tareas
            assignmentsUl.innerHTML = ''; // Limpiar mensaje de carga
            if (data.upcomingAssignments && data.upcomingAssignments.length > 0) {
                data.upcomingAssignments.forEach(assignment => {
                    const li = document.createElement('li');
                    li.textContent = `${assignment.name} (Vence: ${assignment.dueDate})`;
                    assignmentsUl.appendChild(li);
                });
            } else {
                assignmentsUl.innerHTML = '<li>No hay tareas pendientes.</li>'; // Mensaje si no hay tareas
            }
        })
        .catch(error => {
            // Manejo de errores (si falla la llamada fetch o la conversión a JSON)
            console.error('Error al obtener los datos del dashboard:', error);
            profileDiv.innerHTML = `<h2>Perfil</h2><p class="error-message">Error al cargar el perfil.</p>`;
            coursesUl.innerHTML = `<li><p class="error-message">Error al cargar los cursos.</p></li>`;
            assignmentsUl.innerHTML = `<li><p class="error-message">Error al cargar las tareas.</p></li>`;
        });
});