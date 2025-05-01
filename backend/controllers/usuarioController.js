const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

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

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, id_rol: usuario.id_rol },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({ token });

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

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

module.exports = { registrarUsuario, loginUsuario, obtenerPerfil };
