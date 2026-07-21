import express from 'express';
import { 
  getMedicines, addMedicine, updateMedicine, deleteMedicine, 
  getLogs, addLog, updateLog, deleteLog, getAnalytics, dispatchPharmacyRequest, resetUserData,
  getPharmacyRequests, updatePharmacyRequestStatus, subscribeDevice, unsubscribeDevice,
  snoozeMedicine, exportCalendar, getSymptomLogs, addSymptomLog, deleteSymptomLog
} from '../controllers/dataController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateMedicine } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all endpoints in this router

// Analytics Route
router.get('/analytics', getAnalytics);

// Reset Route
router.post('/reset', resetUserData);

// Symptoms Routes
router.route('/symptoms')
  .get(getSymptomLogs)
  .post(addSymptomLog);

router.route('/symptoms/:id')
  .delete(deleteSymptomLog);

// Calendar Export Route
router.get('/calendar/export', exportCalendar);

// Web Push Subscriptions
router.post('/push/subscribe', subscribeDevice);
router.post('/push/unsubscribe', unsubscribeDevice);

// Refill & Calendar Routes
router.route('/pharmacy-requests')
  .get(getPharmacyRequests)
  .post(dispatchPharmacyRequest);

router.put('/pharmacy-requests/:id', updatePharmacyRequestStatus);

// Medicines Routes
router.post('/medicines/:id/snooze', snoozeMedicine);

router.route('/medicines')
  .get(getMedicines)
  .post(validateMedicine, addMedicine);

router.route('/medicines/:id')
  .put(validateMedicine, updateMedicine)
  .delete(deleteMedicine);

// Logs Routes
router.route('/logs')
  .get(getLogs)
  .post(addLog);

router.route('/logs/:id')
  .put(updateLog)
  .delete(deleteLog);

export default router;
