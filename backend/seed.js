import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// User Schema (basic version just to get the ID if needed)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});
const User = mongoose.model('User', UserSchema);

// Medicine Schema matching your implementation
const MedicineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  totalQuantity: { type: Number, required: true, min: 1 },
  currentQuantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, default: 'Tablets' },
  dosesPerDay: { type: Number, required: true, default: 1, min: 1 },
  timeOfDay: { type: String, required: true, default: 'Morning' },
  scheduleDays: { type: [String], default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
  dosageStrength: { type: String, default: '' },
  foodAssociation: { type: String, enum: ['Before Food', 'With Food', 'After Food', 'Empty Stomach', 'None'], default: 'None' },
  specialInstructions: { type: String, default: '' },
  reminderTime: { type: String, default: '08:00 AM' },
  startDate: { type: Date },
  endDate: { type: Date },
  prescribedDoctor: { type: String, default: '' },
  purpose: { type: String, default: '' },
  refillThreshold: { type: Number, default: 5, min: 0 },
  rxNumber: { type: String, default: '' },
  pillShape: { type: String, enum: ['Tablet', 'Capsule', 'Liquid', 'Drops'], default: 'Tablet' },
  pillColor: { type: String, enum: ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'White'], default: 'White' },
  refillsRemaining: { type: Number, default: 0, min: 0 },
  pharmacyPhone: { type: String, default: '' },
  successRate: { type: Number, default: 100 },
  lastUpdated: { type: Date, default: Date.now }
});

const Medicine = mongoose.model('Medicine', MedicineSchema);

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthstock');
    console.log('Connected to database.');

    // Get the first user to assign medicines
    const user = await User.findOne({});
    if (!user) {
      console.log('No user found in the database. Please register a user first.');
      process.exit(1);
    }

    const userId = user._id;

    // Remove existing medicines to have exactly 10
    await Medicine.deleteMany({ userId });
    console.log('Cleared existing medicines.');

    const seedData = [
      {
        userId,
        name: 'Lisinopril',
        totalQuantity: 30,
        currentQuantity: 28,
        unit: 'Tablets',
        dosesPerDay: 1,
        timeOfDay: 'Morning',
        dosageStrength: '10mg',
        foodAssociation: 'None',
        specialInstructions: 'Take with a full glass of water',
        reminderTime: '08:00 AM',
        startDate: new Date(),
        prescribedDoctor: 'Dr. Smith',
        purpose: 'Blood Pressure',
        refillThreshold: 5,
        rxNumber: 'RX123456',
        pillShape: 'Tablet',
        pillColor: 'White',
        refillsRemaining: 2,
        pharmacyPhone: '555-0100'
      },
      {
        userId,
        name: 'Metformin',
        totalQuantity: 60,
        currentQuantity: 50,
        unit: 'Tablets',
        dosesPerDay: 2,
        timeOfDay: 'Morning, Evening',
        dosageStrength: '500mg',
        foodAssociation: 'With Food',
        specialInstructions: 'Do not crush or chew',
        reminderTime: '09:00 AM',
        startDate: new Date(),
        prescribedDoctor: 'Dr. Jones',
        purpose: 'Diabetes',
        refillThreshold: 10,
        rxNumber: 'RX234567',
        pillShape: 'Tablet',
        pillColor: 'White',
        refillsRemaining: 1,
        pharmacyPhone: '555-0101'
      },
      {
        userId,
        name: 'Atorvastatin',
        totalQuantity: 30,
        currentQuantity: 4,
        unit: 'Tablets',
        dosesPerDay: 1,
        timeOfDay: 'Evening',
        dosageStrength: '20mg',
        foodAssociation: 'None',
        specialInstructions: 'Avoid grapefruit juice',
        reminderTime: '08:00 PM',
        startDate: new Date(),
        prescribedDoctor: 'Dr. Smith',
        purpose: 'Cholesterol',
        refillThreshold: 5,
        rxNumber: 'RX345678',
        pillShape: 'Tablet',
        pillColor: 'White',
        refillsRemaining: 0,
        pharmacyPhone: '555-0100'
      },
      {
        userId,
        name: 'Amoxicillin',
        totalQuantity: 20,
        currentQuantity: 14,
        unit: 'Capsules',
        dosesPerDay: 2,
        timeOfDay: 'Morning, Evening',
        dosageStrength: '250mg',
        foodAssociation: 'None',
        specialInstructions: 'Finish all medication',
        reminderTime: '08:00 AM',
        startDate: new Date(),
        prescribedDoctor: 'Dr. Adams',
        purpose: 'Infection',
        refillThreshold: 0,
        rxNumber: 'RX456789',
        pillShape: 'Capsule',
        pillColor: 'Yellow',
        refillsRemaining: 0,
        pharmacyPhone: '555-0102'
      },
      {
        userId,
        name: 'Omeprazole',
        totalQuantity: 30,
        currentQuantity: 15,
        unit: 'Capsules',
        dosesPerDay: 1,
        timeOfDay: 'Morning',
        dosageStrength: '20mg',
        foodAssociation: 'Before Food',
        specialInstructions: 'Take 30 mins before breakfast',
        reminderTime: '07:30 AM',
        startDate: new Date(),
        prescribedDoctor: 'Dr. Patel',
        purpose: 'Acid Reflux',
        refillThreshold: 5,
        rxNumber: 'RX567890',
        pillShape: 'Capsule',
        pillColor: 'Purple',
        refillsRemaining: 3,
        pharmacyPhone: '555-0101'
      },
      {
        userId,
        name: 'Albuterol Sulfate',
        totalQuantity: 1,
        currentQuantity: 1,
        unit: 'Inhaler',
        dosesPerDay: 2,
        timeOfDay: 'As Needed',
        dosageStrength: '90mcg',
        foodAssociation: 'None',
        specialInstructions: 'Use as needed for shortness of breath',
        reminderTime: '09:00 AM',
        startDate: new Date(),
        prescribedDoctor: 'Dr. Lee',
        purpose: 'Asthma',
        refillThreshold: 0,
        rxNumber: 'RX678901',
        pillShape: 'Liquid',
        pillColor: 'Blue',
        refillsRemaining: 1,
        pharmacyPhone: '555-0100'
      },
      {
        userId,
        name: 'Levothyroxine',
        totalQuantity: 90,
        currentQuantity: 85,
        unit: 'Tablets',
        dosesPerDay: 1,
        timeOfDay: 'Morning',
        dosageStrength: '50mcg',
        foodAssociation: 'Empty Stomach',
        specialInstructions: 'Take on empty stomach 1 hr before eating',
        reminderTime: '06:30 AM',
        startDate: new Date(),
        prescribedDoctor: 'Dr. Green',
        purpose: 'Thyroid',
        refillThreshold: 15,
        rxNumber: 'RX789012',
        pillShape: 'Tablet',
        pillColor: 'White',
        refillsRemaining: 2,
        pharmacyPhone: '555-0102'
      },
      {
        userId,
        name: 'Sertraline',
        totalQuantity: 30,
        currentQuantity: 3,
        unit: 'Tablets',
        dosesPerDay: 1,
        timeOfDay: 'Morning',
        dosageStrength: '50mg',
        foodAssociation: 'With Food',
        specialInstructions: 'May cause drowsiness',
        reminderTime: '08:00 AM',
        startDate: new Date(),
        prescribedDoctor: 'Dr. Taylor',
        purpose: 'Depression/Anxiety',
        refillThreshold: 5,
        rxNumber: 'RX890123',
        pillShape: 'Tablet',
        pillColor: 'Blue',
        refillsRemaining: 1,
        pharmacyPhone: '555-0101'
      },
      {
        userId,
        name: 'Amlodipine',
        totalQuantity: 30,
        currentQuantity: 20,
        unit: 'Tablets',
        dosesPerDay: 1,
        timeOfDay: 'Morning',
        dosageStrength: '5mg',
        foodAssociation: 'None',
        specialInstructions: 'Take at the same time daily',
        reminderTime: '08:00 AM',
        startDate: new Date(),
        prescribedDoctor: 'Dr. Smith',
        purpose: 'Blood Pressure',
        refillThreshold: 5,
        rxNumber: 'RX901234',
        pillShape: 'Tablet',
        pillColor: 'White',
        refillsRemaining: 4,
        pharmacyPhone: '555-0100'
      },
      {
        userId,
        name: 'Vitamin D3',
        totalQuantity: 60,
        currentQuantity: 30,
        unit: 'Capsules',
        dosesPerDay: 1,
        timeOfDay: 'Morning',
        dosageStrength: '2000 IU',
        foodAssociation: 'With Food',
        specialInstructions: 'Take with meal containing fat',
        reminderTime: '08:00 AM',
        startDate: new Date(),
        prescribedDoctor: 'Dr. Smith',
        purpose: 'Supplement',
        refillThreshold: 10,
        rxNumber: 'RX012345',
        pillShape: 'Capsule',
        pillColor: 'Yellow',
        refillsRemaining: 0,
        pharmacyPhone: '555-0100'
      }
    ];

    await Medicine.insertMany(seedData);
    console.log('Successfully seeded 10 medicines!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();
