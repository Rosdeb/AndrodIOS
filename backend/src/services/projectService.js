import { randomUUID } from "node:crypto";

import { store } from "../data/store.js";
import { createHttpError } from "../utils/httpError.js";

function listPresets() {
  return [
    {
      id: "preset_glass",
      name: "Glass Bloom",
      shape: "rounded-square",
      background: {
        type: "gradient",
        value: ["#bde0fe", "#a2d2ff"]
      }
    },
    {
      id: "preset_neon",
      name: "Neon Pulse",
      shape: "squircle",
      background: {
        type: "gradient",
        value: ["#ff006e", "#8338ec"]
      }
    },
    {
      id: "preset_soft",
      name: "Soft Clay",
      shape: "rounded-square",
      background: {
        type: "solid",
        value: "#f5ebe0"
      }
    }
  ];
}

function createProject(payload) {
  if (!payload?.name) {
    throw createHttpError(400, "Project name is required");
  }

  const project = {
    id: randomUUID(),
    name: payload.name,
    sourceType: payload.sourceType || "upload",
    platforms: payload.platforms || ["android", "ios"],
    icon: {
      assetUrl: payload.icon?.assetUrl || null,
      assetDataUrl: payload.icon?.assetDataUrl || payload.icon?.assetUrl || null,
      assetName: payload.icon?.assetName || null,
      assetMimeType: payload.icon?.assetMimeType || null,
      foregroundColor: payload.icon?.foregroundColor || "#ffffff",
      backgroundColor: payload.icon?.backgroundColor || "#ffffff",
      gradient: payload.icon?.gradient || null,
      zoom: payload.icon?.zoom ?? 1,
      padding: payload.icon?.padding ?? 16,
      positionX: payload.icon?.positionX ?? 0,
      positionY: payload.icon?.positionY ?? 0,
      shadow: payload.icon?.shadow ?? 12,
      shape: payload.icon?.shape || "rounded-square"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.projects.unshift(project);
  return project;
}

function getProject(projectId) {
  const project = store.projects.find((item) => item.id === projectId);

  if (!project) {
    throw createHttpError(404, "Project not found");
  }

  return project;
}

function updateProject(projectId, payload) {
  const project = getProject(projectId);

  project.name = payload.name || project.name;
  project.platforms = payload.platforms || project.platforms;
  project.icon = {
    ...project.icon,
    ...(payload.icon || {})
  };
  project.updatedAt = new Date().toISOString();

  return project;
}

function buildPreview(projectId) {
  const project = getProject(projectId);

  return {
    projectId,
    preview: {
      android: {
        frame: "Pixel Home Screen",
        cornerStyle: "adaptive-circle",
        background: project.icon.backgroundColor,
        zoom: project.icon.zoom
      },
      ios: {
        frame: "iPhone Home Screen",
        cornerStyle: "superellipse",
        background: project.icon.backgroundColor,
        zoom: project.icon.zoom
      }
    }
  };
}

export const projectService = {
  listPresets,
  createProject,
  getProject,
  updateProject,
  buildPreview
};
