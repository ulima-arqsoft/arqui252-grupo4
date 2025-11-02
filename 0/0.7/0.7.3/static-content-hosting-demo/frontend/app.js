document.getElementById("ping").addEventListener("click", async () => {
  try {
    const res = await fetch("http://localhost:5000/api/ping");
    const txt = await res.text();
    document.getElementById("result").innerText = "Respuesta API: " + txt;
  } catch (e) {
    document.getElementById("result").innerText = "Error: API no disponible";
  }
});
