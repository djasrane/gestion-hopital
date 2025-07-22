const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const patientRoutes = require('./routes/patient.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://127.0.0.1:27017/hopital')
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch(err => console.error("❌ Erreur MongoDB :", err));

app.use('/api/patients', patientRoutes);

app.listen(3000, () => {
  console.log("🚀 Serveur démarré sur http://localhost:3000");
});
