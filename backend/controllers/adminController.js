const Admin = require('../models/Admin');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');

// Obtener todos los usuarios
const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Admin.getAllUsers();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener la lista de usuarios' });
  }
};

// Obtener un usuario por ID
const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Admin.getUserById(id);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error al obtener datos del usuario' });
  }
};

// Crear un nuevo usuario
const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, contrasena, id_rol } = req.body;
    
    // Validaciones
    if (!nombre || !email || !contrasena || !id_rol) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    
    // Verificar si el correo ya existe
    const existeEmail = await Admin.checkEmailExists(email);
    
    if (existeEmail) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }
    
    // Verificar si el nombre ya existe
    const existeNombre = await Usuario.findByNombre(nombre);
    
    if (existeNombre) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
    }
    
    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);
    
    // Insertar usuario utilizando el modelo existente
    const id_usuario = await Usuario.create(nombre, email, hashedPassword, id_rol);
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      id_usuario
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
};

// Actualizar un usuario
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, id_rol, image } = req.body;
    
    // Validaciones
    if (!nombre || !email || !id_rol) {
      return res.status(400).json({ message: 'Nombre, email y rol son obligatorios' });
    }
    
    // Verificar si el usuario existe
    const existeUsuario = await Admin.getUserById(id);
    
    if (!existeUsuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar si el correo ya existe en otro usuario
    const existeEmail = await Admin.checkEmailExists(email, id);
    
    if (existeEmail) {
      return res.status(400).json({ message: 'El correo electrónico ya está en uso por otro usuario' });
    }
    
    // Verificar si el nombre ya existe en otro usuario (si ha cambiado)
    if (nombre !== existeUsuario.nombre) {
      const existeNombre = await Usuario.findByNombre(nombre);
      if (existeNombre) {
        return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
      }
    }
    
    // Actualizar usuario
    const actualizado = await Admin.updateUser(id, { nombre, email, id_rol, image });
    
    if (!actualizado) {
      return res.status(500).json({ message: 'No se pudo actualizar el usuario' });
    }
    
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
};

// Cambiar contraseña de usuario
const cambiarContrasena = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaContrasena } = req.body;
    
    if (!nuevaContrasena) {
      return res.status(400).json({ message: 'La nueva contraseña es obligatoria' });
    }
    
    // Verificar si el usuario existe
    const existeUsuario = await Admin.getUserById(id);
    
    if (!existeUsuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaContrasena, salt);
    
    // Actualizar contraseña
    const actualizado = await Admin.changePassword(id, hashedPassword);
    
    if (!actualizado) {
      return res.status(500).json({ message: 'No se pudo actualizar la contraseña' });
    }
    
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña' });
  }
};

// Eliminar un usuario
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el usuario existe
    const existeUsuario = await Admin.getUserById(id);
    
    if (!existeUsuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar que no se elimine a sí mismo
    if (parseInt(id) === req.usuario.id_usuario) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }
    
    // Eliminar usuario
    const eliminado = await Admin.deleteUser(id);
    
    if (!eliminado) {
      return res.status(500).json({ message: 'No se pudo eliminar el usuario' });
    }
    
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  }
};

// Obtener estadísticas de usuarios
const getEstadisticasUsuarios = async (req, res) => {
  try {
    const estadisticas = await Admin.getUserStats();
    res.json(estadisticas);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas de usuarios' });
  }
};

module.exports = {
  getUsuarios,
  getUsuarioById,
  crearUsuario,
  actualizarUsuario,
  cambiarContrasena,
  eliminarUsuario,
  getEstadisticasUsuarios
};