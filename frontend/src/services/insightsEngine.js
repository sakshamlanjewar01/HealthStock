export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateAdherenceMetrics = (logs, medicines) => {
  if (!logs || logs.length === 0) {
    return {
      score: 0,
      level: "Needs Improvement",
      takenCount: 0,
      missedCount: 0,
      skippedCount: 0,
      timeOfDayStats: {},
      weeklyStats: {},
      monthlyStats: [],
      medicineStats: {},
      insights: []
    };
  }

  let takenCount = 0;
  let missedCount = 0;
  let skippedCount = 0;

  logs.forEach(log => {
    if (log.status === "taken") takenCount++;
    else if (log.status === "missed") missedCount++;
    else if (log.status === "skipped") skippedCount++;
  });

  const totalDoses = takenCount + missedCount + skippedCount;
  
  let score = 0;
  if (totalDoses > 0) {
    const penalizedDenominator = takenCount + missedCount + (skippedCount * 0.5);
    score = Math.round((takenCount / (penalizedDenominator || 1)) * 100);
    score = Math.min(100, Math.max(0, score));
  }

  let level = "Needs Improvement";
  if (score >= 90) level = "Excellent";
  else if (score >= 75) level = "Good";

  const logsByDate = {};
  logs.forEach(log => {
    if (!logsByDate[log.date]) {
      logsByDate[log.date] = { total: 0, taken: 0 };
    }
    logsByDate[log.date].total++;
    if (log.status === "taken") {
      logsByDate[log.date].taken++;
    }
  });

  // Streak calculation logic removed

  const timeOfDayMap = {
    "Morning": { taken: 0, total: 0 },
    "Afternoon": { taken: 0, total: 0 },
    "Evening": { taken: 0, total: 0 },
    "Night": { taken: 0, total: 0 }
  };

  logs.forEach(log => {
    let category = "Morning";
    if (log.timeOfDay.includes("Morning") || log.timeOfDay === "08:00") category = "Morning";
    else if (log.timeOfDay.includes("Afternoon") || log.timeOfDay === "13:00") category = "Afternoon";
    else if (log.timeOfDay.includes("Evening") || log.timeOfDay === "19:00") category = "Evening";
    else if (log.timeOfDay.includes("Night") || log.timeOfDay === "22:00") category = "Night";
    else {
      const hour = new Date(log.timestamp).getHours();
      if (hour >= 5 && hour < 12) category = "Morning";
      else if (hour >= 12 && hour < 17) category = "Afternoon";
      else if (hour >= 17 && hour < 21) category = "Evening";
      else category = "Night";
    }

    if (timeOfDayMap[category]) {
      timeOfDayMap[category].total++;
      if (log.status === "taken") {
        timeOfDayMap[category].taken++;
      }
    }
  });

  const timeOfDayStats = {};
  Object.keys(timeOfDayMap).forEach(key => {
    const d = timeOfDayMap[key];
    timeOfDayStats[key] = d.total > 0 ? Math.round((d.taken / d.total) * 100) : 0;
  });

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weeklyMap = {};
  daysOfWeek.forEach(day => {
    weeklyMap[day] = { taken: 0, total: 0 };
  });

  logs.forEach(log => {
    const parts = log.date.split('-');
    const logDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayIndex = logDate.getDay();
    const dayName = daysOfWeek[dayIndex];
    if (weeklyMap[dayName]) {
      weeklyMap[dayName].total++;
      if (log.status === "taken") {
        weeklyMap[dayName].taken++;
      }
    }
  });

  const weeklyStats = {};
  daysOfWeek.forEach(day => {
    const d = weeklyMap[day];
    weeklyStats[day] = d.total > 0 ? Math.round((d.taken / d.total) * 100) : 0;
  });

  const dates = Object.keys(logsByDate).sort();
  const monthlyStats = [];
  if (dates.length > 0) {
    const minDate = new Date(dates[0]);
    const maxDate = new Date(dates[dates.length - 1]);
    
    // Ensure we generate at least 7 days of daily trend if range is very short
    const diffTime = Math.abs(maxDate - minDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const daysToGenerate = Math.min(366, Math.max(7, diffDays));
    
    // Start generating from minDate, or if daysToGenerate is 7 and range is shorter, we generate 7 days leading to maxDate
    const startDate = new Date(maxDate);
    startDate.setDate(maxDate.getDate() - (daysToGenerate - 1));

    for (let i = 0; i < daysToGenerate; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = getLocalDateString(d);
      const data = logsByDate[dateStr];
      monthlyStats.push({
        date: dateStr,
        displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        adherence: data && data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0
      });
    }
  } else {
    // Fallback: 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalDateString(d);
      const data = logsByDate[dateStr];
      monthlyStats.push({
        date: dateStr,
        displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        adherence: data && data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0
      });
    }
  }

  // Group by month for the past 12 months (yearly stats)
  const yearlyStats = [];
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1); // Start of month 11 months ago
  
  const monthMap = {}; // "YYYY-MM": { name: "Jan 26", taken: 0, total: 0 }
  
  // Initialize past 12 months
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const yearKey = d.getFullYear();
    const monthKey = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${yearKey}-${monthKey}`;
    const monthName = d.toLocaleDateString(undefined, { month: 'short' });
    monthMap[key] = { 
      name: `${monthName} ${yearKey.toString().slice(-2)}`, 
      taken: 0, 
      total: 0 
    };
  }
  
  logs.forEach(log => {
    if (log.date && log.date.length >= 7) {
      const key = log.date.substring(0, 7); // "YYYY-MM"
      if (monthMap[key]) {
        monthMap[key].total++;
        if (log.status === "taken") {
          monthMap[key].taken++;
        }
      }
    }
  });
  
  Object.keys(monthMap).forEach(key => {
    const m = monthMap[key];
    yearlyStats.push({
      name: m.name,
      Adherence: m.total > 0 ? Math.round((m.taken / m.total) * 100) : 0
    });
  });


  const medicineStats = {};
  medicines.forEach(m => {
    const mId = m._id || m.id;
    medicineStats[mId] = { name: m.name, taken: 0, total: 0 };
  });

  logs.forEach(log => {
    if (medicineStats[log.medicineId]) {
      medicineStats[log.medicineId].total++;
      if (log.status === "taken") {
        medicineStats[log.medicineId].taken++;
      }
    }
  });

  Object.keys(medicineStats).forEach(id => {
    const item = medicineStats[id];
    item.rate = item.total > 0 ? Math.round((item.taken / item.total) * 100) : 0;
  });

  const insights = [];

  if (timeOfDayStats["Evening"] < 75) {
    insights.push({
      id: "insight-evening",
      type: "warning",
      text: `You miss ${100 - timeOfDayStats["Evening"]}% of your evening medications. Consider setting an alarm for dinner time.`
    });
  }

  const periods = [
    { name: "8 AM and 12 PM", rate: timeOfDayStats["Morning"] },
    { name: "12 PM and 5 PM", rate: timeOfDayStats["Afternoon"] },
    { name: "5 PM and 9 PM", rate: timeOfDayStats["Evening"] },
    { name: "9 PM and 8 AM", rate: timeOfDayStats["Night"] }
  ];
  periods.sort((a, b) => b.rate - a.rate);
  if (periods[0].rate > 80) {
    insights.push({
      id: "insight-consistent",
      type: "success",
      text: `You are most consistent between ${periods[0].name} (${periods[0].rate}% adherence).`
    });
  }

  let first15Taken = 0, first15Total = 0;
  let last15Taken = 0, last15Total = 0;
  monthlyStats.forEach((dayData, index) => {
    const dateStr = dayData.date;
    const data = logsByDate[dateStr];
    if (data) {
      if (index < 15) {
        first15Taken += data.taken;
        first15Total += data.total;
      } else {
        last15Taken += data.taken;
        last15Total += data.total;
      }
    }
  });
  const first15Rate = first15Total > 0 ? (first15Taken / first15Total) * 100 : 0;
  const last15Rate = last15Total > 0 ? (last15Taken / last15Total) * 100 : 0;
  const improvement = Math.round(last15Rate - first15Rate);

  if (improvement > 2) {
    insights.push({
      id: "insight-improvement",
      type: "success",
      text: `Your adherence improved by ${improvement}% this month.`
    });
  }

  // Streak insights removed

  const weekdayAverage = (weeklyStats["Monday"] + weeklyStats["Tuesday"] + weeklyStats["Wednesday"] + weeklyStats["Thursday"] + weeklyStats["Friday"]) / 5;
  const weekendAverage = (weeklyStats["Saturday"] + weeklyStats["Sunday"]) / 2;
  if (weekdayAverage - weekendAverage > 10) {
    insights.push({
      id: "insight-weekend",
      type: "warning",
      text: `You tend to miss medicines on weekends. Weekend adherence is ${Math.round(weekendAverage)}% compared to ${Math.round(weekdayAverage)}% on weekdays.`
    });
  }

  if (score >= 85) {
    insights.push({
      id: "insight-healthy",
      type: "success",
      text: "You are maintaining a healthy adherence score. Keep up the excellent habit!"
    });
  } else if (score < 70) {
    insights.push({
      id: "insight-low-score",
      type: "danger",
      text: "Your overall adherence score needs attention. Try activating email or SMS refill alerts."
    });
  }

  return {
    score,
    level,
    takenCount,
    missedCount,
    skippedCount,
    timeOfDayStats,
    weeklyStats,
    monthlyStats,
    yearlyStats,
    medicineStats,
    insights
  };
};
