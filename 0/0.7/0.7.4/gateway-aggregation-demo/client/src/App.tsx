import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import './index.css'; // Importa nuestros estilos

// --- Componente para el demo "ANTES" ---
function DemoAntes() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setData(null);
    const startTime = performance.now();
    
    // El cliente hace 2 llamadas y las combina
    const [productRes, reviewsRes] = await Promise.all([
      fetch("/api/products/1"),
      fetch("/api/reviews?productId=1&limit=5")
    ]);

    const [product, reviews] = await Promise.all([
      productRes.json(),
      reviewsRes.json()
    ]);
    
    setData({ product, community: reviews });
    setLoading(false);
    setTime(performance.now() - startTime);
  };

  return (
    <div>
      <h2>Página de Producto (Render "Antes")</h2>
      <p>Abre F12 (Network). Verás <strong>2 solicitudes</strong> separadas: <code>/api/products</code> (400ms) y <code>/api/reviews</code> (700ms).</p>
      <button onClick={fetchData} disabled={loading}>
        {loading ? "Cargando..." : "Cargar Página (LENTO)"}
      </button>
      {time > 0 && <p><strong>Tiempo de carga total: {time.toFixed(0)} ms</strong></p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

// --- Componente para el demo "DESPUÉS" ---
function DemoDespues() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setData(null);
    const startTime = performance.now();

    // El cliente hace 1 SOLA llamada
    const res = await fetch("/api/aggregated-product-details/1");
    const aggregatedData = await res.json();
    
    setData(aggregatedData);
    setLoading(false);
    setTime(performance.now() - startTime);
  };

  return (
    <div>
      <h2>Página de Producto (Render "Después" con Gateway)</h2>
      <p>Abre F12 (Network). Verás <strong>1 SOLA solicitud</strong>: <code>/api/aggregated-product-details</code>.</p>
      <p>El cliente hace 1 llamada, no 2. La lógica de agregación está en el backend, simplificando el cliente y reduciendo la "parlanchanería" (chattiness) de la red.</p>
      <button onClick={fetchData} disabled={loading}>
        {loading ? "Cargando..." : "Cargar Página (RÁPIDO)"}
      </button>
      {time > 0 && <p><strong>Tiempo de carga total: {time.toFixed(0)} ms</strong></p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

// --- Router Principal ---
function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/antes">Demo "Antes"</Link>
        <Link to="/despues">Demo "Después" (con Gateway)</Link>
      </nav>
      <div className="content">
        <Routes>
          <Route path="/antes" element={<DemoAntes />} />
          <Route path="/despues" element={<DemoDespues />} />
          <Route path="/" element={<h1>Demo: Gateway Aggregation (GameVault)</h1>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;