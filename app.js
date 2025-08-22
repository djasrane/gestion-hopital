require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import des routes
const patientRoutes = require('./routes/patient.routes');
const consultationsRoutes = require('./routes/consultations');
const rendezvousRoutes = require('./routes/rendezvous');
const personnelsRoutes = require('./routes/personnels');
const medicamentsRoutes = require('./routes/medicaments');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hopital')
  .then(() => console.log(" Connecté à MongoDB avec succès"))
  .catch(err => console.error("Erreur de connexion MongoDB:", err));

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/personnels', personnelsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/rendezvous', rendezvousRoutes);
app.use('/api/medicaments', medicamentsRoutes);
app.use('/api/auth', authRoutes);

// Gestion des erreurs
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint non trouvé' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(` Serveur démarré sur le port ${PORT}`);
});