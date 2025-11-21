let porcentajeCanary = 30; // cambiar durante la demo: 30 → 50 → 80 → 100

document.getElementById("simular").addEventListener("click", () => {
  const lista = document.getElementById("resultados");
  lista.innerHTML = "";

  for (let i = 1; i <= 10; i++) {
    const random = Math.random() * 100;
    const version = random < porcentajeCanary ? "v2 (Green)" : "v1 (Blue)";
    const li = document.createElement("li");
    li.textContent = `Usuario ${i} → ${version}`;
    lista.appendChild(li);
  }
});
