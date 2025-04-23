const db = require('../config/db');

const Usuario = {
  create: async (nombre, email, hashedPassword, id_rol = 2) => {
    try {
      const [result] = await db.query(
        'INSERT INTO usuarios (nombre, email, contrasena, id_rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hashedPassword, id_rol]
      );
      return result.insertId;
    } catch (err) {
      console.error('[ERROR] Fallo al crear usuario:', err.message);
      throw err;
    }
  },

  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0];
  },

  findByNombre: async (nombre) => {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE nombre = ?', [nombre]);
    return rows[0];
  }

};

module.exports = Usuario;
