const mongoose = require('mongoose');
const validator = require('validator');

const rendezvousSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Le patient est obligatoire'],
    validate: {
      validator: async function(v) {
        const exists = await mongoose.model('Patient').exists({ _id: v });
        return exists;
      },
      message: 'Patient introuvable'
    }
  },
  personnelId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personnel',
    required: [true, 'Le personnel est obligatoire'],
    validate: {
      validator: async function(v) {
        const exists = await mongoose.model('Personnel').exists({ _id: v });
        return exists;
      },
      message: 'Personnel introuvable'
    }
  },
  date: {
    type: Date,
    required: [true, 'La date est obligatoire'],
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'La date doit être dans le futur'
    }
  },
  duree: {
    type: Number, // en minutes
    required: true,
    default: 30,
    min: [5, 'La durée minimum est 5 minutes'],
    max: [240, 'La durée maximum est 4 heures']
  },
  motif: {
    type: String,
    required: [true, 'Le motif est obligatoire'],
    trim: true,
    maxlength: [500, 'Le motif ne peut excéder 500 caractères']
  },
  status: {
    type: String,
    enum: {
      values: ['prévu', 'confirmé', 'annulé', 'terminé', 'absent'],
      message: 'Statut {VALUE} non supporté'
    },
    default: 'prévu'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Les notes ne peuvent excéder 1000 caractères']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'La raison ne peut excéder 500 caractères']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les recherches
rendezvousSchema.index({ patientId: 1, date: 1 });
rendezvousSchema.index({ personnelId: 1, date: 1 });
rendezvousSchema.index({ status: 1, date: 1 });

// Vérification des conflits de planning avant sauvegarde
rendezvousSchema.pre('save', async function(next) {
  if (this.isModified('date') || this.isModified('personnelId')) {
    const conflit = await mongoose.model('Rendezvous').findOne({
      personnelId: this.personnelId,
      date: {
        $lt: new Date(this.date.getTime() + this.duree * 60000),
        $gte: this.date
      },
      _id: { $ne: this._id },
      status: { $nin: ['annulé', 'absent'] }
    });

    if (conflit) {
      throw new Error('Conflit de planning avec un autre rendez-vous');
    }
  }
  next();
});

// Virtual pour la date de fin
rendezvousSchema.virtual('dateFin').get(function() {
  return new Date(this.date.getTime() + this.duree * 60000);
});

// Méthode pour annuler un rendez-vous
rendezvousSchema.methods.annuler = function(raison, userId) {
  this.status = 'annulé';
  this.cancellationReason = raison;
  this.updatedBy = userId;
  return this.save();
};

module.exports = mongoose.model('Rendezvous', rendezvousSchema);