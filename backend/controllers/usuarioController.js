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
  const { id_usuario } = req.usuario;
  const { nombre, email } = req.body;
  try {
    await pool.query('UPDATE usuarios SET nombre = ?, email = ? WHERE id_usuario = ?', [nombre, email, id_usuario]);
    res.json({ mensaje: 'Perfil actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el perfil', error });
  }
}

module.exports = { registrarUsuario, loginUsuario, obtenerPerfil, actualizarPerfil, refrescarToken };
