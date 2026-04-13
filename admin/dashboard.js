const adminElements = {
  keyInput: document.querySelector("#admin-key-input"),
  loadButton: document.querySelector("#load-dashboard-button"),
  exportReportButton: document.querySelector("#export-report-button"),
  exportCountriesButton: document.querySelector("#export-countries-button"),
  visitors: document.querySelector("#metric-visitors"),
  projects: document.querySelector("#metric-projects"),
  exports: document.querySelector("#metric-exports"),
  liveUsers: document.querySelector("#metric-live-users"),
  liveUserStack: document.querySelector("#live-user-stack"),
  trendChart: document.querySelector("#trend-chart"),
  countryList: document.querySelector("#country-list"),
  funnelFlow: document.querySelector("#funnel-flow"),
  funnelBars: document.querySelector("#funnel-list"),
  realtimeMap: document.querySelector("#realtime-map"),
  realtimeMapCanvas: document.querySelector("#realtime-map-canvas"),
  realtimeVisitors: document.querySelector("#realtime-visitors"),
  realtimeSessions: document.querySelector("#realtime-sessions"),
  realtimeSparkline: document.querySelector("#realtime-sparkline"),
  realtimeFeed: document.querySelector("#realtime-activity-list")
};

const dashboardState = {
  overview: null,
  countries: [],
  funnel: [],
  realtime: null,
  realtimeMapInstance: null,
  realtimeMapMarkers: null
};

const numberFormatter = new Intl.NumberFormat("en-US");

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

const funnelLabels = {
  page_view: "App Opened",
  upload_completed: "Variant Preview",
  preview_opened: "Style Edit",
  export_started: "Android Export",
  export_completed: "iOS Export"
};

const eventLabels = {
  page_view: "Project page visited",
  upload_completed: "Asset uploaded",
  preview_opened: "Preview opened",
  export_started: "Export started",
  export_completed: "Export completed",
  color_changed: "Color changed",
  zoom_changed: "Zoom changed",
  gradient_applied: "Gradient applied"
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

function formatDayLabel(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC"
  });
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
  return `${deltaHours}h ago`;
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

function getLiveUserBadges(realtime) {
  if (!realtime?.mapPoints?.length) {
    return ["US", "IN", "BD"];
  }

  return realtime.mapPoints
    .slice(0, 3)
    .map((point) => countryFlags[point.country] || point.country.slice(0, 2).toUpperCase());
}

function renderLiveUserStack(realtime) {
  const badges = getLiveUserBadges(realtime);

  adminElements.liveUserStack.innerHTML = badges
    .map((badge, index) => {
      const className = ["live-user-pill-a", "live-user-pill-b", "live-user-pill-c"][index] || "live-user-pill-a";
      return `<span class="live-user-pill ${className}">${badge}</span>`;
    })
    .join("");
}

function renderTrend(trend) {
  if (!trend.length) {
    adminElements.trendChart.innerHTML = '<div class="empty-state">No trend data available yet.</div>';
    return;
  }

  const width = 760;
  const height = 268;
  const padding = { top: 18, right: 18, bottom: 34, left: 38 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...trend.map((item) => Math.max(item.visits, item.exports)), 1);
  const focusIndex = trend.reduce((selectedIndex, item, index, list) => {
    const currentTotal = item.visits + item.exports;
    const selectedTotal = list[selectedIndex].visits + list[selectedIndex].exports;
    return currentTotal >= selectedTotal ? index : selectedIndex;
  }, 0);

  const buildSeries = (key) => {
    return trend.map((item, index) => ({
      x: padding.left + ((chartWidth / Math.max(trend.length - 1, 1)) * index),
      y: padding.top + (chartHeight - ((item[key] / maxValue) * chartHeight)),
      value: item[key],
      label: formatDayLabel(item.date)
    }));
  };

  const visitPoints = buildSeries("visits");
  const exportPoints = buildSeries("exports");
  const focusVisit = visitPoints[focusIndex];
  const focusExport = exportPoints[focusIndex];
  const focusCardWidth = 126;
  const focusCardHeight = 52;
  const tooltipX = Math.min(width - focusCardWidth - 10, focusVisit.x + 14);
  const tooltipY = Math.max(14, focusVisit.y - 12);

  adminElements.trendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="trend-svg" role="img" aria-label="Project activity trends">
      <defs>
        <linearGradient id="trendVisitsArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(116, 183, 255, 0.46)"></stop>
          <stop offset="100%" stop-color="rgba(116, 183, 255, 0.03)"></stop>
        </linearGradient>
        <linearGradient id="trendExportsArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(115, 229, 147, 0.36)"></stop>
          <stop offset="100%" stop-color="rgba(115, 229, 147, 0.02)"></stop>
        </linearGradient>
      </defs>

      ${Array.from({ length: 4 }, (_, index) => {
        const y = padding.top + ((chartHeight / 3) * index);
        const tickValue = Math.round(maxValue - ((maxValue / 3) * index));
        return `
          <g>
            <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="trend-grid-line"></line>
            <text x="${padding.left - 8}" y="${y + 4}" class="trend-axis-text">${tickValue}</text>
          </g>
        `;
      }).join("")}

      <line x1="${focusVisit.x}" y1="${padding.top}" x2="${focusVisit.x}" y2="${height - padding.bottom}" class="trend-focus-line"></line>
      <path d="${buildAreaPath(visitPoints, height - padding.bottom)}" class="trend-area trend-area-visits"></path>
      <path d="${buildAreaPath(exportPoints, height - padding.bottom)}" class="trend-area trend-area-exports"></path>
      <path d="${buildLinePath(visitPoints)}" class="trend-line trend-line-visits"></path>
      <path d="${buildLinePath(exportPoints)}" class="trend-line trend-line-exports"></path>

      ${visitPoints.map((point, index) => `
        <circle cx="${point.x}" cy="${point.y}" r="${index === focusIndex ? 5 : 3.5}" class="trend-point trend-point-visits"></circle>
      `).join("")}
      ${exportPoints.map((point, index) => `
        <circle cx="${point.x}" cy="${point.y}" r="${index === focusIndex ? 5 : 3.5}" class="trend-point trend-point-exports"></circle>
      `).join("")}

      ${trend.map((item, index) => `
        <text x="${padding.left + ((chartWidth / Math.max(trend.length - 1, 1)) * index)}" y="${height - 10}" text-anchor="middle" class="trend-axis-text trend-axis-day">
          ${formatDayLabel(item.date)}
        </text>
      `).join("")}

      <g transform="translate(${tooltipX}, ${tooltipY})">
        <rect width="${focusCardWidth}" height="${focusCardHeight}" rx="14" class="trend-tooltip"></rect>
        <text x="12" y="18" class="trend-tooltip-title">${focusVisit.label}</text>
        <text x="12" y="33" class="trend-tooltip-copy">Visits: ${formatNumber(focusVisit.value)}</text>
        <text x="12" y="46" class="trend-tooltip-copy trend-tooltip-copy-success">Exports: ${formatNumber(focusExport.value)}</text>
      </g>
    </svg>
  `;
}

function renderCountries(countries) {
  if (!countries.length) {
    adminElements.countryList.innerHTML = '<div class="empty-state">No country data yet.</div>';
    return;
  }

  adminElements.countryList.innerHTML = countries
    .slice(0, 5)
    .map((country, index) => {
      const conversion = country.visits ? Math.round((country.exports / country.visits) * 100) : 0;
      let momentum = "steady";

      if (country.exports > country.uploads) {
        momentum = "up";
      } else if (country.exports < country.uploads) {
        momentum = "down";
      }

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
    adminElements.funnelFlow.innerHTML = '<div class="empty-state">No funnel data yet.</div>';
    adminElements.funnelBars.innerHTML = "";
    return;
  }

  const max = Math.max(...funnel.map((item) => item.total), 1);
  const base = funnel[0].total || 1;

  adminElements.funnelFlow.innerHTML = funnel
    .map((item, index) => {
      const previous = funnel[index - 1]?.total || item.total || 1;
      const stepConversion = Math.round((item.total / previous) * 100 || 0);

      return `
        <div class="funnel-step">
          <strong>${funnelLabels[item.step] || item.step}</strong>
          <span>${formatNumber(item.total)} users</span>
          <em>${index === 0 ? 100 : stepConversion}%</em>
        </div>
      `;
    })
    .join("");

  adminElements.funnelBars.innerHTML = funnel
    .map((item) => {
      const height = Math.max(16, (item.total / max) * 84);
      const overall = Math.round((item.total / base) * 100 || 0);

      return `
        <div class="funnel-bar-card">
          <div class="funnel-bar-shell">
            <span class="funnel-bar-fill" style="height:${height}px"></span>
          </div>
          <strong>${overall}%</strong>
          <span>${funnelLabels[item.step] || item.step}</span>
        </div>
      `;
    })
    .join("");
}

function ensureRealtimeMap() {
  if (!adminElements.realtimeMapCanvas || typeof window.L === "undefined") {
    return null;
  }

  if (dashboardState.realtimeMapInstance) {
    return dashboardState.realtimeMapInstance;
  }

  const map = window.L.map(adminElements.realtimeMapCanvas, {
    zoomControl: false,
    attributionControl: true,
    worldCopyJump: true
  }).setView([18, 8], 2);

  window.L.control.zoom({ position: "bottomright" }).addTo(map);

  window.L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
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
    adminElements.realtimeMap.innerHTML = '<div class="empty-state">Map plugin could not be loaded.</div>';
    return;
  }

  dashboardState.realtimeMapMarkers.clearLayers();

  if (!realtime.mapPoints.length) {
    map.setView([18, 8], 2);
    return;
  }

  const bounds = [];

  realtime.mapPoints.forEach((point) => {
    const latLng = [point.lat, point.lng];
    const radius = Math.max(5, Math.min(13, 4 + point.sessions + Math.round(point.events / 2)));

    window.L.circleMarker(latLng, {
      radius: radius + 6,
      color: "rgba(116, 183, 255, 0.18)",
      weight: 1,
      fillColor: "rgba(116, 183, 255, 0.18)",
      fillOpacity: 0.4
    }).addTo(dashboardState.realtimeMapMarkers);

    window.L.circleMarker(latLng, {
      radius,
      color: "#72bcff",
      weight: 2,
      fillColor: "#fff1ab",
      fillOpacity: 0.95
    })
      .bindTooltip(
        `${point.country}: ${formatNumber(point.sessions)} active sessions, ${formatNumber(point.events)} events`,
        { direction: "top", offset: [0, -8] }
      )
      .addTo(dashboardState.realtimeMapMarkers);

    bounds.push(latLng);
  });

  if (bounds.length === 1) {
    map.setView(bounds[0], 3);
  } else {
    map.fitBounds(bounds, { padding: [18, 18], maxZoom: 3 });
  }

  setTimeout(() => {
    map.invalidateSize();
  }, 0);
}

function renderSparkline(realtime) {
  const series = realtime.sparkline.map((item) => item.events);

  if (!series.length) {
    adminElements.realtimeSparkline.innerHTML = "";
    return;
  }

  const width = 320;
  const height = 68;
  const max = Math.max(...series, 1);
  const points = series.map((value, index) => ({
    x: (width / Math.max(series.length - 1, 1)) * index,
    y: height - ((value / max) * (height - 12)) - 6
  }));

  adminElements.realtimeSparkline.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="sparkline-svg" role="img" aria-label="Realtime sessions in the last 30 minutes">
      <defs>
        <linearGradient id="sparklineArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(116, 183, 255, 0.24)"></stop>
          <stop offset="100%" stop-color="rgba(116, 183, 255, 0.02)"></stop>
        </linearGradient>
      </defs>
      <path d="${buildAreaPath(points, height - 2)}" class="sparkline-area"></path>
      <path d="${buildLinePath(points)}" class="sparkline-line"></path>
      ${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="2.3" class="sparkline-point"></circle>`).join("")}
    </svg>
  `;
}

function renderRealtimeFeed(realtime) {
  const feed = realtime.liveActivity.slice(0, 3);

  if (!feed.length) {
    adminElements.realtimeFeed.innerHTML = '<div class="empty-state">No live activity in the last 30 minutes.</div>';
    return;
  }

  const referenceTime = new Date(realtime.asOf);

  adminElements.realtimeFeed.innerHTML = feed
    .map((item) => `
      <div class="feed-item">
        <div>
          <strong>${eventLabels[item.type] || item.type}</strong>
          <p>${item.country} / ${item.platform} / ${item.deviceType}</p>
        </div>
        <span class="feed-pill">${formatRelativeTime(item.createdAt, referenceTime)}</span>
      </div>
    `)
    .join("");
}

function renderDashboard() {
  const { overview, countries, funnel, realtime } = dashboardState;

  adminElements.visitors.textContent = formatNumber(overview.totals.visitors);
  adminElements.projects.textContent = formatNumber(overview.totals.projects);
  adminElements.exports.textContent = formatNumber(overview.totals.exports);
  adminElements.liveUsers.textContent = formatNumber(overview.totals.liveUsers);

  renderLiveUserStack(realtime);
  renderTrend(overview.trend);
  renderCountries(countries);
  renderFunnel(funnel);

  adminElements.realtimeVisitors.textContent = formatNumber(realtime.activeVisitors);
  adminElements.realtimeSessions.textContent = formatNumber(realtime.activeSessions);
  renderRealtimeMap(realtime);
  renderSparkline(realtime);
  renderRealtimeFeed(realtime);
}

async function loadDashboard() {
  const [overview, countries, funnel, realtime] = await Promise.all([
    fetchAdmin("/api/admin/overview"),
    fetchAdmin("/api/admin/countries"),
    fetchAdmin("/api/admin/funnel"),
    fetchAdmin("/api/admin/realtime")
  ]);

  dashboardState.overview = overview;
  dashboardState.countries = countries.countries;
  dashboardState.funnel = funnel.funnel;
  dashboardState.realtime = realtime;

  renderDashboard();
}

function exportDashboardReport() {
  if (!dashboardState.overview) {
    return;
  }

  downloadBlob(
    JSON.stringify(
      {
        overview: dashboardState.overview,
        countries: dashboardState.countries,
        funnel: dashboardState.funnel,
        realtime: dashboardState.realtime
      },
      null,
      2
    ),
    "iconforge-insights-report.json",
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
  adminElements.funnelBars.innerHTML = "";
  adminElements.realtimeMap.innerHTML = errorMarkup;
  adminElements.realtimeSparkline.innerHTML = "";
  adminElements.realtimeFeed.innerHTML = "";
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
