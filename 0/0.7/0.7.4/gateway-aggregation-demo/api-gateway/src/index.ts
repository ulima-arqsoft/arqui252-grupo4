import express from "express";
import axios from "axios"; // Para llamar a otros servicios
import cors from "cors"; // Para permitir llamadas desde el cliente

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

// URLs de los microservicios (vienen del docker-compose.yml)
const CP_URL = process.env.CP_SERVICE_URL;
const CR_URL = process.env.CR_SERVICE_URL;

// --- SECCIÓN "ANTES" (Para el demo "Sin Patrón") ---
// El cliente llama a estos 2 endpoints por separado.
// El gateway solo actúa como un proxy tonto.

app.get("/api/products/:id", async (req, res) => {
  console.log("Gateway: Recibida llamada 'ANTES' a /products");
  try {
    const response = await axios.get(`${CP_URL}/products/${req.params.id}`);
    res.json(response.data);
  } catch (e: any) { res.status(500).send(e.message); }
});

app.get("/api/reviews", async (req, res) => {
  console.log("Gateway: Recibida llamada 'ANTES' a /reviews");
  try {
    const response = await axios.get(`${CR_URL}/reviews`, { params: req.query });
    res.json(response.data);
  } catch (e: any) { res.status(500).send(e.message); }
});


// --- SECCIÓN "DESPUÉS" (El Patrón Gateway Aggregation) ---
// (Como dice tu documentación: GET /aggregated-product-details/{productId})

app.get("/api/aggregated-product-details/:id", async (req, res) => {
  console.log("Gateway: Recibida llamada 'DESPUÉS' (Agregada)");
  const { id } = req.params;

  try {
    // 1. Realizar llamadas EN PARALELO (como dice tu doc)
    const [productResponse, reviewsResponse] = await Promise.all([
      // Call al Catálogo de Productos (CP)
      axios.get(`${CP_URL}/products/${id}`),
      
      // Call a Comunidad y Reseñas (CR)
      axios.get(`${CR_URL}/reviews`, { 
        params: { productId: id, limit: 5, sortBy: 'date' } 
      })
    ]);

    // 2. Agregar los datos en una única estructura
    const aggregatedData = {
      product: productResponse.data,
      community: reviewsResponse.data
    };

    // 3. Devolver la respuesta consolidada
    res.json(aggregatedData);

  } catch (error) {
    console.error("Error en el Gateway Aggregation:", error);
    res.status(500).json({ message: "Error al agregar datos" });
  }
});

app.listen(PORT, () => {
  console.log(`GATEWAY Api-Gateway corriendo en http://localhost:${PORT}`);
});