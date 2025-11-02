const express = require("express");
const app = express();

app.get("/api/ping", (req, res) => res.send("¡Backend activo!"));

app.listen(5000, () => console.log("✅ Backend escuchando en puerto 5000"));
