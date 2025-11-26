// C:\Codigos\HTml\gestion-educativa\backend\server.js
const app = require('./app');

const PORT = 3000;

app.listen(PORT, () => {
  console.log('==========================================');
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log('==========================================');
});
