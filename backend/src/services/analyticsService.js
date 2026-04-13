import { randomUUID } from "node:crypto";

import { store } from "../data/store.js";

const countryGeoMap = {
  "United States": { lat: 38.8977, lng: -77.0365, region: "North America" },
  India: { lat: 28.6139, lng: 77.209, region: "Asia" },
  Bangladesh: { lat: 23.8103, lng: 90.4125, region: "Asia" },
  Germany: { lat: 52.52, lng: 13.405, region: "Europe" },
  Brazil: { lat: -15.7939, lng: -47.8828, region: "South America" },
  France: { lat: 48.8566, lng: 2.3522, region: "Europe" },
  Japan: { lat: 35.6762, lng: 139.6503, region: "Asia" },
  "United Kingdom": { lat: 51.5072, lng: -0.1276, region: "Europe" },
  UK: { lat: 51.5072, lng: -0.1276, region: "Europe" }
};

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
  const realtime = getRealtimeAnalytics();

  return {
    totals: {
      visitors: pageViews.length,
      uniqueCountries: uniqueCountries.size,
      projects: store.projects.length,
      exports: exportCompleted.length,
      uploads: uploads.length,
      liveUsers: realtime.activeVisitors
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

  return [...map.values()]
    .sort((a, b) => {
      const leftScore = a.exports + a.visits + a.uploads;
      const rightScore = b.exports + b.visits + b.uploads;

      if (a.country === "Unknown" && b.country !== "Unknown") {
        return 1;
      }

      if (b.country === "Unknown" && a.country !== "Unknown") {
        return -1;
      }

      return rightScore - leftScore;
    })
    .filter((entry, index, entries) => {
      return entry.country !== "Unknown" || entries.length === 1;
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

  const stepIndexMap = new Map(steps.map((step, index) => [step, index]));
  const actorMap = new Map();

  for (const event of getSortedEventsDesc()) {
    const stepIndex = stepIndexMap.get(event.type);

    if (typeof stepIndex !== "number") {
      continue;
    }

    const actorKey = getFunnelActorKey(event);
    const actor = actorMap.get(actorKey) || {
      highestStepIndex: -1,
      reachedSteps: new Set(),
      lastSeenAt: event.createdAt
    };

    actor.highestStepIndex = Math.max(actor.highestStepIndex, stepIndex);
    actor.reachedSteps.add(stepIndex);

    if (new Date(event.createdAt) > new Date(actor.lastSeenAt)) {
      actor.lastSeenAt = event.createdAt;
    }

    actorMap.set(actorKey, actor);
  }

  return steps.map((step, index) => {
    let total = 0;

    for (const actor of actorMap.values()) {
      if (actor.highestStepIndex >= index) {
        total += 1;
      }
    }

    return {
      step,
      total
    };
  });
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
  return getSortedEventsDesc().slice(0, limit);
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

function getSortedEventsDesc() {
  return [...store.analyticsEvents].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function getAnalyticsReferenceTime() {
  const latestEventTime = store.analyticsEvents.reduce((maxTime, event) => {
    return Math.max(maxTime, new Date(event.createdAt).getTime());
  }, 0);

  const storeTime = store.now ? new Date(store.now).getTime() : 0;
  return new Date(Math.max(latestEventTime, storeTime));
}

function getRealtimeWindowEvents(windowMinutes = 30) {
  const referenceTime = getAnalyticsReferenceTime();
  const startTime = referenceTime.getTime() - (windowMinutes * 60 * 1000);

  return getSortedEventsDesc().filter((event) => {
    const eventTime = new Date(event.createdAt).getTime();
    return eventTime >= startTime && eventTime <= referenceTime.getTime();
  });
}

function getCountryGeo(country) {
  const geo = countryGeoMap[country];

  if (!geo) {
    return null;
  }

  return {
    ...geo,
    x: Number((((geo.lng + 180) / 360) * 800).toFixed(2)),
    y: Number((((90 - geo.lat) / 180) * 360).toFixed(2))
  };
}

function getSessionKey(event) {
  return event.metadata?.sessionId || [
    event.country || "Unknown",
    event.platform || "web",
    event.deviceType || "desktop",
    event.metadata?.projectId || event.metadata?.page || "session"
  ].join("|");
}

function getFunnelActorKey(event) {
  return (
    event.metadata?.sessionId ||
    (event.metadata?.projectId ? `project:${event.metadata.projectId}` : null) ||
    (event.metadata?.exportId ? `export:${event.metadata.exportId}` : null) ||
    getSessionKey(event)
  );
}

function buildRealtimeSparkline(events, referenceTime, bucketCount = 12, windowMinutes = 30) {
  const totalWindowMs = windowMinutes * 60 * 1000;
  const bucketDuration = totalWindowMs / bucketCount;
  const windowStart = referenceTime.getTime() - totalWindowMs;

  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = windowStart + (index * bucketDuration);
    const bucketDate = new Date(bucketStart);

    return {
      minute: bucketDate.toISOString(),
      events: 0
    };
  });

  for (const event of events) {
    const offset = new Date(event.createdAt).getTime() - windowStart;
    const bucketIndex = Math.min(bucketCount - 1, Math.max(0, Math.floor(offset / bucketDuration)));
    buckets[bucketIndex].events += 1;
  }

  return buckets;
}

function getRealtimeAnalytics(windowMinutes = 30) {
  const referenceTime = getAnalyticsReferenceTime();
  const recentEvents = getRealtimeWindowEvents(windowMinutes);
  const sessionMap = new Map();
  const countryMap = new Map();

  for (const event of recentEvents) {
    const sessionKey = getSessionKey(event);
    const session = sessionMap.get(sessionKey) || {
      id: sessionKey,
      country: event.country,
      platform: event.platform,
      deviceType: event.deviceType,
      eventCount: 0,
      lastType: event.type,
      lastSeenAt: event.createdAt
    };

    session.eventCount += 1;

    if (new Date(event.createdAt) >= new Date(session.lastSeenAt)) {
      session.lastSeenAt = event.createdAt;
      session.lastType = event.type;
    }

    sessionMap.set(sessionKey, session);

    const countryGeo = getCountryGeo(event.country);

    if (!countryGeo) {
      continue;
    }

    const countryEntry = countryMap.get(event.country) || {
      country: event.country,
      region: countryGeo.region,
      lat: countryGeo.lat,
      lng: countryGeo.lng,
      x: countryGeo.x,
      y: countryGeo.y,
      sessions: 0,
      events: 0
    };

    countryEntry.events += 1;
    countryMap.set(event.country, countryEntry);
  }

  for (const session of sessionMap.values()) {
    const countryEntry = countryMap.get(session.country);

    if (countryEntry) {
      countryEntry.sessions += 1;
    }
  }

  return {
    windowMinutes,
    asOf: referenceTime.toISOString(),
    activeVisitors: sessionMap.size,
    activeSessions: recentEvents.length,
    mapPoints: [...countryMap.values()].sort((left, right) => right.events - left.events),
    sparkline: buildRealtimeSparkline(recentEvents, referenceTime, 12, windowMinutes),
    liveActivity: recentEvents.slice(0, 6)
  };
}

export const analyticsService = {
  trackEvent,
  getOverview,
  getCountryBreakdown,
  getPlatformBreakdown,
  getFunnel,
  getFeatureUsage,
  getRecentActivity,
  getExportAnalytics,
  getRealtimeAnalytics
};
