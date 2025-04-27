const db = require('../config/db');

const Admin = {
  // Obtener todos los usuarios
  getAllUsers: async () => {
    try {
      const [rows] = await db.query(
        'SELECT id_usuario, nombre, email, id_rol, fecha_registro, image FROM usuarios'
      );
      return rows;
    } catch (err) {
      console.error('[ERROR] Fallo al obtener usuarios:', err.message);
      throw err;
    }
  },

  // Obtener un usuario por ID
  getUserById: async (id) => {
    try {
      const [rows] = await db.query(
        'SELECT id_usuario, nombre, email, id_rol, fecha_registro, image FROM usuarios WHERE id_usuario = ?',
        [id]
      );
      return rows[0];
    } catch (err) {
      console.error('[ERROR] Fallo al obtener usuario por ID:', err.message);
      throw err;
    }
  },

  // Actualizar un usuario
  updateUser: async (id, userData) => {
    try {
      const { nombre, email, id_rol, image } = userData;
      let query;
      let params;

      if (image) {
        query = 'UPDATE usuarios SET nombre = ?, email = ?, id_rol = ?, image = ? WHERE id_usuario = ?';
        params = [nombre, email, id_rol, image, id];
      } else {
        query = 'UPDATE usuarios SET nombre = ?, email = ?, id_rol = ? WHERE id_usuario = ?';
        params = [nombre, email, id_rol, id];
      }

      const [result] = await db.query(query, params);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('[ERROR] Fallo al actualizar usuario:', err.message);
      throw err;
    }
  },

  // Cambiar contraseña de un usuario
  changePassword: async (id, hashedPassword) => {
    try {
      const [result] = await db.query(
        'UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?',
        [hashedPassword, id]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('[ERROR] Fallo al cambiar contraseña:', err.message);
      throw err;
    }
  },

  // Eliminar un usuario
  deleteUser: async (id) => {
    try {
      const [result] = await db.query(
        'DELETE FROM usuarios WHERE id_usuario = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('[ERROR] Fallo al eliminar usuario:', err.message);
      throw err;
    }
  },

  // Verificar si existe un email (excluyendo un ID específico)
  checkEmailExists: async (email, excludeId = null) => {
    try {
      let query = 'SELECT id_usuario FROM usuarios WHERE email = ?';
      let params = [email];
      
      if (excludeId) {
        query += ' AND id_usuario != ?';
        params.push(excludeId);
      }
      
      const [rows] = await db.query(query, params);
      return rows.length > 0;
    } catch (err) {
      console.error('[ERROR] Fallo al verificar email:', err.message);
      throw err;
    }
  },

  // Obtener estadísticas de usuarios
  getUserStats: async () => {
    try {
      const [totalUsers] = await db.query('SELECT COUNT(*) as total FROM usuarios');
      const [adminUsers] = await db.query('SELECT COUNT(*) as total FROM usuarios WHERE id_rol = 1');
      const [regularUsers] = await db.query('SELECT COUNT(*) as total FROM usuarios WHERE id_rol = 2');
      
      return {
        total: totalUsers[0].total,
        admins: adminUsers[0].total,
        regulares: regularUsers[0].total
      };
    } catch (err) {
      console.error('[ERROR] Fallo al obtener estadísticas de usuarios:', err.message);
      throw err;
    }
  }
};

module.exports = Admin;