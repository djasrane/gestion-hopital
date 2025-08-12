const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const patientRoutes = require('./routes/patient.routes');
const consultationsRoutes = require('./routes/consultations');
const rendezvousRoutes = require('./routes/rendezvous');
const personnelsRoutes = require('./routes/personnels');
const medicamentsRoutes = require('./routes/medicaments');
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://127.0.0.1:27017/hopital')
  .then(() => console.log("Connecté avec Succes à MongoDB"))
  .catch(err => console.error(" Une Erreur MongoDB :", err));

// ROUTES
app.use('/api/patients', patientRoutes);
app.use('/api/personnels', personnelsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/rendezvous', rendezvousRoutes);
app.use('/api/medicaments', medicamentsRoutes);
app.use('/api/auth', authRoutes);

app.listen(3000, () => {
  console.log("Serveur démarré sur http://localhost:3000");
});
