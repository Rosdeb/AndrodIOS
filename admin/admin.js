const adminElements = {
  keyInput: document.querySelector("#admin-key-input"),
  loadButton: document.querySelector("#load-dashboard-button"),
  visitors: document.querySelector("#metric-visitors"),
  projects: document.querySelector("#metric-projects"),
  exports: document.querySelector("#metric-exports"),
  liveUsers: document.querySelector("#metric-live-users"),
  trendChart: document.querySelector("#trend-chart"),
  countryList: document.querySelector("#country-list"),
  funnelList: document.querySelector("#funnel-list"),
  platformAndroid: document.querySelector("#platform-android"),
  platformIos: document.querySelector("#platform-ios"),
  platformBoth: document.querySelector("#platform-both"),
  activityList: document.querySelector("#activity-list")
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

function renderTrend(trend) {
  const maxValue = Math.max(...trend.map((item) => Math.max(item.visits, item.exports)), 1);

  adminElements.trendChart.innerHTML = trend
    .map((item) => {
      const height = Math.max(item.visits, item.exports) / maxValue * 180;
      return `
        <div class="trend-bar">
          <div class="trend-bar-fill" style="height:${height}px"></div>
          <strong>${item.exports}</strong>
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
  adminElements.projects.textContent = overview.totals.projects;
  adminElements.exports.textContent = overview.totals.exports;
  adminElements.liveUsers.textContent = overview.totals.liveUsers;
  adminElements.platformAndroid.textContent = overview.platformBreakdown.android;
  adminElements.platformIos.textContent = overview.platformBreakdown.ios;
  adminElements.platformBoth.textContent = overview.platformBreakdown.both;

  renderTrend(overview.trend);
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
