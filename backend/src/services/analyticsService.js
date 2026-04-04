import { randomUUID } from "node:crypto";

import { store } from "../data/store.js";

function trackEvent(payload) {
  const event = {
    id: randomUUID(),
    type: payload.type,
    country: payload.country || "Unknown",
    platform: payload.platform || "web",
    deviceType: payload.deviceType || "desktop",
    createdAt: payload.createdAt || new Date().toISOString(),
    metadata: payload.metadata || {}
  };

  store.analyticsEvents.unshift(event);
  return event;
}

function getOverview() {
  const events = store.analyticsEvents;
  const pageViews = events.filter((event) => event.type === "page_view");
  const exportCompleted = events.filter((event) => event.type === "export_completed");
  const uploads = events.filter((event) => event.type === "upload_completed");
  const uniqueCountries = new Set(events.map((event) => event.country));
  const topCountry = getCountryBreakdown()[0] || null;
  const platformBreakdown = getPlatformBreakdown();

  return {
    totals: {
      visitors: pageViews.length,
      uniqueCountries: uniqueCountries.size,
      projects: store.projects.length,
      exports: exportCompleted.length,
      uploads: uploads.length,
      liveUsers: 8
    },
    topCountry,
    platformBreakdown,
    trend: buildDailyTrend(7)
  };
}

function getCountryBreakdown() {
  const map = new Map();

  for (const event of store.analyticsEvents) {
    const entry = map.get(event.country) || {
      country: event.country,
      visits: 0,
      exports: 0,
      uploads: 0
    };

    if (event.type === "page_view") {
      entry.visits += 1;
    }

    if (event.type === "export_completed") {
      entry.exports += 1;
    }

    if (event.type === "upload_completed") {
      entry.uploads += 1;
    }

    map.set(event.country, entry);
  }

  return [...map.values()].sort((a, b) => {
    return b.exports + b.visits - (a.exports + a.visits);
  });
}

function getPlatformBreakdown() {
  const breakdown = {
    android: 0,
    ios: 0,
    both: 0
  };

  for (const event of store.analyticsEvents) {
    if (event.type !== "export_completed") {
      continue;
    }

    if (event.platform === "android") {
      breakdown.android += 1;
    } else if (event.platform === "ios") {
      breakdown.ios += 1;
    } else {
      breakdown.both += 1;
    }
  }

  return breakdown;
}

function getFunnel() {
  const steps = [
    "page_view",
    "upload_completed",
    "preview_opened",
    "export_started",
    "export_completed"
  ];

  return steps.map((step) => ({
    step,
    total: store.analyticsEvents.filter((event) => event.type === step).length
  }));
}

function getFeatureUsage() {
  const interestingEvents = [
    "color_changed",
    "zoom_changed",
    "gradient_applied",
    "preview_opened"
  ];

  return interestingEvents.map((type) => ({
    type,
    total: store.analyticsEvents.filter((event) => event.type === type).length
  }));
}

function getRecentActivity(limit = 10) {
  return store.analyticsEvents.slice(0, limit);
}

function getExportAnalytics() {
  const exports = store.exports;

  return {
    totalExports: exports.length,
    androidExports: exports.filter((item) => item.platforms.includes("android")).length,
    iosExports: exports.filter((item) => item.platforms.includes("ios")).length,
    countries: getCountryBreakdown().filter((entry) => entry.exports > 0)
  };
}

function buildDailyTrend(days) {
  const buckets = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(store.now);
    date.setUTCDate(date.getUTCDate() - index);
    const isoDate = date.toISOString().slice(0, 10);

    buckets.push({
      date: isoDate,
      visits: 0,
      exports: 0
    });
  }

  for (const event of store.analyticsEvents) {
    const bucket = buckets.find((item) => item.date === event.createdAt.slice(0, 10));

    if (!bucket) {
      continue;
    }

    if (event.type === "page_view") {
      bucket.visits += 1;
    }

    if (event.type === "export_completed") {
      bucket.exports += 1;
    }
  }

  return buckets;
}

export const analyticsService = {
  trackEvent,
  getOverview,
  getCountryBreakdown,
  getPlatformBreakdown,
  getFunnel,
  getFeatureUsage,
  getRecentActivity,
  getExportAnalytics
};
