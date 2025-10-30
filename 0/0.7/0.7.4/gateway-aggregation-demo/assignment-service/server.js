const express = require('express');
const app = express();
const PORT = 3003;

app.get('/assignments', (req, res) => {
  console.log('Assignment service received GET /assignments');
  // Simula devolver tareas pendientes solo para el usuario 'me'
  if (req.query.userId === 'me' && req.query.status === 'pending') {
    res.json([
      { assignmentId: "QZ01", name: "Quiz 1 - Fundamentos", dueDate: "2025-11-15" },
      { assignmentId: "HW02", name: "Tarea 2 - Funciones", dueDate: "2025-11-22" }
    ]);
  } else {
    res.status(404).send('Assignments not found for criteria');
  }
});

app.listen(PORT, () => {
  console.log(`Assignment Service listening on port ${PORT}`);
});