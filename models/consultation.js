const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  personnel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personnel',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  diagnostic: {
    type: String,
    required: true
  },
  traitement: {
    type: String
  },
  remarques: {
    type: String
  }
});

module.exports = mongoose.model('Consultation', consultationSchema);
