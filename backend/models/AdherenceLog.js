import mongoose from 'mongoose';

const AdherenceLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  medicineName: {
    type: String,
    required: true
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true
  },
  timeOfDay: {
    type: String, // Morning, Afternoon, Evening, Night, As Needed
    required: true
  },
  status: {
    type: String,
    enum: ['taken', 'missed', 'skipped'],
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Number,
    default: () => Date.now()
  }
});

AdherenceLogSchema.index({ userId: 1, date: -1 });
AdherenceLogSchema.index({ userId: 1, medicineId: 1, date: 1, timeOfDay: 1 }, { unique: true });

const AdherenceLog = mongoose.model('AdherenceLog', AdherenceLogSchema);
export default AdherenceLog;
