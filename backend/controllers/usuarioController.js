const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, contrasena } = req.body;
    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const existente = await Usuario.findByEmail(email);
    if (existente) {
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
      { expiresIn: '2h' }
    );

    res.status(200).json({ token });

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

module.exports = { registrarUsuario, loginUsuario };
