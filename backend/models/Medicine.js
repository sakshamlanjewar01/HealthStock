import mongoose from 'mongoose';

const MedicineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  currentQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    default: 'Tablets'
  },
  dosesPerDay: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  timeOfDay: {
    type: String,
    required: true,
    default: 'Morning'
  },
  scheduleDays: {
    type: [String],
    default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },
  dosageStrength: {
    type: String,
    default: ''
  },
  foodAssociation: {
    type: String,
    enum: ['Before Food', 'With Food', 'After Food', 'Empty Stomach', 'None'],
    default: 'None'
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  reminderTime: {
    type: String,
    default: '08:00 AM'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  prescribedDoctor: {
    type: String,
    default: ''
  },
  purpose: {
    type: String,
    default: ''
  },
  refillThreshold: {
    type: Number,
    default: 5,
    min: 0
  },
  rxNumber: {
    type: String,
    default: ''
  },
  pillShape: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Liquid', 'Drops'],
    default: 'Tablet'
  },
  pillColor: {
    type: String,
    enum: ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'White'],
    default: 'White'
  },
  refillsRemaining: {
    type: Number,
    default: 0,
    min: 0
  },
  pharmacyPhone: {
    type: String,
    default: ''
  },
  pharmacyEmail: {
    type: String,
    default: ''
  },
  successRate: {
    type: Number,
    default: 100
  },
  snoozedUntil: {
    type: Date
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

MedicineSchema.index({ userId: 1 });

const Medicine = mongoose.model('Medicine', MedicineSchema);
export default Medicine;
