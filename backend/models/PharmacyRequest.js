import mongoose from 'mongoose';

const PharmacyRequestSchema = new mongoose.Schema({
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
  rxNumber: {
    type: String,
    default: ''
  },
  pharmacyPhone: {
    type: String,
    default: ''
  },
  pharmacyEmail: {
    type: String,
    default: ''
  },
  prescribedDoctor: {
    type: String,
    default: ''
  },
  patientName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Fulfilled', 'Rejected'],
    default: 'Pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  fulfilledAt: {
    type: Date
  }
});

PharmacyRequestSchema.index({ userId: 1, requestedAt: -1 });

const PharmacyRequest = mongoose.model('PharmacyRequest', PharmacyRequestSchema);
export default PharmacyRequest;
