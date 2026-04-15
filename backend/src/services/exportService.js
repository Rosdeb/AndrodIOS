import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, stat, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import sharp from "sharp";

import { getCollections } from "../data/database.js";
import { createHttpError } from "../utils/httpError.js";
import { analyticsService } from "./analyticsService.js";
import { projectService } from "./projectService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../../..");

const androidSizes = [
  { folder: "mipmap-mdpi", size: "48x48", file: "ic_launcher.png" },
  { folder: "mipmap-hdpi", size: "72x72", file: "ic_launcher.png" },
  { folder: "mipmap-xhdpi", size: "96x96", file: "ic_launcher.png" },
  { folder: "mipmap-xxhdpi", size: "144x144", file: "ic_launcher.png" },
  { folder: "mipmap-xxxhdpi", size: "192x192", file: "ic_launcher.png" },
  { folder: "play-store", size: "512x512", file: "playstore.png" }
];

const iosSizes = [
  { role: "iphone-notification-2x", idiom: "iphone", size: "20x20", scale: "2x", pixelSize: "40x40", file: "iphone-notification-20@2x.png" },
  { role: "iphone-notification-3x", idiom: "iphone", size: "20x20", scale: "3x", pixelSize: "60x60", file: "iphone-notification-20@3x.png" },
  { role: "iphone-settings-2x", idiom: "iphone", size: "29x29", scale: "2x", pixelSize: "58x58", file: "iphone-settings-29@2x.png" },
  { role: "iphone-settings-3x", idiom: "iphone", size: "29x29", scale: "3x", pixelSize: "87x87", file: "iphone-settings-29@3x.png" },
  { role: "iphone-spotlight-2x", idiom: "iphone", size: "40x40", scale: "2x", pixelSize: "80x80", file: "iphone-spotlight-40@2x.png" },
  { role: "iphone-spotlight-3x", idiom: "iphone", size: "40x40", scale: "3x", pixelSize: "120x120", file: "iphone-spotlight-40@3x.png" },
  { role: "iphone-app-2x", idiom: "iphone", size: "60x60", scale: "2x", pixelSize: "120x120", file: "iphone-app-60@2x.png" },
  { role: "iphone-app-3x", idiom: "iphone", size: "60x60", scale: "3x", pixelSize: "180x180", file: "iphone-app-60@3x.png" },
  { role: "iphone-message-2x", idiom: "iphone", size: "27x27", scale: "2x", pixelSize: "54x54", file: "iphone-message-27@2x.png" },
  { role: "iphone-message-3x", idiom: "iphone", size: "27x27", scale: "3x", pixelSize: "81x81", file: "iphone-message-27@3x.png" },
  { role: "ipad-notification-1x", idiom: "ipad", size: "20x20", scale: "1x", pixelSize: "20x20", file: "ipad-notification-20.png" },
  { role: "ipad-notification-2x", idiom: "ipad", size: "20x20", scale: "2x", pixelSize: "40x40", file: "ipad-notification-20@2x.png" },
  { role: "ipad-settings-1x", idiom: "ipad", size: "29x29", scale: "1x", pixelSize: "29x29", file: "ipad-settings-29.png" },
  { role: "ipad-settings-2x", idiom: "ipad", size: "29x29", scale: "2x", pixelSize: "58x58", file: "ipad-settings-29@2x.png" },
  { role: "ipad-spotlight-1x", idiom: "ipad", size: "40x40", scale: "1x", pixelSize: "40x40", file: "ipad-spotlight-40.png" },
  { role: "ipad-spotlight-2x", idiom: "ipad", size: "40x40", scale: "2x", pixelSize: "80x80", file: "ipad-spotlight-40@2x.png" },
  { role: "ipad-app-1x", idiom: "ipad", size: "76x76", scale: "1x", pixelSize: "76x76", file: "ipad-app-76.png" },
  { role: "ipad-app-2x", idiom: "ipad", size: "76x76", scale: "2x", pixelSize: "152x152", file: "ipad-app-76@2x.png" },
  { role: "ipad-pro-2x", idiom: "ipad", size: "83.5x83.5", scale: "2x", pixelSize: "167x167", file: "ipad-pro-83.5@2x.png" },
  { role: "ipad-message-1x", idiom: "ipad", size: "27x27", scale: "1x", pixelSize: "27x27", file: "ipad-message-27.png" },
  { role: "ipad-message-2x", idiom: "ipad", size: "27x27", scale: "2x", pixelSize: "54x54", file: "ipad-message-27@2x.png" },
  { role: "ios-marketing", idiom: "ios-marketing", size: "1024x1024", scale: "1x", pixelSize: "1024x1024", file: "appstore.png" }
];

const masterIconSize = 2048;
const editorReferenceSize = 280;
const iosArtworkScaleMultiplier = 0.75;

function sanitizePackageName(name) {
  const normalized = String(name || "app-icons")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "Appicon";
}

function buildPackageName(baseName) {
  return `${sanitizePackageName(baseName)}.zip`;
}

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return null;
  }

  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/);

  if (!match) {
    return null;
  }

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const data = match[3] || "";

  return {
    mimeType,
    buffer: isBase64
      ? Buffer.from(data, "base64")
      : Buffer.from(decodeURIComponent(data), "utf8")
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getOutputPixelSize(sizeLabel) {
  return Math.round(Number(String(sizeLabel).split("x")[0]));
}

function getArtworkScale(project) {
  const padding = Number(project.icon.padding ?? 18);
  const zoom = Number(project.icon.zoom ?? 1);
  const basePercent = 96 - Math.min(24, padding * 0.55);

  return clamp((Math.max(76, basePercent) / 100) * zoom, 0.28, 1.6);
}

function getContainedArtworkScale(project, scaleMultiplier = 1) {
  const padding = Number(project.icon.padding ?? 18);
  const zoom = Number(project.icon.zoom ?? 1);
  const baseScale = getArtworkScale(project) * scaleMultiplier;
  const paddingBias = clamp((padding - 18) * 0.004, -0.04, 0.06);
  const zoomBias = clamp((zoom - 1) * 0.18, -0.08, 0.1);
  const safeScale = clamp(0.62 + paddingBias + zoomBias, 0.5, 0.76);

  return Math.min(baseScale, safeScale);
}

function getArtworkOffset(project, size) {
  const x = Number(project.icon.positionX ?? 0);
  const y = Number(project.icon.positionY ?? 0);
  const ratio = size / editorReferenceSize;

  return {
    x: Math.round(x * ratio),
    y: Math.round(y * ratio)
  };
}

function buildTextOverlaySvg(project, size, scaleMultiplier = 1) {
  const text = String(project.icon.text ?? "");
  const baseFontSize = text.length >= 3
    ? Math.round(size * 0.27)
    : text.length === 2
      ? Math.round(size * 0.34)
      : Math.round(size * 0.5);
  const fontSize = Math.max(1, Math.round(baseFontSize * scaleMultiplier));

  return Buffer.from(
    `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <text
          x="50%"
          y="52%"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="Inter, Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="700"
          fill="${escapeXml(project.icon.foregroundColor || "#1a2130")}">${escapeXml(text)}</text>
      </svg>
    `.trim()
  );
}

async function buildArtworkLayer(project, sourceAsset, size, scaleMultiplier = 1) {
  if (!sourceAsset?.buffer) {
    return buildTextOverlaySvg(project, size, scaleMultiplier);
  }

  const artworkScale = getContainedArtworkScale(project, scaleMultiplier);
  const scaledSize = Math.max(1, Math.round(size * artworkScale));
  const { x, y } = getArtworkOffset(project, size);
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const scaledBuffer = await sharp(sourceAsset.buffer)
    .resize({
      width: scaledSize,
      height: scaledSize,
      fit: "contain",
      withoutEnlargement: false,
      background: transparent,
      kernel: sharp.kernel.lanczos3
    })
    .png()
    .toBuffer();

  const left = clamp(Math.round((size - scaledSize) / 2 + x), 0, size - scaledSize);
  const top = clamp(Math.round((size - scaledSize) / 2 + y), 0, size - scaledSize);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: transparent
    }
  })
    .composite([
      {
        input: scaledBuffer,
        left,
        top,
        blend: "over"
      }
    ])
    .png()
    .toBuffer();
}

async function renderMasterIcon(project, sourceAsset, options = {}) {
  const scaleMultiplier = options.scaleMultiplier ?? 1;
  const backgroundColor = project.icon.backgroundColor || "#ffffff";
  const canvas = sharp({
    create: {
      width: masterIconSize,
      height: masterIconSize,
      channels: 4,
      background: backgroundColor
    }
  });
  const artworkLayer = await buildArtworkLayer(project, sourceAsset, masterIconSize, scaleMultiplier);
  const artworkBlend = sourceAsset?.buffer && project.icon.blendWhiteBackground ? "multiply" : "over";

  return canvas
    .composite([
      {
        input: artworkLayer,
        blend: artworkBlend
      }
    ])
    .flatten({ background: backgroundColor })
    .png()
    .toBuffer();
}

async function renderOutputIcon(masterBuffer, pixelSize) {
  return sharp(masterBuffer)
    .resize(pixelSize, pixelSize, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3
    })
    .sharpen({
      sigma: 0.65,
      m1: 0.8,
      m2: 2,
      x1: 2,
      y2: 10,
      y3: 20
    })
    .removeAlpha()
    .png()
    .toBuffer();
}

async function loadProjectAsset(project) {
  const inlineAsset = parseDataUrl(project.icon.assetDataUrl);

  if (inlineAsset) {
    return inlineAsset;
  }

  const assetPath = project.icon.assetUrl || project.icon.assetDataUrl;

  if (typeof assetPath !== "string" || !assetPath.startsWith("/website/")) {
    return null;
  }

  const resolvedPath = path.join(workspaceRoot, assetPath.replace(/^\//, ""));

  try {
    return {
      mimeType: project.icon.assetMimeType || "application/octet-stream",
      buffer: await readFile(resolvedPath)
    };
  } catch {
    return null;
  }
}

function buildContentsJson() {
  return {
    images: iosSizes
      .filter((item) => item.idiom !== "ios-marketing")
      .map((item) => ({
        filename: item.file,
        idiom: item.idiom,
        scale: item.scale,
        size: item.size,
        role: item.role,
        ...(item.subtype ? { subtype: item.subtype } : {})
      })),
    info: {
      author: "iconforge-studio",
      version: 1
    }
  };
}

async function createFileSet(rootDirectory, packageRootName, project, platforms) {
  const exportRoot = path.join(rootDirectory, packageRootName);
  const sourceAsset = await loadProjectAsset(project);
  const renderedAndroidMasterIcon = platforms.includes("android")
    ? await renderMasterIcon(project, sourceAsset)
    : null;
  const renderedIosMasterIcon = platforms.includes("ios")
    ? await renderMasterIcon(project, sourceAsset, { scaleMultiplier: iosArtworkScaleMultiplier })
    : null;

  await mkdir(exportRoot, { recursive: true });

  if (platforms.includes("android")) {
    for (const item of androidSizes) {
      const destination = item.folder === "play-store"
        ? path.join(exportRoot, item.file)
        : path.join(exportRoot, "android", item.folder, item.file);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, await renderOutputIcon(renderedAndroidMasterIcon, getOutputPixelSize(item.size)));
    }
  }

  if (platforms.includes("ios")) {
    const marketingIcon = iosSizes.find((item) => item.idiom === "ios-marketing");
    const assetCatalogIcons = iosSizes.filter((item) => item.idiom !== "ios-marketing");
    const appIconSetDirectory = path.join(exportRoot, "ios", "AppIcon.appiconset");
    await mkdir(appIconSetDirectory, { recursive: true });

    for (const item of assetCatalogIcons) {
      await writeFile(
        path.join(appIconSetDirectory, item.file),
        await renderOutputIcon(renderedIosMasterIcon, getOutputPixelSize(item.pixelSize))
      );
    }

    if (marketingIcon) {
      await writeFile(
        path.join(exportRoot, marketingIcon.file),
        await renderOutputIcon(renderedIosMasterIcon, getOutputPixelSize(marketingIcon.pixelSize))
      );
    }

    await writeFile(
      path.join(appIconSetDirectory, "Contents.json"),
      JSON.stringify(buildContentsJson(), null, 2)
    );
  }

  return exportRoot;
}

async function addDirectoryToZip(zip, directoryPath, zipPrefix) {
  const entries = await readdir(directoryPath);

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry);
    const stats = await stat(absolutePath);
    const zipPath = `${zipPrefix}/${entry}`;

    if (stats.isDirectory()) {
      await addDirectoryToZip(zip, absolutePath, zipPath);
      continue;
    }

    zip.file(zipPath, await readFile(absolutePath));
  }
}

async function buildZipBuffer(exportRoot, packageRootName) {
  const zip = new JSZip();
  await addDirectoryToZip(zip, exportRoot, packageRootName);

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9
    }
  });
}

async function createExport(projectId, payload = {}) {
  const { exports } = await getCollections();
  const project = await projectService.getProject(projectId);
  const platforms = payload.platforms || project.platforms || ["android", "ios"];
  const country = payload.country || payload.analytics?.country || "Unknown";
  const exportId = randomUUID();
  const packageName = buildPackageName(
    payload.exportFileName ||
    project.icon?.exportFileName ||
    project.name
  );

  if (!Array.isArray(platforms) || platforms.length === 0) {
    throw createHttpError(400, "At least one export platform is required");
  }

  const exportRecord = {
    id: exportId,
    projectId,
    type: payload.type || "zip",
    platforms,
    status: "completed",
    country,
    createdAt: new Date().toISOString(),
    files: {
      android: platforms.includes("android")
        ? androidSizes.map((item) => item.folder === "play-store" ? item.file : `${item.folder}/${item.file}`)
        : [],
      ios: platforms.includes("ios")
        ? [
            ...iosSizes.map((item) => item.idiom === "ios-marketing" ? item.file : `AppIcon.appiconset/${item.file}`),
            "AppIcon.appiconset/Contents.json"
          ]
        : []
    }
  };

  await exports.insertOne(exportRecord);

  await analyticsService.trackEvent({
    type: "export_completed",
    country,
    platform:
      platforms.length === 2 ? "android-ios" : platforms[0],
    deviceType: payload.deviceType || payload.analytics?.deviceType || "desktop",
    metadata: {
      exportId,
      projectId,
      exportTarget: platforms.length === 2 ? "both" : platforms[0],
      ...((payload.sessionId || payload.analytics?.sessionId)
        ? { sessionId: payload.sessionId || payload.analytics?.sessionId }
        : {})
    }
  });

  return {
    exportId,
    projectId,
    packageName,
    platforms,
    manifest: {
      android: platforms.includes("android") ? androidSizes : [],
      ios: platforms.includes("ios") ? iosSizes : []
    },
    files: exportRecord.files
  };
}

async function createExportArchive(projectId, payload = {}) {
  const exportResult = await createExport(projectId, payload);
  const project = await projectService.getProject(projectId);
  const workingDirectory = await mkdtemp(path.join(os.tmpdir(), "iconforge-export-"));
  const packageRootName = exportResult.packageName.replace(/\.zip$/i, "");

  try {
    const exportRoot = await createFileSet(
      workingDirectory,
      packageRootName,
      project,
      exportResult.platforms
    );
    const zipBuffer = await buildZipBuffer(exportRoot, packageRootName);

    return {
      ...exportResult,
      zipBuffer
    };
  } catch (error) {
    throw error;
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}

async function listExports() {
  const { exports } = await getCollections();
  return exports
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
}

export const exportService = {
  createExport,
  createExportArchive,
  listExports
};
