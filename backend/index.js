const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Permitir peticiones desde el frontend
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

app.use(express.json());

app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/game', require('./routes/game'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
