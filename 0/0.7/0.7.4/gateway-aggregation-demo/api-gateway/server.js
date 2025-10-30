const express = require('express');
const axios = require('axios');
const cors = require('cors'); // <-- Añadir esta línea

const app = express();
const PORT = 3000;

app.use(cors()); // <-- Añadir esta línea para habilitar CORS para todas las rutas

// URLs de los servicios internos... (igual que antes)
const PROFILE_SERVICE_URL = 'http://profile-service:3001/users/me/profile';
const ENROLLMENT_SERVICE_URL = 'http://enrollment-service:3002/enrollments?userId=me';
const ASSIGNMENT_SERVICE_URL = 'http://assignment-service:3003/assignments?userId=me&status=pending';

app.get('/dashboard-data', async (req, res) => {
  console.log('Received request for /dashboard-data');
  try {
    // ... (el resto del código de agregación sigue igual) ...
    const profilePromise = axios.get(PROFILE_SERVICE_URL);
    const enrollmentsPromise = axios.get(ENROLLMENT_SERVICE_URL);
    const assignmentsPromise = axios.get(ASSIGNMENT_SERVICE_URL);

    console.log('Dispatching requests to microservices...');
    const [profileRes, enrollmentsRes, assignmentsRes] = await Promise.all([
      profilePromise,
      enrollmentsPromise,
      assignmentsPromise
    ]);
    console.log('Received responses from microservices');

    const aggregatedData = {
      profile: profileRes.data,
      courses: enrollmentsRes.data,
      upcomingAssignments: assignmentsRes.data
    };

    console.log('Sending aggregated response');
    res.json(aggregatedData);

  } catch (error) {
    console.error('Error during aggregation:', error.message);
    res.status(500).json({ message: 'Error fetching dashboard data', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});