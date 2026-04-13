import { analyticsService } from "../services/analyticsService.js";

function getOverview(_req, res) {
  res.json(analyticsService.getOverview());
}

function getCountries(_req, res) {
  res.json({
    countries: analyticsService.getCountryBreakdown()
  });
}

function getFunnel(_req, res) {
  res.json({
    funnel: analyticsService.getFunnel()
  });
}

function getFeatureUsage(_req, res) {
  res.json({
    features: analyticsService.getFeatureUsage()
  });
}

function getActivity(req, res) {
  const limit = Number(req.query.limit || 10);

  res.json({
    activity: analyticsService.getRecentActivity(limit)
  });
}

function getExports(_req, res) {
  res.json(analyticsService.getExportAnalytics());
}

function getRealtime(req, res) {
  const windowMinutes = Number(req.query.windowMinutes || 30);

  res.json(analyticsService.getRealtimeAnalytics(windowMinutes));
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
