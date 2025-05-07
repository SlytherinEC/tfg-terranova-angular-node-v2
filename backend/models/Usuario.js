// File: backend/models/Usuario.js
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
  },

  findById: async (id) => {
    try {
      const [rows] = await db.query(
        'SELECT id_usuario, nombre, email, id_rol, fecha_registro, image, contrasena FROM usuarios WHERE id_usuario = ?',
        [id]
      );
      return rows[0];
    } catch (err) {
      console.error('[ERROR] Fallo al buscar usuario por ID:', err.message);
      throw err;
    }
  },

  // Añadir este método al modelo Usuario.js
  actualizarPerfil: async (id_usuario, nombre, email) => {
    try {
      const [result] = await db.query(
        'UPDATE usuarios SET nombre = ?, email = ? WHERE id_usuario = ?',
        [nombre, email, id_usuario]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('[ERROR] Fallo al actualizar perfil:', err.message);
      throw err;
    }
  },

  // Añadir este método al modelo Usuario.js
  cambiarContrasena: async (id_usuario, hashedPassword) => {
    try {
      const [result] = await db.query(
        'UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?',
        [hashedPassword, id_usuario]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('[ERROR] Fallo al cambiar contraseña:', err.message);
      throw err;
    }
  },

};

module.exports = Usuario;
