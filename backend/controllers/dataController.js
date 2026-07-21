import Medicine from '../models/Medicine.js';
import AdherenceLog from '../models/AdherenceLog.js';
import User from '../models/User.js';
import PharmacyRequest from '../models/PharmacyRequest.js';
import AuditLog from '../models/AuditLog.js';
import SymptomLog from '../models/SymptomLog.js';
import { calculateAdherenceMetrics, checkDrugInteractions } from '../services/analyticsService.js';
import { sendMail } from '../services/emailService.js';
import mongoose from 'mongoose';

// @desc    Retrieve all medicines for user
// @route   GET /api/data/medicines
export const getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ userId: req.user.id });
    res.status(200).json({ success: true, medicines });
  } catch (error) {
    next(error);
  }
};

export const addMedicine = async (req, res, next) => {
  const {
    name, totalQuantity, currentQuantity, unit, dosesPerDay, timeOfDay, scheduleDays,
    dosageStrength, foodAssociation, specialInstructions, reminderTime, startDate, endDate,
    prescribedDoctor, purpose, refillThreshold, rxNumber,
    pillShape, pillColor, refillsRemaining, pharmacyPhone, pharmacyEmail
  } = req.body;

  try {
    const existingMedicines = await Medicine.find({ userId: req.user.id });
    const interactions = checkDrugInteractions(name, existingMedicines);

    if (interactions.length > 0 && !req.body.ignoreWarnings) {
      return res.status(409).json({
        success: false,
        message: 'Drug interaction detected',
        interactions,
        requiresConfirmation: true
      });
    }

    const med = await Medicine.create({
      userId: req.user.id,
      name,
      totalQuantity,
      currentQuantity,
      unit,
      dosesPerDay,
      timeOfDay,
      scheduleDays,
      dosageStrength,
      foodAssociation,
      specialInstructions,
      reminderTime,
      startDate,
      endDate,
      prescribedDoctor,
      purpose,
      refillThreshold,
      rxNumber,
      pillShape,
      pillColor,
      refillsRemaining,
      pharmacyPhone,
      pharmacyEmail
    });

    await AuditLog.create({
      userId: req.user.id,
      action: 'ADD_MEDICINE',
      resourceType: 'Medicine',
      resourceId: med._id,
      details: { name }
    });

    res.status(201).json({ success: true, medicine: med });
  } catch (error) {
    next(error);
  }
};

export const updateMedicine = async (req, res, next) => {
  try {
    let med = await Medicine.findOne({ _id: req.params.id, userId: req.user.id });
    if (!med) {
      const err = new Error('Medicine record not found.');
      err.statusCode = 404;
      return next(err);
    }

    const previousQty = med.currentQuantity;
    const previousRefills = med.refillsRemaining;

    // Check if the update is restocking the medicine
    const isRestocking = req.body.currentQuantity === med.totalQuantity && previousQty < med.totalQuantity;

    if (isRestocking && previousRefills <= 0) {
      const err = new Error('Refill failed: No refills remaining on prescription.');
      err.statusCode = 400;
      return next(err);
    }

    let refillsRemaining = req.body.refillsRemaining;
    if (isRestocking && refillsRemaining === undefined) {
      refillsRemaining = Math.max(0, previousRefills - 1);
    }

    med = await Medicine.findByIdAndUpdate(
      req.params.id,
      { ...req.body, ...(refillsRemaining !== undefined ? { refillsRemaining } : {}), lastUpdated: Date.now() },
      { new: true }
    );

    // If stock has been refilled (currentQuantity goes from low to full capacity)
    if (med.currentQuantity === med.totalQuantity && previousQty < med.totalQuantity) {
      const user = await User.findById(req.user.id);
      if (user && user.email && user.notificationPreference !== 'None') {
        await sendMail({
          to: user.email,
          subject: `✅ Trulicare Confirmation: Refill Processed for ${med.name}`,
          text: `Hello ${user.name || 'User'},\n\nSuccess: Your refill for ${med.name} was processed successfully.\nYour inventory is now fully restocked to ${med.totalQuantity} ${med.unit}.\nRefills remaining: ${med.refillsRemaining}.\n\nBest regards,\nYour Trulicare Health Assistant`
        });
      }
    }

    res.status(200).json({ success: true, medicine: med });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a medicine and its compliance log history
// @route   DELETE /api/data/medicines/:id
export const deleteMedicine = async (req, res, next) => {
  try {
    const med = await Medicine.findOne({ _id: req.params.id, userId: req.user.id });
    if (!med) {
      const err = new Error('Medicine record not found.');
      err.statusCode = 404;
      return next(err);
    }

    await Medicine.findByIdAndDelete(req.params.id);
    await AdherenceLog.deleteMany({ medicineId: req.params.id, userId: req.user.id });
    res.status(200).json({ success: true, message: 'Medicine and logs cleared.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get adherence logs
// @route   GET /api/data/logs
export const getLogs = async (req, res, next) => {
  try {
    const logs = await AdherenceLog.find({ userId: req.user.id }).sort({ timestamp: 1 });
    res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

// Helper to check dose intake status and send corresponding email notifications
const checkAndSendDoseAlerts = async (userId, status, medicineId, medicineName, date, timeOfDay, note) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Registered User Dose Alert Email Dispatch
    if (user.email && (status === 'missed' || status === 'skipped') && user.notificationPreference !== 'None') {
      const statusText = status === 'missed' ? 'missed' : 'skipped';
      await sendMail({
        to: user.email,
        subject: `⚠️ Trulicare Dose Alert: Dose ${statusText.toUpperCase()} - ${medicineName}`,
        text: `Hello ${user.name || 'User'},\n\nThis is an automated dose alert from Trulicare.\nYour dose of ${medicineName} (${timeOfDay} dose) on ${date} was recorded as ${statusText.toUpperCase()}.\n\nNote/Symptoms: ${note || 'None logged'}.\n\nPlease update your health log if you take this dose later.\n\nBest regards,\nYour Trulicare Assistant`
      });
    }

    if (medicineId && user.email && user.notificationPreference !== 'None') {
      const med = await Medicine.findById(medicineId);
      if (med) {
        if (med.currentQuantity === 0) {
          await sendMail({
            to: user.email,
            subject: `⚠️ Trulicare Stock Alert: ${med.name} is OUT OF STOCK`,
            text: `Hello ${user.name || 'User'},\n\nWarning: Your inventory for ${med.name} is completely empty (0 ${med.unit} remaining).\n\nPlease process a refill immediately to avoid missing future scheduled doses.\n\nBest regards,\nYour Trulicare Health Assistant`
          });
        } else if (med.currentQuantity < (med.refillThreshold !== undefined ? med.refillThreshold : 5)) {
          await sendMail({
            to: user.email,
            subject: `⚠️ Trulicare Stock Warning: ${med.name} is running low`,
            text: `Hello ${user.name || 'User'},\n\nWarning: Your stock for ${med.name} is running low. Only ${med.currentQuantity} ${med.unit} remaining.\n\nWe recommend refilling your stock soon.\n\nBest regards,\nYour Trulicare Health Assistant`
          });
        }
      }
    }
  } catch (err) {
    console.error('[Notification Trigger] Error sending alerts:', err);
  }
};

// @desc    Log a new dose intake status
// @route   POST /api/data/logs
export const addLog = async (req, res, next) => {
  const { medicineId, medicineName, date, timeOfDay, status, note } = req.body;

  try {
    const existingLog = await AdherenceLog.findOne({
      userId: req.user.id,
      medicineId,
      date,
      timeOfDay
    });

    if (existingLog) {
      const err = new Error('This dose slot has already been logged.');
      err.statusCode = 409;
      return next(err);
    }

    const log = await AdherenceLog.create({
      userId: req.user.id,
      medicineId,
      medicineName,
      date,
      timeOfDay,
      status,
      note: note || ''
    });

    if (status === 'taken') {
      await Medicine.updateOne(
        { _id: medicineId, userId: req.user.id, currentQuantity: { $gt: 0 } },
        {
          $inc: { currentQuantity: -1 },
          $set: { lastUpdated: new Date() }
        }
      );
    }

    // Trigger dose & stock depletion email warnings asynchronously
    checkAndSendDoseAlerts(req.user.id, status, medicineId, medicineName, date, timeOfDay, note).catch(err => console.error('[Notification Trigger Error]:', err));

    res.status(201).json({ success: true, log });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a past log status (and adjust inventory stock)
// @route   PUT /api/data/logs/:id
export const updateLog = async (req, res, next) => {
  const { status, note } = req.body;

  try {
    if (status && !['taken', 'missed', 'skipped'].includes(status)) {
      const err = new Error('Invalid log status.');
      err.statusCode = 400;
      return next(err);
    }

    const log = await AdherenceLog.findOne({ _id: req.params.id, userId: req.user.id });
    if (!log) {
      const err = new Error('Log record not found.');
      err.statusCode = 404;
      return next(err);
    }

    let noteUpdated = false;
    if (note !== undefined && note !== log.note) {
      log.note = note;
      noteUpdated = true;
    }

    const oldStatus = log.status;
    const targetStatus = status || oldStatus;

    if (oldStatus !== targetStatus) {
      if (oldStatus === 'taken' && targetStatus !== 'taken') {
        await Medicine.updateOne(
          { _id: log.medicineId, userId: req.user.id },
          {
            $inc: { currentQuantity: 1 },
            $set: { lastUpdated: new Date() }
          }
        );
      } else if (oldStatus !== 'taken' && targetStatus === 'taken') {
        await Medicine.updateOne(
          { _id: log.medicineId, userId: req.user.id, currentQuantity: { $gt: 0 } },
          {
            $inc: { currentQuantity: -1 },
            $set: { lastUpdated: new Date() }
          }
        );
      }

      log.status = targetStatus;
    }

    if (oldStatus !== targetStatus || noteUpdated) {
      await log.save();
    }

    // Trigger dose & stock warnings on status changes
    checkAndSendDoseAlerts(req.user.id, targetStatus, log.medicineId, log.medicineName, log.date, log.timeOfDay, log.note).catch(err => console.error('[Notification Trigger Error]:', err));

    res.status(200).json({ success: true, log });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Undo a log entry (restoring stock if it was marked taken)
// @route   DELETE /api/data/logs/:id
export const deleteLog = async (req, res, next) => {
  try {
    const log = await AdherenceLog.findOne({ _id: req.params.id, userId: req.user.id });
    if (!log) {
      const err = new Error('Log record not found.');
      err.statusCode = 404;
      return next(err);
    }

    if (log.status === 'taken') {
      await Medicine.updateOne(
        { _id: log.medicineId, userId: req.user.id },
        {
          $inc: { currentQuantity: 1 },
          $set: { lastUpdated: new Date() }
        }
      );
    }

    await AdherenceLog.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.status(200).json({ success: true, message: 'Log entry deleted successfully.' });
  } catch (error) {
    next(error);
  }
};


// @desc    Retrieve computed server-side analytics metrics
// @route   GET /api/data/analytics
export const getAnalytics = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ userId: req.user.id });
    const logs = await AdherenceLog.find({ userId: req.user.id }).sort({ timestamp: 1 });

    const timezoneOffset = req.query.timezoneOffset !== undefined ? parseInt(req.query.timezoneOffset) : 0;
    const analytics = calculateAdherenceMetrics(logs, medicines, timezoneOffset);
    res.status(200).json({ success: true, analytics });
  } catch (error) {
    next(error);
  }
};

export const dispatchPharmacyRequest = async (req, res, next) => {
  const { medicineId, medicineName, rxNumber, pharmacyPhone, pharmacyEmail, prescribedDoctor, patientName } = req.body;
  try {
    let finalPharmacyEmail = pharmacyEmail || '';

    // If pharmacy email is missing, lookup medicine details
    if (!finalPharmacyEmail && medicineId && mongoose.Types.ObjectId.isValid(medicineId)) {
      const med = await Medicine.findById(medicineId);
      if (med && med.pharmacyEmail) {
        finalPharmacyEmail = med.pharmacyEmail;
      }
    }

    const pr = await PharmacyRequest.create({
      userId: req.user.id,
      medicineId: medicineId || new mongoose.Types.ObjectId(),
      medicineName,
      rxNumber,
      pharmacyPhone,
      pharmacyEmail: finalPharmacyEmail,
      prescribedDoctor,
      patientName
    });

    await AuditLog.create({
      userId: req.user.id,
      action: 'DISPATCH_PHARMACY_REQUEST',
      resourceType: 'PharmacyRequest',
      resourceId: pr._id,
      details: { medicineName }
    });

    const user = await User.findById(req.user.id);

    // 1. Dispatch refill order email directly to the Pharmacy
    if (finalPharmacyEmail) {
      await sendMail({
        to: finalPharmacyEmail,
        subject: `🏥 Urgent Medication Refill Order (Rx: ${rxNumber || 'N/A'}) - Patient: ${patientName}`,
        text: `Dear Pharmacist,\n\nPlease process a prescription refill dispatch for the following patient:\n\n` +
          `Patient Name: ${patientName}\n` +
          `Medication Name: ${medicineName}\n` +
          `Rx Number: ${rxNumber || 'N/A'}\n` +
          `Prescribed Doctor: Dr. ${prescribedDoctor || 'N/A'}\n\n` +
          `Please contact the patient or caregiver at ${user ? user.email : 'their registered account'} when ready.\n\n` +
          `Best regards,\nTrulicare Automated Pharmacy Services`
      });
    }

    // 2. Dispatch receipt to the Patient
    if (user && user.email) {
      await sendMail({
        to: user.email,
        subject: `📋 Refill Dispatch Receipt: ${medicineName}`,
        text: `Hello ${user.name},\n\nWe have successfully dispatched a refill request to your pharmacy (${finalPharmacyEmail || 'unspecified email'}).\n\n` +
          `Details:\n` +
          `- Medication: ${medicineName}\n` +
          `- Rx Number: ${rxNumber || 'N/A'}\n` +
          `- Pharmacy Phone: ${pharmacyPhone || 'N/A'}\n\n` +
          `You will receive an alert once the pharmacist processes it.\n\nBest regards,\nTrulicare Assistant`
      });
    }

    res.status(200).json({ success: true, message: 'Pharmacy refill request logged and dispatched.' });
  } catch (error) {
    next(error);
  }
};

export const getPharmacyRequests = async (req, res, next) => {
  try {
    // If pharmacist, get all. If patient, get only theirs.
    const user = await User.findById(req.user.id);
    let filter = {};
    if (user.role === 'Patient') {
      filter.userId = req.user.id;
    }
    const requests = await PharmacyRequest.find(filter).sort({ requestedAt: -1 });
    res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

export const updatePharmacyRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const request = await PharmacyRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = status;
    if (status === 'Fulfilled') {
      request.fulfilledAt = new Date();
    }
    await request.save();

    await AuditLog.create({
      userId: req.user.id,
      action: 'UPDATE_PHARMACY_REQUEST_STATUS',
      resourceType: 'PharmacyRequest',
      resourceId: request._id,
      details: { newStatus: status }
    });

    res.status(200).json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset all medicines and logs for user
// @route   POST /api/data/reset
export const resetUserData = async (req, res, next) => {
  try {
    await Medicine.deleteMany({ userId: req.user.id });
    await AdherenceLog.deleteMany({ userId: req.user.id });
    res.status(200).json({ success: true, message: 'All medicines and logs cleared successfully.' });
  } catch (error) {
    next(error);
  }
};



// @desc    Subscribe device to web push notifications
// @route   POST /api/data/push/subscribe
export const subscribeDevice = async (req, res, next) => {
  const { subscription } = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    const err = new Error('Invalid subscription data.');
    err.statusCode = 400;
    return next(err);
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      return next(err);
    }

    const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Subscribed to push notifications.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Unsubscribe device from web push notifications
// @route   POST /api/data/push/unsubscribe
export const unsubscribeDevice = async (req, res, next) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    const err = new Error('Endpoint is required.');
    err.statusCode = 400;
    return next(err);
  }

  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { pushSubscriptions: { endpoint } }
    });
    res.status(200).json({ success: true, message: 'Unsubscribed from push notifications.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Snooze medicine reminders for 15 minutes
// @route   POST /api/data/medicines/:id/snooze
export const snoozeMedicine = async (req, res, next) => {
  try {
    const med = await Medicine.findOne({ _id: req.params.id, userId: req.user.id });
    if (!med) {
      const err = new Error('Medication not found.');
      err.statusCode = 404;
      return next(err);
    }

    med.snoozedUntil = new Date(Date.now() + 15 * 60 * 1000);
    await med.save();

    await AuditLog.create({
      userId: req.user.id,
      action: 'SNOOZE_MEDICINE',
      resourceType: 'Medicine',
      resourceId: med._id,
      details: { medicineName: med.name, snoozedUntil: med.snoozedUntil }
    });

    res.status(200).json({ success: true, message: 'Medication reminders snoozed for 15 minutes.', snoozedUntil: med.snoozedUntil });
  } catch (error) {
    next(error);
  }
};

// @desc    Export calendar schedule as .ics file
// @route   GET /api/data/calendar/export
export const exportCalendar = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ userId: req.user.id });

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Trulicare//Medication Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const dayMapping = {
      'Monday': 'MO',
      'Tuesday': 'TU',
      'Wednesday': 'WE',
      'Thursday': 'TH',
      'Friday': 'FR',
      'Saturday': 'SA',
      'Sunday': 'SU'
    };

    medicines.forEach(med => {
      let hours = 8;
      let minutes = 0;
      if (med.reminderTime) {
        const match = med.reminderTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          hours = parseInt(match[1]);
          minutes = parseInt(match[2]);
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
        }
      }

      const timeStr = `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00`;

      const byDays = med.scheduleDays && med.scheduleDays.length > 0
        ? med.scheduleDays.map(d => dayMapping[d]).filter(Boolean).join(',')
        : 'MO,TU,WE,TH,FR,SA,SU';

      const startDate = new Date();
      const dateStr = startDate.getFullYear() +
        (startDate.getMonth() + 1).toString().padStart(2, '0') +
        startDate.getDate().toString().padStart(2, '0');

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:med-${med._id}@healthstock.com`);
      icsContent.push(`DTSTAMP:${dateStr}T${timeStr}`);
      icsContent.push(`DTSTART:${dateStr}T${timeStr}`);
      icsContent.push(`SUMMARY:Take ${med.name} (${med.dosageStrength || ''})`);
      icsContent.push(`DESCRIPTION:Dose Quantity: ${med.dosesPerDay} ${med.unit} - Time: ${med.reminderTime}. Instructions: ${med.specialInstructions || 'None'}`);
      icsContent.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDays}`);
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="medication-schedule.ics"');
    res.status(200).send(icsContent.join('\r\n'));
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve symptom logs for user
// @route   GET /api/data/symptoms
export const getSymptomLogs = async (req, res, next) => {
  try {
    const logs = await SymptomLog.find({ userId: req.user.id }).sort({ date: -1 });
    res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update daily symptom log
// @route   POST /api/data/symptoms
export const addSymptomLog = async (req, res, next) => {
  const { date, severity, symptoms, bloodPressure, heartRate, notes } = req.body;
  try {
    let log = await SymptomLog.findOne({ userId: req.user.id, date });
    if (log) {
      log.severity = severity;
      log.symptoms = symptoms;
      log.bloodPressure = bloodPressure;
      log.heartRate = heartRate;
      log.notes = notes;
      await log.save();
    } else {
      log = await SymptomLog.create({
        userId: req.user.id,
        date,
        severity,
        symptoms,
        bloodPressure,
        heartRate,
        notes
      });
    }
    res.status(200).json({ success: true, log });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete symptom log
// @route   DELETE /api/data/symptoms/:id
export const deleteSymptomLog = async (req, res, next) => {
  try {
    const log = await SymptomLog.findOne({ _id: req.params.id, userId: req.user.id });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    await log.deleteOne();
    res.status(200).json({ success: true, message: 'Symptom log deleted successfully' });
  } catch (error) {
    next(error);
  }
};
