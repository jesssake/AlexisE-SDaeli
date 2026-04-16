const db = require('../config/dbConfig');

exports.registrarUsuario = (tutor_nombre, tutor_email, tutor_telefono, tutor_password, nino_nombre, nino_condiciones, fecha_nacimiento) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO usuarios (tutor_nombre, tutor_email, tutor_telefono, tutor_password, nino_nombre, nino_condiciones, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [tutor_nombre, tutor_email, tutor_telefono, tutor_password, nino_nombre, nino_condiciones, fecha_nacimiento];

    db.query(query, values, (err, result) => {
      if (err) reject(err);
      else resolve({ message: 'Usuario registrado exitosamente', id: result.insertId });
    });
  });
};
