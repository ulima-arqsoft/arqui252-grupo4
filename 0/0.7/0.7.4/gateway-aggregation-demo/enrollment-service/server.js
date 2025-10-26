const express = require('express');
const app = express();
const PORT = 3002;

app.get('/enrollments', (req, res) => {
  console.log('Enrollment service received GET /enrollments');
  // Simula devolver cursos solo para el usuario 'me'
  if (req.query.userId === 'me') {
    res.json([
      { courseId: "PY101", title: "Intro a Python", progress: 50 },
      { courseId: "JS201", title: "JavaScript Avanzado", progress: 25 }
    ]);
  } else {
    res.status(404).send('User not found');
  }
});

app.listen(PORT, () => {
  console.log(`Enrollment Service listening on port ${PORT}`);
});