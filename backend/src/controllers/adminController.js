import { analyticsService } from "../services/analyticsService.js";

async function getOverview(_req, res) {
  res.json(await analyticsService.getOverview());
}

async function getCountries(_req, res) {
  res.json({
    countries: await analyticsService.getCountryBreakdown()
  });
}

async function getFunnel(_req, res) {
  res.json({
    funnel: await analyticsService.getFunnel()
  });
}

async function getFeatureUsage(_req, res) {
  res.json({
    features: await analyticsService.getFeatureUsage()
  });
}

async function getActivity(req, res) {
  const limit = Number(req.query.limit || 10);

  res.json({
    activity: await analyticsService.getRecentActivity(limit)
  });
}

async function getExports(_req, res) {
  res.json(await analyticsService.getExportAnalytics());
}

async function getRealtime(req, res) {
  const windowMinutes = Number(req.query.windowMinutes || 30);

  res.json(await analyticsService.getRealtimeAnalytics(windowMinutes));
}

export const adminController = {
  getOverview,
  getCountries,
  getFunnel,
  getFeatureUsage,
  getActivity,
  getExports,
  getRealtime
};
