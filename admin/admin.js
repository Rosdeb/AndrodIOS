/*
const adminElements = {
  keyInput: document.querySelector("#admin-key-input"),
  loadButton: document.querySelector("#load-dashboard-button"),
  visitors: document.querySelector("#metric-visitors"),
  projects: document.querySelector("#metric-projects"),
  exports: document.querySelector("#metric-exports"),
  liveUsers: document.querySelector("#metric-live-users"),
  trafficGrowth: document.querySelector("#traffic-growth"),
  trafficTotal: document.querySelector("#traffic-total"),
  trafficChart: document.querySelector("#traffic-chart"),
  countryList: document.querySelector("#country-list"),
  funnelList: document.querySelector("#funnel-list"),
  platformAndroid: document.querySelector("#platform-android"),
  platformIos: document.querySelector("#platform-ios"),
  platformBoth: document.querySelector("#platform-both"),
  activityList: document.querySelector("#activity-list")
};

const numberFormatter = new Intl.NumberFormat("en-US");

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function formatCompactPercent(value) {
  const rounded = Math.abs(value) >= 10 ? Math.round(value * 10) / 10 : Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1)}%`;
}

function calculateTrafficGrowth(trend) {
  if (!trend.length) {
    return 0;
  }

  const splitIndex = Math.ceil(trend.length / 2);
  const previousTotal = trend
    .slice(0, splitIndex)
    .reduce((sum, item) => sum + item.visits, 0);
  const currentTotal = trend
    .slice(splitIndex)
    .reduce((sum, item) => sum + item.visits, 0);

  if (previousTotal === 0) {
    return currentTotal > 0 ? 100 : 0;
  }

  return ((currentTotal - previousTotal) / previousTotal) * 100;
}

async function fetchAdmin(path) {
  const response = await fetch(path, {
    headers: {
      "x-admin-key": adminElements.keyInput.value
    }
  });

  if (!response.ok) {
    throw new Error("Admin request failed. Check the admin key.");
  }

  return response.json();
}

function renderTrafficCard(trend, totalVisitors) {
  const series = trend.length ? trend : [];
  const maxVisits = Math.max(...series.map((item) => item.visits), 1);
  const peakIndex = series.reduce((selectedIndex, item, index, array) => {
    if (!array[selectedIndex] || item.visits >= array[selectedIndex].visits) {
      return index;
    }

    return selectedIndex;
  }, 0);
  const growth = calculateTrafficGrowth(series);

  adminElements.trafficTotal.textContent = formatNumber(totalVisitors);
  adminElements.trafficGrowth.textContent = formatCompactPercent(growth);
  adminElements.trafficGrowth.classList.toggle("is-negative", growth < 0);

  adminElements.trafficChart.innerHTML = series
    .map((item, index) => {
      const height = item.visits > 0 ? Math.max(28, (item.visits / maxVisits) * 92) : 16;
      const isPeak = index === peakIndex && item.visits > 0;

      return `
        <div class="traffic-day ${isPeak ? "is-peak" : ""}">
          <div class="traffic-bar-stack">
            ${isPeak ? `<span class="traffic-badge">${formatNumber(item.visits)}</span>` : ""}
            <span class="traffic-bar" style="height:${height}px"></span>
          </div>
          <small>${item.date.slice(5)}</small>
        </div>
      `;
    })
    .join("");
}

function renderCountries(countries) {
  adminElements.countryList.innerHTML = countries
    .map((country) => {
      return `
        <div class="country-row">
          <div>
            <strong>${country.country}</strong>
            <p class="activity-meta">${country.visits} visits • ${country.exports} exports</p>
          </div>
          <span>${country.uploads} uploads</span>
        </div>
      `;
    })
    .join("");
}

function renderFunnel(funnel) {
  const max = Math.max(...funnel.map((item) => item.total), 1);
  adminElements.funnelList.innerHTML = funnel
    .map((item) => {
      const percent = item.total / max * 100;
      return `
        <div class="funnel-row">
          <div>
            <strong>${item.step.replaceAll("_", " ")}</strong>
            <p class="activity-meta">${item.total} users/events</p>
          </div>
          <div class="funnel-progress">
            <span style="width:${percent}%"></span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderActivity(activity) {
  adminElements.activityList.innerHTML = activity
    .map((item) => {
      return `
        <div class="activity-row">
          <div>
            <strong>${item.type.replaceAll("_", " ")}</strong>
            <p class="activity-meta">${item.country} • ${item.platform} • ${item.deviceType}</p>
          </div>
          <span>${item.createdAt.slice(11, 16)}</span>
        </div>
      `;
    })
    .join("");
}

async function loadDashboard() {
  const [overview, countries, funnel, activity] = await Promise.all([
    fetchAdmin("/api/admin/overview"),
    fetchAdmin("/api/admin/countries"),
    fetchAdmin("/api/admin/funnel"),
    fetchAdmin("/api/admin/activity")
  ]);

  adminElements.visitors.textContent = overview.totals.visitors;
  adminElements.projects.textContent = formatNumber(overview.totals.projects);
  adminElements.exports.textContent = formatNumber(overview.totals.exports);
  adminElements.liveUsers.textContent = formatNumber(overview.totals.liveUsers);
  adminElements.platformAndroid.textContent = formatNumber(overview.platformBreakdown.android);
  adminElements.platformIos.textContent = formatNumber(overview.platformBreakdown.ios);
  adminElements.platformBoth.textContent = formatNumber(overview.platformBreakdown.both);
  adminElements.visitors.textContent = formatNumber(overview.totals.visitors);

  renderTrafficCard(overview.trend, overview.totals.visitors);
  renderCountries(countries.countries);
  renderFunnel(funnel.funnel);
  renderActivity(activity.activity);
}

adminElements.loadButton.addEventListener("click", async () => {
  try {
    await loadDashboard();
  } catch (error) {
    adminElements.activityList.innerHTML = `<div class="activity-row"><strong>${error.message}</strong></div>`;
  }
});

loadDashboard().catch(() => {
  adminElements.activityList.innerHTML =
    '<div class="activity-row"><strong>Load the dashboard to see analytics.</strong></div>';
});
*/

const adminElements = {
  keyInput: document.querySelector("#admin-key-input"),
  loadButton: document.querySelector("#load-dashboard-button"),
  exportReportButton: document.querySelector("#export-report-button"),
  exportCountriesButton: document.querySelector("#export-countries-button"),
  visitors: document.querySelector("#metric-visitors"),
  projects: document.querySelector("#metric-projects"),
  exports: document.querySelector("#metric-exports"),
  liveUsers: document.querySelector("#metric-live-users"),
  trendChart: document.querySelector("#trend-chart"),
  countryList: document.querySelector("#country-list"),
  funnelFlow: document.querySelector("#funnel-flow"),
  funnelList: document.querySelector("#funnel-list"),
  platformAndroid: document.querySelector("#platform-android"),
  platformIos: document.querySelector("#platform-ios"),
  platformBoth: document.querySelector("#platform-both"),
  platformDonut: document.querySelector("#platform-donut"),
  platformLegend: document.querySelector("#platform-legend"),
  activityList: document.querySelector("#activity-list"),
  realtimeMap: document.querySelector("#realtime-map"),
  realtimeMapCanvas: document.querySelector("#realtime-map-canvas"),
  realtimeVisitors: document.querySelector("#realtime-visitors"),
  realtimeSessions: document.querySelector("#realtime-sessions"),
  realtimeSparkline: document.querySelector("#realtime-sparkline"),
  realtimeActivityList: document.querySelector("#realtime-activity-list")
};

const dashboardState = {
  overview: null,
  countries: [],
  funnel: [],
  activity: [],
  features: [],
  exports: null,
  realtime: null,
  realtimeMapInstance: null,
  realtimeMapMarkers: null
};

const numberFormatter = new Intl.NumberFormat("en-US");

const eventLabels = {
  page_view: "Project Page Visited",
  upload_completed: "Asset Uploaded",
  preview_opened: "Preview Opened",
  export_started: "Export Started",
  export_completed: "Full Asset Export Complete",
  color_changed: "Palette Updated",
  zoom_changed: "Zoom Adjusted",
  gradient_applied: "Gradient Applied"
};

const eventBadgeLabels = {
  page_view: "Visitor",
  upload_completed: "Upload",
  preview_opened: "Preview",
  export_started: "Export",
  export_completed: "Export",
  color_changed: "Color",
  zoom_changed: "Zoom",
  gradient_applied: "Style"
};

const countryFlags = {
  "United States": "US",
  India: "IN",
  Bangladesh: "BD",
  Germany: "DE",
  Brazil: "BR",
  France: "FR",
  Japan: "JP",
  "United Kingdom": "UK",
  UK: "UK"
};

async function fetchAdmin(path) {
  const response = await fetch(path, {
    headers: {
      "x-admin-key": adminElements.keyInput.value
    }
  });

  if (!response.ok) {
    throw new Error("Admin request failed. Check the admin key.");
  }

  return response.json();
}

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

function normalizeLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDayLabel(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

function buildLinePath(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function buildAreaPath(points, baselineY) {
  if (!points.length) {
    return "";
  }

  return [
    `M ${points[0].x} ${baselineY}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1].x} ${baselineY}`,
    "Z"
  ].join(" ");
}

function formatRelativeTime(timestamp, referenceTime) {
  const deltaMs = Math.max(0, referenceTime.getTime() - new Date(timestamp).getTime());
  const deltaMinutes = Math.round(deltaMs / 60000);

  if (deltaMinutes < 1) {
    return "Just now";
  }

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);

  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays}d ago`;
}

function getReferenceTime(activity) {
  if (!activity.length) {
    return new Date();
  }

  const latest = activity.reduce((current, item) => {
    return new Date(item.createdAt) > new Date(current.createdAt) ? item : current;
  }, activity[0]);

  return new Date(latest.createdAt);
}

function downloadBlob(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

function getRealtimePingSize(point) {
  return Math.max(14, Math.min(34, 10 + (point.events * 2.4) + (point.sessions * 1.6)));
}

function ensureRealtimeMapCanvas() {
  if (adminElements.realtimeMapCanvas) {
    return adminElements.realtimeMapCanvas;
  }

  if (!adminElements.realtimeMap) {
    return null;
  }

  adminElements.realtimeMap.innerHTML = '<div class="realtime-map-canvas" id="realtime-map-canvas"></div>';
  adminElements.realtimeMapCanvas = document.querySelector("#realtime-map-canvas");
  return adminElements.realtimeMapCanvas;
}

function ensureRealtimeMap() {
  const canvas = ensureRealtimeMapCanvas();

  if (!canvas || typeof window.L === "undefined") {
    return null;
  }

  if (dashboardState.realtimeMapInstance) {
    return dashboardState.realtimeMapInstance;
  }

  const map = window.L.map(canvas, {
    zoomControl: false,
    attributionControl: true,
    worldCopyJump: true
  }).setView([20, 5], 2);

  window.L.control.zoom({ position: "bottomright" }).addTo(map);

  window.L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: "abcd",
    maxZoom: 18
  }).addTo(map);

  dashboardState.realtimeMapInstance = map;
  dashboardState.realtimeMapMarkers = window.L.layerGroup().addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 0);

  return map;
}

function renderRealtimeMap(realtime) {
  const map = ensureRealtimeMap();

  if (!map || !dashboardState.realtimeMapMarkers) {
    if (adminElements.realtimeMap) {
      adminElements.realtimeMap.innerHTML = '<div class="empty-state">Map plugin could not be loaded.</div>';
      adminElements.realtimeMapCanvas = null;
    }
    return;
  }

  dashboardState.realtimeMapMarkers.clearLayers();

  if (!realtime.mapPoints.length) {
    map.setView([20, 5], 2);
    return;
  }

  const bounds = [];

  realtime.mapPoints.forEach((point) => {
    const latLng = [point.lat, point.lng];
    const radius = getRealtimePingSize(point);

    window.L.circleMarker(latLng, {
      radius: Math.round(radius * 0.9),
      color: "rgba(107, 174, 255, 0.2)",
      weight: 1,
      fillColor: "rgba(107, 174, 255, 0.2)",
      fillOpacity: 0.28
    }).addTo(dashboardState.realtimeMapMarkers);

    window.L.circleMarker(latLng, {
      radius: Math.max(5, Math.round(radius * 0.42)),
      color: "#6baeff",
      weight: 2,
      fillColor: "#fff3ad",
      fillOpacity: 0.95
    })
      .bindTooltip(
        `${point.country}: ${formatNumber(point.sessions)} active visitors, ${formatNumber(point.events)} live events`,
        { direction: "top", offset: [0, -8] }
      )
      .addTo(dashboardState.realtimeMapMarkers);

    bounds.push(latLng);
  });

  if (bounds.length === 1) {
    map.setView(bounds[0], 3);
  } else {
    map.fitBounds(bounds, {
      padding: [24, 24],
      maxZoom: 3
    });
  }

  setTimeout(() => {
    map.invalidateSize();
  }, 0);
}

function renderRealtimeActivity(activity, asOf) {
  if (!activity.length) {
    adminElements.realtimeActivityList.innerHTML = '<div class="empty-state">No live user activity in the selected window.</div>';
    return;
  }

  const referenceTime = new Date(asOf);

  adminElements.realtimeActivityList.innerHTML = activity
    .map((item) => {
      const badgeLabel = eventBadgeLabels[item.type] || "Event";
      const eventTitle = eventLabels[item.type] || normalizeLabel(item.type);
      const relative = formatRelativeTime(item.createdAt, referenceTime);

      return `
        <div class="realtime-activity-item">
          <div class="realtime-activity-copy">
            <strong>${eventTitle}</strong>
            <p>${item.country} • ${item.platform} • ${item.deviceType}</p>
          </div>
          <div class="realtime-activity-meta">
            <span>${relative}</span>
            <span class="activity-badge activity-badge-${item.type.replaceAll("_", "-")}">${badgeLabel}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTrend(trend) {
  if (!trend.length) {
    adminElements.trendChart.innerHTML = '<p class="empty-state">No trend data available yet.</p>';
    return;
  }

  const width = 760;
  const height = 320;
  const padding = { top: 18, right: 18, bottom: 42, left: 46 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...trend.map((item) => Math.max(item.visits, item.exports)), 1);
  const focusIndex = trend.reduce((selectedIndex, item, index, list) => {
    if (item.visits + item.exports >= list[selectedIndex].visits + list[selectedIndex].exports) {
      return index;
    }

    return selectedIndex;
  }, 0);

  const createPointSet = (key) => {
    return trend.map((item, index) => {
      const x = padding.left + ((chartWidth / Math.max(trend.length - 1, 1)) * index);
      const y = padding.top + (chartHeight - ((item[key] / maxValue) * chartHeight));

      return {
        x,
        y,
        label: formatDayLabel(item.date),
        value: item[key]
      };
    });
  };

  const visitPoints = createPointSet("visits");
  const exportPoints = createPointSet("exports");
  const focusVisit = visitPoints[focusIndex];
  const focusExport = exportPoints[focusIndex];
  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const value = Math.round((maxValue / 4) * (4 - index));
    const y = padding.top + ((chartHeight / 4) * index);
    return { value, y };
  });

  const focusCardWidth = 138;
  const focusCardHeight = 54;
  const focusCardX = Math.min(width - focusCardWidth - 12, focusVisit.x + 10);
  const focusCardY = Math.max(14, focusVisit.y - 12);

  adminElements.trendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="trend-svg" role="img" aria-label="Project activity trends">
      <defs>
        <linearGradient id="visits-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(100, 167, 255, 0.48)"></stop>
          <stop offset="100%" stop-color="rgba(100, 167, 255, 0.03)"></stop>
        </linearGradient>
        <linearGradient id="exports-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(102, 227, 153, 0.42)"></stop>
          <stop offset="100%" stop-color="rgba(102, 227, 153, 0.02)"></stop>
        </linearGradient>
      </defs>

      ${yTicks.map((tick) => `
        <g>
          <line x1="${padding.left}" y1="${tick.y}" x2="${width - padding.right}" y2="${tick.y}" class="trend-grid-line"></line>
          <text x="${padding.left - 10}" y="${tick.y + 4}" class="trend-axis-text">${tick.value}</text>
        </g>
      `).join("")}

      <line
        x1="${focusVisit.x}"
        y1="${padding.top}"
        x2="${focusVisit.x}"
        y2="${height - padding.bottom}"
        class="trend-focus-line"
      ></line>

      <path d="${buildAreaPath(visitPoints, height - padding.bottom)}" class="trend-area trend-area-visits"></path>
      <path d="${buildAreaPath(exportPoints, height - padding.bottom)}" class="trend-area trend-area-exports"></path>
      <path d="${buildLinePath(visitPoints)}" class="trend-line trend-line-visits"></path>
      <path d="${buildLinePath(exportPoints)}" class="trend-line trend-line-exports"></path>

      ${visitPoints.map((point, index) => `
        <circle cx="${point.x}" cy="${point.y}" r="${index === focusIndex ? 5.5 : 4}" class="trend-point trend-point-visits"></circle>
      `).join("")}
      ${exportPoints.map((point, index) => `
        <circle cx="${point.x}" cy="${point.y}" r="${index === focusIndex ? 5.5 : 4}" class="trend-point trend-point-exports"></circle>
      `).join("")}

      ${trend.map((item, index) => `
        <text
          x="${padding.left + ((chartWidth / Math.max(trend.length - 1, 1)) * index)}"
          y="${height - 14}"
          text-anchor="middle"
          class="trend-axis-text trend-axis-day"
        >
          ${formatDayLabel(item.date)}
        </text>
      `).join("")}

      <g transform="translate(${focusCardX}, ${focusCardY})">
        <rect width="${focusCardWidth}" height="${focusCardHeight}" rx="14" class="trend-tooltip"></rect>
        <text x="12" y="18" class="trend-tooltip-title">${focusVisit.label}</text>
        <text x="12" y="34" class="trend-tooltip-copy">Visits: ${focusVisit.value}</text>
        <text x="12" y="48" class="trend-tooltip-copy trend-tooltip-copy-success">Exports: ${focusExport.value}</text>
      </g>
    </svg>
  `;
}

function renderCountries(countries) {
  if (!countries.length) {
    adminElements.countryList.innerHTML = '<p class="empty-state">No country data yet.</p>';
    return;
  }

  adminElements.countryList.innerHTML = countries
    .slice(0, 5)
    .map((country, index) => {
      const conversion = country.visits ? Math.round((country.exports / country.visits) * 100) : 0;
      const momentum = country.exports === country.uploads
        ? "steady"
        : country.exports > country.uploads
          ? "up"
          : "down";
      const momentumLabel = momentum === "up" ? "Up" : momentum === "down" ? "Down" : "Flat";
      const flag = countryFlags[country.country] || country.country.slice(0, 2).toUpperCase();

      return `
        <div class="country-row">
          <div class="country-name-cell">
            <span class="country-rank">${index + 1}</span>
            <span class="country-flag">${flag}</span>
            <strong>${country.country}</strong>
          </div>
          <span class="momentum-pill momentum-${momentum}">${momentumLabel}</span>
          <span>${formatNumber(country.visits)}</span>
          <span>${formatPercent(conversion)}</span>
        </div>
      `;
    })
    .join("");
}

function renderFunnel(funnel) {
  if (!funnel.length) {
    adminElements.funnelFlow.innerHTML = '<p class="empty-state">No funnel data yet.</p>';
    adminElements.funnelList.innerHTML = "";
    return;
  }

  const labels = {
    page_view: "App Opened",
    upload_completed: "Icon Variant Preview",
    preview_opened: "Style Customization",
    export_started: "Android Export",
    export_completed: "iOS Export"
  };

  const max = Math.max(...funnel.map((item) => item.total), 1);
  const base = funnel[0].total || 1;

  adminElements.funnelFlow.innerHTML = funnel
    .map((item, index) => {
      const conversion = index === 0 ? 100 : Math.round((item.total / funnel[index - 1].total) * 100 || 0);

      return `
        <div class="funnel-step">
          <strong>${labels[item.step] || normalizeLabel(item.step)}</strong>
          <span>${formatNumber(item.total)} users</span>
          <em>${conversion}%</em>
        </div>
      `;
    })
    .join("");

  adminElements.funnelList.innerHTML = funnel
    .map((item) => {
      const height = Math.max(18, (item.total / max) * 92);
      const overall = Math.round((item.total / base) * 100 || 0);

      return `
        <div class="funnel-bar-card">
          <div class="funnel-bar-shell">
            <span class="funnel-bar-fill" style="height:${height}px"></span>
          </div>
          <strong>${overall}%</strong>
          <span>${labels[item.step] || normalizeLabel(item.step)}</span>
        </div>
      `;
    })
    .join("");
}

function renderPlatformSplit(platformBreakdown) {
  const android = Number(platformBreakdown.android || 0);
  const ios = Number(platformBreakdown.ios || 0);
  const both = Number(platformBreakdown.both || 0);
  const total = android + ios + both;
  const androidPct = total ? (android / total) * 100 : 0;
  const iosPct = total ? (ios / total) * 100 : 0;
  const bothPct = total ? (both / total) * 100 : 0;

  adminElements.platformAndroid.textContent = formatNumber(android);
  adminElements.platformIos.textContent = formatNumber(ios);
  adminElements.platformBoth.textContent = formatNumber(both);

  adminElements.platformDonut.innerHTML = `
    <div
      class="donut-ring"
      style="background: conic-gradient(
        #63e68f 0% ${androidPct}%,
        #59a7ff ${androidPct}% ${androidPct + iosPct}%,
        #f5a24c ${androidPct + iosPct}% 100%
      )"
    >
      <div class="donut-hole">
        <strong>${formatNumber(total)}</strong>
        <span>OS Target</span>
      </div>
    </div>
  `;

  adminElements.platformLegend.innerHTML = `
    <div class="platform-legend-item">
      <i class="legend-dot legend-dot-exports"></i>
      <div>
        <strong>Android</strong>
        <span>${formatPercent(androidPct)} of exports</span>
      </div>
    </div>
    <div class="platform-legend-item">
      <i class="legend-dot legend-dot-visits"></i>
      <div>
        <strong>iOS</strong>
        <span>${formatPercent(iosPct)} of exports</span>
      </div>
    </div>
    <div class="platform-legend-item">
      <i class="legend-dot legend-dot-both"></i>
      <div>
        <strong>Combined</strong>
        <span>${formatPercent(bothPct)} of exports</span>
      </div>
    </div>
  `;
}

function renderActivity(activity) {
  if (!activity.length) {
    adminElements.activityList.innerHTML = '<p class="empty-state">No recent activity yet.</p>';
    return;
  }

  const referenceTime = getReferenceTime(activity);

  adminElements.activityList.innerHTML = activity
    .slice(0, 8)
    .map((item) => {
      const badgeLabel = eventBadgeLabels[item.type] || "Event";
      const eventTitle = eventLabels[item.type] || normalizeLabel(item.type);
      const meta = `${item.country}, ${item.platform}, ${item.deviceType}`;
      const relative = formatRelativeTime(item.createdAt, referenceTime);

      return `
        <div class="activity-row">
          <div class="activity-copy">
            <strong>${eventTitle}</strong>
            <p>${meta}</p>
          </div>
          <div class="activity-tags">
            <span class="activity-age">${relative}</span>
            <span class="activity-badge activity-badge-${item.type.replaceAll("_", "-")}">${badgeLabel}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderRealtime(realtime) {
  adminElements.realtimeVisitors.textContent = formatNumber(realtime.activeVisitors);
  adminElements.realtimeSessions.textContent = formatNumber(realtime.activeSessions);
  renderRealtimeMap(realtime);

  const sparklineData = realtime.sparkline.map((item) => item.events);
  const width = 320;
  const height = 80;
  const max = Math.max(...sparklineData, 1);
  const points = sparklineData.map((value, index) => {
    const x = (width / Math.max(sparklineData.length - 1, 1)) * index;
    const y = height - ((value / max) * (height - 10)) - 5;
    return `${x},${y}`;
  }).join(" ");

  adminElements.realtimeSparkline.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="sparkline-svg" role="img" aria-label="Realtime activity sparkline">
      <polyline points="${points}" class="sparkline-line"></polyline>
      ${sparklineData.map((value, index) => {
        const x = (width / Math.max(sparklineData.length - 1, 1)) * index;
        const y = height - ((value / max) * (height - 10)) - 5;
        return `<circle cx="${x}" cy="${y}" r="2.5" class="sparkline-point"></circle>`;
      }).join("")}
    </svg>
  `;

  renderRealtimeActivity(realtime.liveActivity, realtime.asOf);
}

function renderDashboard() {
  const { overview, countries, funnel, activity, realtime } = dashboardState;

  adminElements.visitors.textContent = formatNumber(overview.totals.visitors);
  adminElements.projects.textContent = formatNumber(overview.totals.projects);
  adminElements.exports.textContent = formatNumber(overview.totals.exports);
  adminElements.liveUsers.textContent = formatNumber(overview.totals.liveUsers);

  renderTrend(overview.trend);
  renderCountries(countries);
  renderFunnel(funnel);
  renderPlatformSplit(overview.platformBreakdown);
  renderActivity(activity);
  renderRealtime(realtime);
}

async function loadDashboard() {
  const [overview, countries, funnel, activity, features, exportsData, realtime] = await Promise.all([
    fetchAdmin("/api/admin/overview"),
    fetchAdmin("/api/admin/countries"),
    fetchAdmin("/api/admin/funnel"),
    fetchAdmin("/api/admin/activity"),
    fetchAdmin("/api/admin/features"),
    fetchAdmin("/api/admin/exports"),
    fetchAdmin("/api/admin/realtime")
  ]);

  dashboardState.overview = overview;
  dashboardState.countries = countries.countries;
  dashboardState.funnel = funnel.funnel;
  dashboardState.activity = activity.activity;
  dashboardState.features = features.features;
  dashboardState.exports = exportsData;
  dashboardState.realtime = realtime;

  renderDashboard();
}

function exportDashboardReport() {
  if (!dashboardState.overview) {
    return;
  }

  downloadBlob(
    JSON.stringify(dashboardState, null, 2),
    "iconforge-dashboard-report.json",
    "application/json"
  );
}

function exportCountriesCsv() {
  if (!dashboardState.countries.length) {
    return;
  }

  const rows = [
    ["country", "visits", "exports", "uploads"],
    ...dashboardState.countries.map((country) => [
      country.country,
      country.visits,
      country.exports,
      country.uploads
    ])
  ];

  const csv = rows.map((row) => row.join(",")).join("\n");
  downloadBlob(csv, "iconforge-top-countries.csv", "text/csv;charset=utf-8");
}

function showDashboardError(message) {
  const errorMarkup = `<div class="empty-state">${message}</div>`;

  adminElements.trendChart.innerHTML = errorMarkup;
  adminElements.countryList.innerHTML = errorMarkup;
  adminElements.funnelFlow.innerHTML = errorMarkup;
  adminElements.funnelList.innerHTML = "";
  adminElements.platformDonut.innerHTML = errorMarkup;
  adminElements.platformLegend.innerHTML = "";
  adminElements.activityList.innerHTML = errorMarkup;
  adminElements.realtimeMap.innerHTML = errorMarkup;
  adminElements.realtimeMapCanvas = null;
  adminElements.realtimeSparkline.innerHTML = "";
  adminElements.realtimeActivityList.innerHTML = "";
}

adminElements.loadButton.addEventListener("click", async () => {
  try {
    await loadDashboard();
  } catch (error) {
    showDashboardError(error.message);
  }
});

adminElements.exportReportButton.addEventListener("click", () => {
  exportDashboardReport();
});

adminElements.exportCountriesButton.addEventListener("click", () => {
  exportCountriesCsv();
});

loadDashboard().catch(() => {
  showDashboardError("Load the dashboard to see analytics.");
});
