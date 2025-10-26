const express = require('express');
const app = express();
const PORT = 3001;

app.get('/users/me/profile', (req, res) => {
  console.log('Profile service received GET /users/me/profile');
  res.json({
    name: "Ana",
    email: "ana@example.com",
    memberSince: "2024-01-15"
  });
});

app.listen(PORT, () => {
  console.log(`Profile Service listening on port ${PORT}`);
});