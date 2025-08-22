const mongoose = require('mongoose');
const validator = require('validator');

const consultationSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Le patient est obligatoire'],
    validate: {
      validator: async function(v) {
        // Vérifie que le patient existe et est actif
        const patient = await mongoose.model('Patient').findOne({ _id: v, estActif: true });
        return !!patient;
      },
      message: 'Patient introuvable ou compte désactivé'
    }
  },
  personnel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personnel',
    required: [true, 'Le personnel soignant est obligatoire'],
    validate: {
      validator: async function(v) {
        // Vérifie que le personnel existe et est actif
        const personnel = await mongoose.model('Personnel').findOne({ 
          _id: v, 
          estActif: true,
          poste: { $in: ['medecin', 'infirmier'] } // Seuls certains rôles peuvent faire des consultations
        });
        return !!personnel;
      },
      message: 'Personnel introuvable ou non autorisé'
    }
  },
  date: {
    type: Date,
    required: [true, 'La date est obligatoire'],
    validate: {
      validator: function(v) {
        // La date doit être entre aujourd'hui et dans 1 an maximum
        const aujourdhui = new Date();
        const dansUnAn = new Date();
        dansUnAn.setFullYear(aujourdhui.getFullYear() + 1);
        
        return v >= aujourdhui && v <= dansUnAn;
      },
      message: 'La date doit être entre aujourd\'hui et dans 1 an'
    }
  },
  duree: { // Ajout de la durée en minutes
    type: Number,
    required: true,
    min: [15, 'La durée minimum est de 15 minutes'],
    max: [120, 'La durée maximum est de 2 heures'],
    default: 30
  },
  diagnostic: {
    type: String,
    required: [true, 'Le diagnostic est obligatoire'],
    trim: true,
    minlength: [10, 'Le diagnostic doit contenir au moins 10 caractères'],
    maxlength: [500, 'Le diagnostic ne peut excéder 500 caractères']
  },
  prescription: { // Nouveau champ structuré pour les prescriptions
    medicaments: [{
      medicament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicament'
      },
      posologie: String,
      duree: String
    }],
    recommandations: [String]
  },
  statut: {
    type: String,
    enum: ['planifié', 'confirmé', 'en_cours', 'terminé', 'annulé'],
    default: 'planifié'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personnel',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v; // Ne pas inclure le champ version
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Index composites pour performances
consultationSchema.index({ patient: 1, statut: 1 });
consultationSchema.index({ personnel: 1, date: 1 });
consultationSchema.index({ date: 1, statut: 1 });

// Virtual pour calculer la date de fin automatiquement
consultationSchema.virtual('dateFin').get(function() {
  const dateFin = new Date(this.date);
  dateFin.setMinutes(dateFin.getMinutes() + this.duree);
  return dateFin;
});

// Middleware pour vérifier les conflits de planning
consultationSchema.pre('save', async function(next) {
  if (this.isModified('date') || this.isModified('personnel') || this.isModified('duree')) {
    const conflit = await mongoose.model('Consultation').findOne({
      personnel: this.personnel,
      date: { $lt: this.dateFin, $gte: this.date },
      _id: { $ne: this._id },
      statut: { $nin: ['annulé'] }
    });

    if (conflit) {
      throw new Error(`Conflit de planning avec la consultation ${conflit._id}`);
    }
  }
  next();
});

// Méthode pour annuler une consultation
consultationSchema.methods.annuler = function(raison, userId) {
  this.statut = 'annulé';
  this.annulePar = userId;
  this.raisonAnnulation = raison || 'Annulé par l\'utilisateur';
  return this.save();
};

module.exports = mongoose.model('Consultation', consultationSchema);