const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

const soloAdmin = (req, res, next) => {
  if (req.usuario.id_rol !== 1) {
    return res.status(403).json({ message: 'Acceso solo para administradores' });
  }
  next();
};

module.exports = { verificarToken, soloAdmin };
