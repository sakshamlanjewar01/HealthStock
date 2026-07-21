import mongoose from 'mongoose';

const SymptomLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true
  },
  severity: {
    type: Number, // 1-10 severity slider scale
    default: 1
  },
  symptoms: {
    type: [String], // e.g. ["Dizziness", "Headache", "Nausea", "Fatigue", "Chest Pain"]
    default: []
  },
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  heartRate: Number,
  notes: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Set compound index to avoid duplicates and speed up range queries
SymptomLogSchema.index({ userId: 1, date: -1 }, { unique: true });

const SymptomLog = mongoose.model('SymptomLog', SymptomLogSchema);
export default SymptomLog;
