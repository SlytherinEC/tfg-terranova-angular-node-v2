//File: backend/controllers/usuarioController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { crearAccessToken, crearRefreshToken } = require('../utils/tokenUtils');

const registrarUsuario = async (req, res) => {

  console.log('[DEBUG] req.body:', req.body);

  try {
    const { nombre, email, contrasena } = req.body;

    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const existentePorNombre = await Usuario.findByNombre(nombre);
    if (existentePorNombre) {
      return res.status(409).json({ message: 'El nombre de usuario ya existe' });
    }

    const existentePorEmail = await Usuario.findByEmail(email);
    if (existentePorEmail) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const nuevoId = await Usuario.create(nombre, email, hashedPassword);
    res.status(201).json({ message: 'Usuario registrado', id: nuevoId });

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

const loginUsuario = async (req, res) => {
  try {
    const { email, contrasena } = req.body;
    const usuario = await Usuario.findByEmail(email);

    if (!usuario) return res.status(401).json({ message: 'Email o contraseña inválidos' });

    const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esValida) return res.status(401).json({ message: 'Email o contraseña inválidos' });

    const payload = {
      id_usuario: usuario.id_usuario,
      id_rol: usuario.id_rol
    };

    const accessToken = crearAccessToken(payload);
    const refreshToken = crearRefreshToken(payload);

    res.status(200).json({ accessToken, refreshToken });

  } catch (error) {
    console.error('Error en loginUsuario:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

const refrescarToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Token de refresco no proporcionado' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(403).json({ message: 'Token de refresco inválido' });
    }

    const newAccessToken = crearAccessToken({
      id_usuario: decoded.id_usuario,
      id_rol: decoded.id_rol
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Error al refrescar token:', error.message);
    return res.status(403).json({ message: 'Token de refresco inválido o expirado' });
  }
}

const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id_usuario); // nuevo método a crear
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener perfil de usuario' });
  }
};

const actualizarPerfil = async (req, res) => {
  const { id_usuario } = req.usuario; // Obtenido del token mediante middleware auth
  const { nombre, email } = req.body;

  try {
    // Validaciones básicas
    if (!nombre || !email) {
      return res.status(400).json({ message: 'Nombre y email son obligatorios' });
    }

    // Verificar que el email no esté en uso por otro usuario
    const usuarioExistente = await Usuario.findByEmail(email);
    if (usuarioExistente && usuarioExistente.id_usuario !== id_usuario) {
      return res.status(400).json({ message: 'El email ya está en uso por otro usuario' });
    }

    // Verificar que el nombre no esté en uso por otro usuario
    const nombreExistente = await Usuario.findByNombre(nombre);
    if (nombreExistente && nombreExistente.id_usuario !== id_usuario) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
    }

    // Actualizar el perfil utilizando un método del modelo Usuario
    const actualizado = await Usuario.actualizarPerfil(id_usuario, nombre, email);

    if (!actualizado) {
      return res.status(500).json({ message: 'Error al actualizar el perfil' });
    }

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Añadir al usuarioController.js
const cambiarContrasena = async (req, res) => {
  const { id_usuario } = req.usuario;
  const { contrasenaActual, nuevaContrasena } = req.body;

  try {
    // Validaciones
    if (!contrasenaActual || !nuevaContrasena) {
      return res.status(400).json({ message: 'La contraseña actual y la nueva son obligatorias' });
    }

    // Obtener usuario actual
    const usuario = await Usuario.findById(id_usuario);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar contraseña
    const actualizado = await Usuario.cambiarContrasena(id_usuario, hashedPassword);

    if (!actualizado) {
      return res.status(500).json({ message: 'Error al cambiar la contraseña' });
    }

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

module.exports = { registrarUsuario, loginUsuario, obtenerPerfil, actualizarPerfil, refrescarToken, cambiarContrasena };
