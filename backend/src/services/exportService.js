import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { store } from "../data/store.js";
import { createHttpError } from "../utils/httpError.js";
import { analyticsService } from "./analyticsService.js";
import { projectService } from "./projectService.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../../..");

const androidSizes = [
  { folder: "mipmap-mdpi", size: "48x48", file: "ic_launcher.png" },
  { folder: "mipmap-hdpi", size: "72x72", file: "ic_launcher.png" },
  { folder: "mipmap-xhdpi", size: "96x96", file: "ic_launcher.png" },
  { folder: "mipmap-xxhdpi", size: "144x144", file: "ic_launcher.png" },
  { folder: "mipmap-xxxhdpi", size: "192x192", file: "ic_launcher.png" },
  { folder: "play-store", size: "512x512", file: "play-store-512.png" }
];

const iosSizes = [
  { role: "iphone-notification-2x", idiom: "iphone", size: "20x20", scale: "2x", pixelSize: "40x40", file: "Icon-iPhone-Notification-20x20@2x.png" },
  { role: "iphone-notification-3x", idiom: "iphone", size: "20x20", scale: "3x", pixelSize: "60x60", file: "Icon-iPhone-Notification-20x20@3x.png" },
  { role: "iphone-settings-2x", idiom: "iphone", size: "29x29", scale: "2x", pixelSize: "58x58", file: "Icon-iPhone-Settings-29x29@2x.png" },
  { role: "iphone-settings-3x", idiom: "iphone", size: "29x29", scale: "3x", pixelSize: "87x87", file: "Icon-iPhone-Settings-29x29@3x.png" },
  { role: "iphone-spotlight-2x", idiom: "iphone", size: "40x40", scale: "2x", pixelSize: "80x80", file: "Icon-iPhone-Spotlight-40x40@2x.png" },
  { role: "iphone-spotlight-3x", idiom: "iphone", size: "40x40", scale: "3x", pixelSize: "120x120", file: "Icon-iPhone-Spotlight-40x40@3x.png" },
  { role: "iphone-app-2x", idiom: "iphone", size: "60x60", scale: "2x", pixelSize: "120x120", file: "Icon-iPhone-App-60x60@2x.png" },
  { role: "iphone-app-3x", idiom: "iphone", size: "60x60", scale: "3x", pixelSize: "180x180", file: "Icon-iPhone-App-60x60@3x.png" },
  { role: "iphone-marketing", idiom: "ios-marketing", size: "1024x1024", scale: "1x", pixelSize: "1024x1024", file: "Icon-App-Store-1024x1024@1x.png" },
  { role: "iphone-message-2x", idiom: "iphone", size: "27x27", scale: "2x", pixelSize: "54x54", file: "Icon-iPhone-Message-27x27@2x.png" },
  { role: "iphone-message-3x", idiom: "iphone", size: "27x27", scale: "3x", pixelSize: "81x81", file: "Icon-iPhone-Message-27x27@3x.png" },
  { role: "ipad-notification-1x", idiom: "ipad", size: "20x20", scale: "1x", pixelSize: "20x20", file: "Icon-iPad-Notification-20x20@1x.png" },
  { role: "ipad-notification-2x", idiom: "ipad", size: "20x20", scale: "2x", pixelSize: "40x40", file: "Icon-iPad-Notification-20x20@2x.png" },
  { role: "ipad-settings-1x", idiom: "ipad", size: "29x29", scale: "1x", pixelSize: "29x29", file: "Icon-iPad-Settings-29x29@1x.png" },
  { role: "ipad-settings-2x", idiom: "ipad", size: "29x29", scale: "2x", pixelSize: "58x58", file: "Icon-iPad-Settings-29x29@2x.png" },
  { role: "ipad-spotlight-1x", idiom: "ipad", size: "40x40", scale: "1x", pixelSize: "40x40", file: "Icon-iPad-Spotlight-40x40@1x.png" },
  { role: "ipad-spotlight-2x", idiom: "ipad", size: "40x40", scale: "2x", pixelSize: "80x80", file: "Icon-iPad-Spotlight-40x40@2x.png" },
  { role: "ipad-app-1x", idiom: "ipad", size: "76x76", scale: "1x", pixelSize: "76x76", file: "Icon-iPad-App-76x76@1x.png" },
  { role: "ipad-app-2x", idiom: "ipad", size: "76x76", scale: "2x", pixelSize: "152x152", file: "Icon-iPad-App-76x76@2x.png" },
  { role: "ipad-pro-2x", idiom: "ipad", size: "83.5x83.5", scale: "2x", pixelSize: "167x167", file: "Icon-iPad-Pro-83.5x83.5@2x.png" },
  { role: "ipad-marketing", idiom: "ios-marketing", size: "1024x1024", scale: "1x", pixelSize: "1024x1024", file: "Icon-iPad-App-Store-1024x1024@1x.png" },
  { role: "ipad-stage-manager-2x", idiom: "ipad", size: "50x50", scale: "2x", pixelSize: "100x100", file: "Icon-iPad-Stage-Manager-50x50@2x.png" },
  { role: "ipad-message-1x", idiom: "ipad", size: "27x27", scale: "1x", pixelSize: "27x27", file: "Icon-iPad-Message-27x27@1x.png" },
  { role: "ipad-message-2x", idiom: "ipad", size: "27x27", scale: "2x", pixelSize: "54x54", file: "Icon-iPad-Message-27x27@2x.png" },
  { role: "watch-notification-38mm", idiom: "watch", size: "24x24", scale: "2x", subtype: "38mm", pixelSize: "48x48", file: "Icon-Watch-Notification-24x24@2x-38mm.png" },
  { role: "watch-notification-42mm", idiom: "watch", size: "27.5x27.5", scale: "2x", subtype: "42mm", pixelSize: "55x55", file: "Icon-Watch-Notification-27.5x27.5@2x-42mm.png" },
  { role: "watch-home-38mm", idiom: "watch", size: "29x29", scale: "2x", subtype: "38mm", pixelSize: "58x58", file: "Icon-Watch-Home-29x29@2x-38mm.png" },
  { role: "watch-home-42mm", idiom: "watch", size: "29x29", scale: "3x", subtype: "42mm", pixelSize: "87x87", file: "Icon-Watch-Home-29x29@3x-42mm.png" },
  { role: "watch-short-look-38mm", idiom: "watch", size: "40x40", scale: "2x", subtype: "38mm", pixelSize: "80x80", file: "Icon-Watch-ShortLook-40x40@2x-38mm.png" },
  { role: "watch-short-look-42mm", idiom: "watch", size: "44x44", scale: "2x", subtype: "42mm", pixelSize: "88x88", file: "Icon-Watch-ShortLook-44x44@2x-42mm.png" },
  { role: "watch-app-store", idiom: "watch-marketing", size: "1024x1024", scale: "1x", pixelSize: "1024x1024", file: "Icon-Watch-App-Store-1024x1024@1x.png" },
  { role: "watch-companion-settings", idiom: "watch", size: "29x29", scale: "2x", subtype: "companion-settings", pixelSize: "58x58", file: "Icon-Watch-Companion-Settings-29x29@2x.png" },
  { role: "mac-16", idiom: "mac", size: "16x16", scale: "1x", pixelSize: "16x16", file: "Icon-macOS-16x16@1x.png" },
  { role: "mac-16-2x", idiom: "mac", size: "16x16", scale: "2x", pixelSize: "32x32", file: "Icon-macOS-16x16@2x.png" },
  { role: "mac-32", idiom: "mac", size: "32x32", scale: "1x", pixelSize: "32x32", file: "Icon-macOS-32x32@1x.png" },
  { role: "mac-32-2x", idiom: "mac", size: "32x32", scale: "2x", pixelSize: "64x64", file: "Icon-macOS-32x32@2x.png" },
  { role: "mac-128", idiom: "mac", size: "128x128", scale: "1x", pixelSize: "128x128", file: "Icon-macOS-128x128@1x.png" },
  { role: "mac-128-2x", idiom: "mac", size: "128x128", scale: "2x", pixelSize: "256x256", file: "Icon-macOS-128x128@2x.png" },
  { role: "mac-256", idiom: "mac", size: "256x256", scale: "1x", pixelSize: "256x256", file: "Icon-macOS-256x256@1x.png" },
  { role: "mac-256-2x", idiom: "mac", size: "256x256", scale: "2x", pixelSize: "512x512", file: "Icon-macOS-256x256@2x.png" },
  { role: "mac-512", idiom: "mac", size: "512x512", scale: "1x", pixelSize: "512x512", file: "Icon-macOS-512x512@1x.png" },
  { role: "mac-512-2x", idiom: "mac", size: "512x512", scale: "2x", pixelSize: "1024x1024", file: "Icon-macOS-512x512@2x.png" },
  { role: "mac-marketing", idiom: "mac-marketing", size: "1024x1024", scale: "1x", pixelSize: "1024x1024", file: "Icon-macOS-App-Store-1024x1024@1x.png" }
];

const masterIconSize = 1024;
const editorReferenceSize = 280;

function sanitizePackageName(name) {
  const normalized = String(name || "app-icons")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "app-icons";
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

function clampText(value) {
  return String(value || "")
    .trim()
    .slice(0, 2)
    .toUpperCase() || "IF";
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

function getArtworkOffset(project, size) {
  const x = Number(project.icon.positionX ?? 0);
  const y = Number(project.icon.positionY ?? 0);
  const ratio = size / editorReferenceSize;

  return {
    x: Math.round(x * ratio),
    y: Math.round(y * ratio)
  };
}

function buildTextOverlaySvg(project, size) {
  const text = clampText(project.icon.text || project.name);
  const fontSize = text.length === 1 ? Math.round(size * 0.5) : Math.round(size * 0.34);

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

async function buildArtworkLayer(project, sourceAsset, size) {
  if (!sourceAsset?.buffer) {
    return buildTextOverlaySvg(project, size);
  }

  const artworkScale = getArtworkScale(project);
  const scaledSize = Math.max(1, Math.round(size * artworkScale));
  const { x, y } = getArtworkOffset(project, size);
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const containedBuffer = await sharp(sourceAsset.buffer)
    .resize({
      width: size,
      height: size,
      fit: "contain",
      withoutEnlargement: false,
      background: transparent
    })
    .png()
    .toBuffer();
  const scaledBuffer = await sharp(containedBuffer)
    .resize(scaledSize, scaledSize, {
      fit: "fill"
    })
    .png()
    .toBuffer();

  if (scaledSize >= size) {
    const maxInset = scaledSize - size;
    const left = clamp(Math.round((scaledSize - size) / 2 - x), 0, maxInset);
    const top = clamp(Math.round((scaledSize - size) / 2 - y), 0, maxInset);

    return sharp(scaledBuffer)
      .extract({
        left,
        top,
        width: size,
        height: size
      })
      .png()
      .toBuffer();
  }

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

async function renderMasterIcon(project, sourceAsset) {
  const backgroundColor = project.icon.backgroundColor || "#ffffff";
  const canvas = sharp({
    create: {
      width: masterIconSize,
      height: masterIconSize,
      channels: 4,
      background: backgroundColor
    }
  });
  const artworkLayer = await buildArtworkLayer(project, sourceAsset, masterIconSize);
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
      fit: "fill"
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
    images: iosSizes.map((item) => ({
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
  const sourceExtension =
    project.icon.assetMimeType === "image/svg+xml"
      ? "svg"
      : project.icon.assetMimeType === "image/jpeg"
        ? "jpg"
        : "png";
  const renderedMasterIcon = await renderMasterIcon(project, sourceAsset);
  const readmeLines = [
    `Project: ${project.name}`,
    `Platforms: ${platforms.join(", ")}`,
    "",
    "This export packages rendered Android and iOS icon PNGs based on your saved",
    "editor settings, plus the project manifest and original uploaded source asset."
  ];

  await mkdir(exportRoot, { recursive: true });
  await writeFile(
    path.join(exportRoot, "manifest.json"),
    JSON.stringify(
      {
        projectId: project.id,
        name: project.name,
        generatedAt: new Date().toISOString(),
        platforms,
        icon: {
          text: project.icon.text,
          shape: project.icon.shape,
          backgroundColor: project.icon.backgroundColor,
          foregroundColor: project.icon.foregroundColor,
          zoom: project.icon.zoom,
          padding: project.icon.padding,
          blendWhiteBackground: project.icon.blendWhiteBackground,
          shadow: project.icon.shadow
        },
        outputs: {
          android: platforms.includes("android") ? androidSizes : [],
          ios: platforms.includes("ios") ? iosSizes : []
        }
      },
      null,
      2
    )
  );
  await writeFile(path.join(exportRoot, "README.txt"), readmeLines.join("\n"));

  if (sourceAsset) {
    const sourceDirectory = path.join(exportRoot, "source");
    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(
      path.join(sourceDirectory, `original-icon.${sourceExtension}`),
      sourceAsset.buffer
    );
  }

  if (platforms.includes("android")) {
    for (const item of androidSizes) {
      const destination = path.join(exportRoot, "android", item.folder, item.file);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, await renderOutputIcon(renderedMasterIcon, getOutputPixelSize(item.size)));
    }
  }

  if (platforms.includes("ios")) {
    const appIconSetDirectory = path.join(exportRoot, "ios", "AppIcon.appiconset");
    await mkdir(appIconSetDirectory, { recursive: true });

    for (const item of iosSizes) {
      await writeFile(
        path.join(appIconSetDirectory, item.file),
        await renderOutputIcon(renderedMasterIcon, getOutputPixelSize(item.pixelSize))
      );
    }

    await writeFile(
      path.join(appIconSetDirectory, "Contents.json"),
      JSON.stringify(buildContentsJson(), null, 2)
    );
  }

  return exportRoot;
}

async function buildZipBuffer(exportRoot, packageRootName) {
  const zipFilePath = path.join(path.dirname(exportRoot), `${packageRootName}.zip`);
  await execFileAsync("zip", ["-rq", zipFilePath, packageRootName], {
    cwd: path.dirname(exportRoot)
  });

  const buffer = await readFile(zipFilePath);
  await rm(zipFilePath, { force: true });
  return buffer;
}

function createExport(projectId, payload = {}) {
  const project = projectService.getProject(projectId);
  const platforms = payload.platforms || project.platforms || ["android", "ios"];
  const country = payload.country || "Unknown";
  const exportId = randomUUID();

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
        ? androidSizes.map((item) => `${item.folder}/${item.file}`)
        : [],
      ios: platforms.includes("ios")
        ? [
            ...iosSizes.map((item) => `AppIcon.appiconset/${item.file}`),
            "AppIcon.appiconset/Contents.json"
          ]
        : []
    }
  };

  store.exports.unshift(exportRecord);

  analyticsService.trackEvent({
    type: "export_completed",
    country,
    platform:
      platforms.length === 2 ? "android-ios" : platforms[0],
    deviceType: payload.deviceType || "desktop",
    metadata: {
      exportId,
      exportTarget: platforms.length === 2 ? "both" : platforms[0]
    }
  });

  return {
    exportId,
    projectId,
    packageName: `${sanitizePackageName(project.name)}-icons.zip`,
    platforms,
    manifest: {
      android: platforms.includes("android") ? androidSizes : [],
      ios: platforms.includes("ios") ? iosSizes : []
    },
    files: exportRecord.files
  };
}

async function createExportArchive(projectId, payload = {}) {
  const exportResult = createExport(projectId, payload);
  const project = projectService.getProject(projectId);
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
    if (error.code === "ENOENT") {
      throw createHttpError(500, "Zip tooling is not available on the server");
    }

    throw error;
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}

function listExports() {
  return store.exports;
}

export const exportService = {
  createExport,
  createExportArchive,
  listExports
};
