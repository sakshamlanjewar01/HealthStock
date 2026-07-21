import cron from 'node-cron';
import Medicine from '../models/Medicine.js';
import User from '../models/User.js';
import AdherenceLog from '../models/AdherenceLog.js';
import { sendMail } from './emailService.js';
import { sendPushNotification } from './webPushService.js';
import { sendSMS, sendWhatsApp } from './twilioService.js';
import { generateAdherenceReportPDF } from './pdfReportService.js';

// Helper to subtract minutes from an "HH:MM AM/PM" string safely
const getOffsetTimeStr = (timeStr, offsetMinutes) => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  
  const d = new Date();
  d.setHours(hours);
  d.setMinutes(minutes - offsetMinutes);
  
  let h = d.getHours();
  let m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ap}`;
};

// Helper to get current time in a specific timezone in "HH:MM AM/PM" format
const getCurrentTimeStrInTimezone = (timezone) => {
  try {
    const options = {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    
    let hour = '12';
    let minute = '00';
    let dayPeriod = 'AM';
    
    parts.forEach(part => {
      if (part.type === 'hour') hour = part.value;
      if (part.type === 'minute') minute = part.value;
      if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
    });
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${dayPeriod}`;
  } catch (err) {
    const d = new Date();
    let h = d.getHours();
    let m = d.getMinutes();
    const ap = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ap}`;
  }
};

// Helper to get local date in a specific timezone in "YYYY-MM-DD" format
const getLocalDateStringInTimezone = (timezone) => {
  try {
    const options = {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    const formatter = new Intl.DateTimeFormat('fr-CA', options); // returns YYYY-MM-DD format
    return formatter.format(new Date());
  } catch (err) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

export const startCronJobs = () => {
  console.log('[Cron] Automated Pre-Alarm Notification Service initialized.');
  
  cron.schedule('* * * * *', async () => {
    try {
      const medicines = await Medicine.find({
        $or: [
          { reminderTime: { $exists: true, $ne: null } },
          { snoozedUntil: { $exists: true, $ne: null } }
        ]
      });
      
      for (const med of medicines) {
        const user = await User.findById(med.userId);
        if (!user) continue;

        const userTimezone = user.timezone || 'UTC';
        const currentTimeStr = getCurrentTimeStrInTimezone(userTimezone);
        const todayDateStr = getLocalDateStringInTimezone(userTimezone);

        // Date & Day validation checks (User's local time context)
        const localTimeString = new Date().toLocaleString('en-US', { timeZone: userTimezone });
        const userTime = new Date(localTimeString);
        const todayMidnight = new Date(userTime.getFullYear(), userTime.getMonth(), userTime.getDate());

        // A. Start Date constraint
        if (med.startDate) {
          const start = new Date(med.startDate);
          const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          if (todayMidnight < startMidnight) continue;
        }

        // B. End Date constraint
        if (med.endDate) {
          const end = new Date(med.endDate);
          const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          if (todayMidnight > endMidnight) continue;
        }

        // C. Weekly schedule day constraint
        if (med.scheduleDays && med.scheduleDays.length > 0) {
          const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const todayWeekday = weekdays[userTime.getDay()];
          if (!med.scheduleDays.includes(todayWeekday)) continue;
        }

        let triggerAlarm = false;

        // 1. Check if snooze alarm is due
        if (med.snoozedUntil) {
          const now = new Date();
          if (med.snoozedUntil <= now) {
            triggerAlarm = true;
            med.snoozedUntil = undefined;
            await med.save();
          }
        }

        // 2. Check standard reminder time (15 mins before schedule)
        if (med.reminderTime) {
          const targetAlertTime = getOffsetTimeStr(med.reminderTime, 15);
          if (currentTimeStr === targetAlertTime) {
            triggerAlarm = true;
          }
        }

        if (triggerAlarm) {
          const existingLog = await AdherenceLog.findOne({
            userId: med.userId,
            medicineId: med._id,
            date: todayDateStr
          });

          if (!existingLog) {
             if (user && user.notificationPreference !== 'None') {
                const isLowStock = med.currentQuantity <= (med.refillThreshold || 5);
                const stockWarning = isLowStock 
                  ? `\n\n⚠️ CRITICAL WARNING: You are running low on ${med.name}. You only have ${med.currentQuantity} ${med.unit} remaining. Please request a refill immediately.` 
                  : '';

                // 1. Dispatch Email Alerts
                if ((user.notificationPreference === 'Email' || user.notificationPreference === 'Both') && user.email) {
                  await sendMail({
                    to: user.email,
                    subject: `⏰ Reminder: Time to take ${med.name} in 15 mins`,
                    text: `Hello ${user.name},\n\nThis is your automated pre-alarm from Trulicare. It is almost time to take your scheduled dose of ${med.name} at ${med.reminderTime}.${stockWarning}\n\nPlease prepare your medication now.\n\nBest regards,\nYour Trulicare Assistant`
                  });
                }

                // 2. Dispatch Web Push Alerts
                if ((user.notificationPreference === 'Push' || user.notificationPreference === 'Both') && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                  const pushPayload = {
                    title: `⏰ Time to take ${med.name}`,
                    body: `Your scheduled dose is in 15 mins (${med.reminderTime}).` + (isLowStock ? ` Warning: Low Stock (${med.currentQuantity} left)!` : ''),
                    url: '/dashboard'
                  };

                  const activeSubscriptions = [];
                  let subscriptionsUpdated = false;

                  for (const sub of user.pushSubscriptions) {
                    const success = await sendPushNotification(sub, pushPayload);
                    if (success) {
                      activeSubscriptions.push(sub);
                    } else {
                      subscriptionsUpdated = true; // Mark to clean up expired subscription
                    }
                  }

                  if (subscriptionsUpdated) {
                    user.pushSubscriptions = activeSubscriptions;
                    await user.save();
                  }
                }

                // 3. Dispatch SMS alerts
                if (user.notificationPreference === 'SMS' && user.phoneNumber) {
                  await sendSMS(user.phoneNumber, `⏰ Trulicare Reminder: Time to take your scheduled dose of ${med.name} at ${med.reminderTime}. ${isLowStock ? 'Warning: Low stock!' : ''}`);
                }

                // 4. Dispatch WhatsApp alerts
                if (user.notificationPreference === 'WhatsApp' && user.phoneNumber) {
                  await sendWhatsApp(user.phoneNumber, `⏰ Trulicare Reminder: Time to take your scheduled dose of ${med.name} at ${med.reminderTime}. ${isLowStock ? 'Warning: Low stock!' : ''}`);
                }
             }
          }
        }
      }
    } catch (err) {
      console.error('[Cron Error]', err);
    }
  });

  // Schedule Monthly PDF Report on the 1st day of every month at midnight
  cron.schedule('0 0 1 * *', async () => {
    console.log('[Cron] Monthly adherence report dispatch service started.');
    try {
      const users = await User.find({});
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const user of users) {
        if (!user.email) continue;
        
        const medicines = await Medicine.find({ userId: user._id });
        const logs = await AdherenceLog.find({
          userId: user._id,
          timestamp: { $gte: thirtyDaysAgo }
        });

        const pdfBuffer = await generateAdherenceReportPDF(user, medicines, logs);

        await sendMail({
          to: user.email,
          subject: `📊 Your Monthly Trulicare Adherence Report`,
          text: `Hello ${user.name},\n\nPlease find attached your automated monthly Trulicare medication adherence report for the past 30 days.\n\nBest regards,\nYour Trulicare Portal`,
          attachments: [
            {
              filename: `adherence-report-${new Date().getMonth() + 1}-${new Date().getFullYear()}.pdf`,
              content: pdfBuffer
            }
          ]
        });
        
        console.log(`[Cron] Sent monthly report email to ${user.email}`);
      }
    } catch (err) {
      console.error('[Monthly Report Cron Error]', err);
    }
  });
};
