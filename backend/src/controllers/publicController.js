import { analyticsService } from "../services/analyticsService.js";
import { exportService } from "../services/exportService.js";
import { projectService } from "../services/projectService.js";

function getPresets(_req, res) {
  res.json({
    presets: projectService.listPresets()
  });
}

function createProject(req, res) {
  const project = projectService.createProject(req.body);

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

  res.json(preview);
}

async function createExport(req, res, next) {
  try {
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
  const event = analyticsService.trackEvent(req.body);

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
