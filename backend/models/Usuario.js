const db = require('../config/db');

const Usuario = {
  create: async (nombre, email, hashedPassword, id_rol = 2) => {
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, email, contrasena, id_rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hashedPassword, id_rol]
    );
    return result.insertId;
  },

  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0];
  }
};

module.exports = Usuario;
