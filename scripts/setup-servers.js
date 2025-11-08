const fs = require('fs');
const path = require('path');

console.log("Configurando servidores modulares...");

const servers = [
  "servers/maestro-server.js",
  "servers/ninos-server.js"
];

servers.forEach(server => {
  if (fs.existsSync(server)) {
    console.log("✅ " + server + " - OK");
  } else {
    console.log("❌ " + server + " - NO ENCONTRADO");
  }
});

console.log("");
console.log("Comandos disponibles:");
console.log("   npm run servers:dev     - Servidor principal con nodemon");
console.log("   npm run dev             - Servidor + Angular (desarrollo)");
console.log("   npm run servers:maestro - Solo servidor maestro");
console.log("   npm run servers:ninos   - Solo servidor niños");
console.log("   npm run servers:all     - Todos los servidores");
console.log("");
console.log("URLs de los servidores:");
console.log("   Principal: http://localhost:3000");
console.log("   Maestro API: http://localhost:3000/api/maestro");
console.log("   Niños API: http://localhost:3000/api/ninos");
console.log("   Angular: http://localhost:4200");
