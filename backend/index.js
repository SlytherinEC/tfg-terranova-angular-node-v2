const express = require('express');
require('dotenv').config();
const app = express();

app.use(express.json());
app.use('/api/usuarios', require('./routes/usuarios'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
