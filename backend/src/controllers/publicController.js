import { analyticsService } from "../services/analyticsService.js";
import { exportService } from "../services/exportService.js";
import { projectService } from "../services/projectService.js";

const regionDisplayNames = typeof Intl.DisplayNames === "function"
  ? new Intl.DisplayNames(["en"], { type: "region" })
  : null;

const countryCodeAliases = {
  US: "United States",
  GB: "United Kingdom",
  UK: "United Kingdom",
  BD: "Bangladesh",
  IN: "India",
  DE: "Germany",
  BR: "Brazil",
  FR: "France",
  JP: "Japan"
};

function inferDeviceType(userAgent = "") {
  return /android|iphone|ipad|mobile/i.test(userAgent) ? "mobile" : "desktop";
}

function resolveCountryName(value) {
  const input = String(value || "").trim();

  if (!input) {
    return null;
  }

  const upper = input.toUpperCase();

  if (countryCodeAliases[upper]) {
    return countryCodeAliases[upper];
  }

  if (/^[A-Z]{2}$/.test(upper) && regionDisplayNames) {
    const regionName = regionDisplayNames.of(upper);
    return regionName || upper;
  }

  return input;
}

function getCountryFromAcceptLanguage(headerValue = "") {
  const primary = String(headerValue)
    .split(",")[0]
    .trim();
  const match = primary.match(/[-_]([A-Za-z]{2})$/);

  if (!match) {
    return null;
  }

  return resolveCountryName(match[1]);
}

function resolveRequestCountry(req, ...candidates) {
  for (const candidate of candidates) {
    const country = resolveCountryName(candidate);

    if (country) {
      return country;
    }
  }

  return getCountryFromAcceptLanguage(req.headers["accept-language"]);
}

function normalizeTrackingContext(req, overrides = {}) {
  const body = req.body || {};
  const analytics = body.analytics || {};
  const userAgent = req.headers["user-agent"] || "";
  const sessionId =
    overrides.sessionId ||
    body.sessionId ||
    analytics.sessionId ||
    req.headers["x-session-id"] ||
    null;
  const projectId =
    overrides.projectId ||
    req.params.projectId ||
    body.projectId ||
    analytics.projectId ||
    null;

  return {
    country: resolveRequestCountry(
      req,
      overrides.country,
      body.country,
      analytics.country,
      req.headers["x-country"],
      req.headers["cf-ipcountry"],
      req.headers["x-vercel-ip-country"],
      req.headers["x-country-code"],
      req.headers["x-appengine-country"],
      req.headers["fly-client-country"]
    ) || "Unknown",
    platform:
      overrides.platform ||
      body.platform ||
      analytics.platform ||
      "web",
    deviceType:
      overrides.deviceType ||
      body.deviceType ||
      analytics.deviceType ||
      inferDeviceType(userAgent),
    metadata: {
      ...(analytics.metadata || {}),
      ...(body.metadata || {}),
      ...(overrides.metadata || {}),
      ...(sessionId ? { sessionId } : {}),
      ...(projectId ? { projectId } : {})
    }
  };
}

function getPresets(_req, res) {
  res.json({
    presets: projectService.listPresets()
  });
}

function createProject(req, res) {
  const project = projectService.createProject(req.body);
  const hasUploadedAsset = Boolean(
    project.icon.assetName || project.icon.assetUrl || project.icon.assetDataUrl
  );

  if (hasUploadedAsset || project.sourceType === "upload") {
    analyticsService.trackEvent({
      type: "upload_completed",
      ...normalizeTrackingContext(req, {
        projectId: project.id,
        metadata: {
          sourceType: project.sourceType,
          assetName: project.icon.assetName || null,
          fileType: project.icon.assetMimeType || null
        }
      })
    });
  }

  res.status(201).json({
    project
  });
}

function getProject(req, res) {
  const project = projectService.getProject(req.params.projectId);

  res.json({
    project
  });
}

function updateProject(req, res) {
  const project = projectService.updateProject(req.params.projectId, req.body);

  res.json({
    project
  });
}

function getPreview(req, res) {
  const preview = projectService.buildPreview(req.params.projectId);

  analyticsService.trackEvent({
    type: "preview_opened",
    ...normalizeTrackingContext(req, {
      projectId: req.params.projectId,
      metadata: {
        previewMode: req.query.mode || "device"
      }
    })
  });

  res.json(preview);
}

async function createExport(req, res, next) {
  try {
    analyticsService.trackEvent({
      type: "export_started",
      ...normalizeTrackingContext(req, {
        projectId: req.params.projectId,
        platform:
          Array.isArray(req.body?.platforms) && req.body.platforms.length === 2
            ? "android-ios"
            : req.body?.platform ||
              req.body?.platforms?.[0] ||
              "web",
        metadata: {
          exportTarget:
            Array.isArray(req.body?.platforms) && req.body.platforms.length === 2
              ? "both"
              : req.body?.platforms?.[0] || req.body?.platform || "web"
        }
      })
    });

    const exportResult = await exportService.createExportArchive(req.params.projectId, req.body);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${exportResult.packageName}"`);
    res.setHeader("X-Export-Id", exportResult.exportId);
    res.setHeader("X-Project-Id", exportResult.projectId);
    res.status(201).send(exportResult.zipBuffer);
  } catch (error) {
    next(error);
  }
}

function trackEvent(req, res) {
  const event = analyticsService.trackEvent({
    ...req.body,
    ...normalizeTrackingContext(req, {
      metadata: req.body?.metadata || {}
    })
  });

  res.status(201).json({
    event
  });
}

export const publicController = {
  getPresets,
  createProject,
  getProject,
  updateProject,
  getPreview,
  createExport,
  trackEvent
};
