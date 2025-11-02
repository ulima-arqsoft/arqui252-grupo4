import express from "express";

const app = express();
const PORT = 3002;

// Función para simular retraso de red
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Microservicio: Catálogo de Productos (CP) ---
// (Como dice tu doc: GET /products/{productId})
app.get("/products/:id", async (req, res) => {
  console.log("Fake-Service: Recibida llamada a Catálogo de Productos (CP)");
  await wait(400); // Simula 400ms de latencia
  res.json({
    id: req.params.id,
    title: "GameVault: El Juego",
    description: "Una aventura increíble.",
    price: 59.99,
    images: ["img1.jpg", "img2.jpg"],
  });
});

// --- Microservicio: Comunidad y Reseñas (CR) ---
// (Como dice tu doc: GET /reviews?productId=...)
app.get("/reviews", async (req, res) => {
  console.log("Fake-Service: Recibida llamada a Comunidad y Reseñas (CR)");
  const { productId } = req.query;
  await wait(700); // Simula 700ms de latencia (es más lento a propósito)
  
  if (!productId) {
    return res.status(400).json({ error: "productId es requerido" });
  }

  res.json({
    productId: productId,
    reviews: [
      { user: "User123", rating: 5, comment: "¡Genial!" },
      { user: "PlayerX", rating: 4, comment: "Muy bueno." },
    ],
  });
});

app.listen(PORT, () => {
  console.log(`Fake-services (CP y CR) corriendo en http://localhost:${PORT}`);
});