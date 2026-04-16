const http = require('http');

console.log("Realizando health check a los servidores...");

const endpoints = [
  { name: "Servidor Principal", url: "http://localhost:3000/api/health" },
  { name: "API Maestro", url: "http://localhost:3000/api/maestro/estudiantes/total" },
  { name: "API Niños", url: "http://localhost:3000/api/ninos/" }
];

endpoints.forEach(endpoint => {
  const req = http.get(endpoint.url, (res) => {
    console.log("✅ " + endpoint.name + " - STATUS: " + res.statusCode);
  });

  req.on('error', (err) => {
    console.log("❌ " + endpoint.name + " - ERROR: " + err.message);
  });

  req.setTimeout(5000, () => {
    console.log("⏰ " + endpoint.name + " - TIMEOUT");
    req.destroy();
  });
});
