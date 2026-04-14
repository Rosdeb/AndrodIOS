const defaultAssetPath = "/website/assets/icons/app-builder-icon.png";
const maxIconTextLength = 3;
const maxUploadSizeBytes = 10 * 1024 * 1024;

const regionDisplayNames = typeof Intl.DisplayNames === "function"
  ? new Intl.DisplayNames(["en"], { type: "region" })
  : null;
const timezoneCountryFallbacks = {
  "Asia/Dhaka": "Bangladesh",
  "Asia/Kolkata": "India",
  "Asia/Tokyo": "Japan",
  "Europe/Berlin": "Germany",
  "Europe/Paris": "France",
  "Europe/London": "United Kingdom",
  "America/New_York": "United States",
  "America/Chicago": "United States",
  "America/Denver": "United States",
  "America/Los_Angeles": "United States",
  "America/Sao_Paulo": "Brazil"
};

const state = {
  projectId: null,
  sessionId: "",
  projectName: "AppIcon",
  exportFileName: "appicon",
  selectedPlatforms: ["android", "ios"],
  backgroundColor: "#ffffff",
  foregroundColor: "#1a2130",
  shape: "rounded-square",
  zoom: 0.8,
  padding: 18,
  assetDataUrl: null,
  assetName: "",
  assetMimeType: "",
  blendWhiteBackground: false,
  lastExportFileName: "",
  lastExportAt: "",
  isExporting: false
};

const EXPORT_COUNTS = {
  android: 6,
  ios: 37
};

const elements = {
  projectName: document.querySelector("#project-name"),
  bgColor: document.querySelector("#bg-color"),
  fgColor: document.querySelector("#fg-color"),
  exportFileName: document.querySelector("#android-filename"),
  shape: document.querySelector("#shape-select"),
  zoom: document.querySelector("#zoom-range"),
  zoomOutput: document.querySelector("#zoom-output"),
  padding: document.querySelector("#padding-range"),
  paddingOutput: document.querySelector("#padding-output"),
  assetUpload: document.querySelector("#asset-upload"),
  uploadMeta: document.querySelector("#upload-meta"),
  blendBgCheckbox: document.querySelector("#blend-bg-checkbox"),
  clearUploadButton: document.querySelector("#clear-upload-button"),
  editorIcon: document.querySelector("#editor-icon"),
  editorIconText: document.querySelector("#editor-icon-text"),
  showcaseStoreIcon: document.querySelector("#showcase-store-icon"),
  showcaseStoreText: document.querySelector("#showcase-store-text"),
  showcasePhoneIcon: document.querySelector("#showcase-phone-icon"),
  showcasePhoneText: document.querySelector("#showcase-phone-text"),
  showcasePhoneName: document.querySelector("#showcase-phone-name"),
  exampleFintechIcon: document.querySelector("#example-fintech-icon"),
  exampleFintechText: document.querySelector("#example-fintech-text"),
  exampleCommerceIcon: document.querySelector("#example-commerce-icon"),
  exampleCommerceText: document.querySelector("#example-commerce-text"),
  exampleMediaIcon: document.querySelector("#example-media-icon"),
  exampleMediaText: document.querySelector("#example-media-text"),
  iosPreviewScreen: document.querySelector("#ios-preview-screen"),
  iosPreviewIcon: document.querySelector("#ios-preview-icon"),
  iosPreviewText: document.querySelector("#ios-preview-text"),
  iosPreviewLabel: document.querySelector("#ios-preview-label"),
  variantRoundIcon: document.querySelector("#variant-round-icon"),
  variantRoundText: document.querySelector("#variant-round-text"),
  variantSquircleIcon: document.querySelector("#variant-squircle-icon"),
  variantSquircleText: document.querySelector("#variant-squircle-text"),
  variantLegacyIcon: document.querySelector("#variant-legacy-icon"),
  variantLegacyText: document.querySelector("#variant-legacy-text"),
  apiStatus: document.querySelector("#api-status"),
  exportOutput: document.querySelector("#export-output"),
  saveProjectButton: document.querySelector("#save-project-button"),
  loadPreviewButton: document.querySelector("#load-preview-button"),
  exportButtons: [...document.querySelectorAll("[data-export-trigger]")],
  exportPlatformInputs: [...document.querySelectorAll("[data-export-platform]")],
  packStatCards: [...document.querySelectorAll("[data-pack-card]")]
};

function setExportMessage(message) {
  elements.exportOutput.textContent = message;
}

function describeShape(shape) {
  if (shape === "circle") {
    return "Circle";
  }

  if (shape === "squircle") {
    return "Squircle";
  }

  return "Rounded Square";
}

function buildExportSummary(fileName, platforms) {
  const selectedPlatforms = [...platforms];
  const includesAndroid = selectedPlatforms.includes("android");
  const includesIos = selectedPlatforms.includes("ios");
  const platformLabel = includesAndroid && includesIos
    ? "Android + iOS"
    : includesIos
      ? "iOS only"
      : "Android only";

  return [
    "Export package generated",
    `Project: ${resolveProjectName(state.projectName)}`,
    `File: ${fileName}`,
    `Platforms: ${platformLabel}`,
    `Android outputs: ${includesAndroid ? `${EXPORT_COUNTS.android} files` : "Not included"}`,
    `iOS outputs: ${includesIos ? `${EXPORT_COUNTS.ios} files` : "Not included"}`,
    `Icon label: ${getCurrentIconText() || "Image asset"}`,
    `Shape: ${describeShape(state.shape)}`,
    `Background: ${state.backgroundColor.toUpperCase()}`,
    `Foreground: ${state.foregroundColor.toUpperCase()}`,
    `Zoom: ${Math.round(state.zoom * 100)}%`,
    `Padding: ${state.padding}px`,
    `Source asset: ${state.assetName || "Text-only icon"}`,
    `Saved project: ${state.projectId}`,
    `Downloaded: ${state.lastExportAt}`
  ].join("\n");
}

function extractFilename(contentDisposition) {
  if (!contentDisposition) {
    return "";
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utfMatch) {
    return decodeURIComponent(utfMatch[1]);
  }

  const basicMatch = contentDisposition.match(/filename="([^"]+)"/i) || contentDisposition.match(/filename=([^;]+)/i);
  return basicMatch ? basicMatch[1].trim() : "";
}

function downloadBlob(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}

function deriveIconText(value) {
  return String(value ?? "")
    .trim()
    .slice(0, maxIconTextLength)
    .toUpperCase();
}

function resolveProjectName(value) {
  return value.trim() || "Untitled App";
}

function resolveExportFileName(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.zip$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "appicon";
}

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureSessionId() {
  if (state.sessionId) {
    return state.sessionId;
  }

  const existing = window.localStorage?.getItem("iconforge-session-id");
  state.sessionId = existing || createSessionId();

  try {
    window.localStorage?.setItem("iconforge-session-id", state.sessionId);
  } catch {
    // Ignore storage failures and keep the in-memory session.
  }

  return state.sessionId;
}

function getLocaleCountry() {
  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const locale of locales) {
    const match = String(locale || "").match(/[-_]([A-Za-z]{2})$/);

    if (!match) {
      continue;
    }

    const regionCode = match[1].toUpperCase();
    const regionName = regionDisplayNames?.of(regionCode);

    if (regionName) {
      return regionName;
    }
  }

  return null;
}

function getTimezoneCountry() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezoneCountryFallbacks[timezone] || null;
}

function getClientCountry() {
  return getLocaleCountry() || getTimezoneCountry() || "Unknown";
}

function getClientPlatform() {
  const userAgent = navigator.userAgent || "";

  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return "ios";
  }

  if (/android/i.test(userAgent)) {
    return "android";
  }

  return "web";
}

function getClientDeviceType() {
  return /android|iphone|ipad|mobile/i.test(navigator.userAgent || "") ? "mobile" : "desktop";
}

function getAnalyticsContext(extraMetadata = {}) {
  return {
    sessionId: ensureSessionId(),
    country: getClientCountry(),
    platform: getClientPlatform(),
    deviceType: getClientDeviceType(),
    metadata: {
      page: window.location.pathname,
      ...extraMetadata
    }
  };
}

function getSelectedPlatforms() {
  return [...state.selectedPlatforms];
}

function hasSelectedPlatform() {
  return state.selectedPlatforms.length > 0;
}

function syncPlatformSelectionFromInputs() {
  const selected = [];
  const seen = new Set();

  elements.exportPlatformInputs.forEach((input) => {
    if (seen.has(input.dataset.exportPlatform)) {
      return;
    }

    seen.add(input.dataset.exportPlatform);

    if (input.checked) {
      selected.push(input.dataset.exportPlatform);
    }
  });

  state.selectedPlatforms = selected;
}

function renderPlatformSelection() {
  const selected = new Set(state.selectedPlatforms);

  elements.exportPlatformInputs.forEach((input) => {
    input.checked = selected.has(input.dataset.exportPlatform);
  });

  elements.packStatCards.forEach((card) => {
    const isActive = selected.has(card.dataset.packCard);
    card.classList.toggle("is-active", isActive);
    card.classList.toggle("is-inactive", !isActive);
  });

  elements.exportButtons.forEach((button) => {
    button.disabled = state.isExporting || !hasSelectedPlatform();
  });
}

function getTrackingHeaders() {
  const analytics = getAnalyticsContext();

  return {
    "x-session-id": analytics.sessionId,
    "x-country": analytics.country,
    "x-platform": analytics.platform,
    "x-device-type": analytics.deviceType
  };
}

async function trackClientEvent(type, metadata = {}) {
  try {
    const analytics = getAnalyticsContext(metadata);

    await fetch("/api/public/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type,
        country: analytics.country,
        platform: analytics.platform,
        deviceType: analytics.deviceType,
        sessionId: analytics.sessionId,
        metadata: analytics.metadata
      })
    });
  } catch {
    // Analytics should not block the studio.
  }
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function parseHexColor(color) {
  const hex = String(color || "").trim().replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

function mixColors(baseColor, mixColor, ratio) {
  const weight = clampNumber(ratio, 0, 1);
  const base = parseHexColor(baseColor);
  const overlay = parseHexColor(mixColor);

  return {
    r: Math.round(base.r + ((overlay.r - base.r) * weight)),
    g: Math.round(base.g + ((overlay.g - base.g) * weight)),
    b: Math.round(base.b + ((overlay.b - base.b) * weight))
  };
}

function rgbToCss(color, alpha = 1) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function getIosPreviewLabel(name) {
  return resolveProjectName(name)
    .replace(/\s+/g, " ")
    .slice(0, 8);
}

function getCurrentIconText() {
  return deriveIconText(state.projectName);
}

function getIconTextFontSize(text, mode) {
  if (mode === "ios-preview") {
    if (text.length >= 3) return "0.56rem";
    if (text.length === 2) return "0.62rem";
    return "0.68rem";
  }

  if (mode === "editor") {
    if (text.length >= 3) return "clamp(3.3rem, 7vw, 4.8rem)";
    if (text.length === 2) return "clamp(4.4rem, 9vw, 6rem)";
    return "clamp(5rem, 10vw, 7rem)";
  }

  if (text.length >= 3) return "1.35rem";
  if (text.length === 2) return "1.65rem";
  return "1.8rem";
}

function applyShape(element, explicitShape) {
  element.classList.remove("icon-shape-rounded-square", "icon-shape-squircle", "icon-shape-circle");
  element.classList.add(`icon-shape-${explicitShape}`);
}

function ensureAssetImage(element) {
  let image = element.querySelector(".icon-asset-image");

  if (!image) {
    image = document.createElement("img");
    image.className = "icon-asset-image";
    image.alt = "";
    image.decoding = "async";
    element.append(image);
  }

  return image;
}

function getAssetSize(mode) {
  if (mode === "ios-preview") {
    const baseSize = 84 - Math.min(14, state.padding * 0.42);
    return Math.max(62, baseSize);
  }

  const baseSize = mode === "editor"
    ? 100 - Math.min(42, state.padding * 1.35)
    : 96 - Math.min(24, state.padding * 0.55);

  return Math.max(mode === "editor" ? 68 : 76, baseSize);
}

function updateIosPreviewTheme() {
  if (!elements.iosPreviewScreen || !elements.iosPreviewIcon) {
    return;
  }

  const wallpaperTop = mixColors("#f8f7f5", state.backgroundColor, 0.12);
  const wallpaperBottom = mixColors("#efebe5", state.foregroundColor, 0.05);
  const wallpaperGlow = mixColors("#ffffff", state.backgroundColor, 0.22);
  const iconBorder = mixColors("#ffffff", state.backgroundColor, 0.35);

  elements.iosPreviewScreen.style.background = [
    `radial-gradient(circle at 50% 10%, ${rgbToCss(wallpaperGlow, 0.95)} 0%, rgba(255, 255, 255, 0) 34%)`,
    `linear-gradient(180deg, ${rgbToCss(wallpaperTop)} 0%, ${rgbToCss(wallpaperBottom)} 100%)`
  ].join(", ");

  elements.iosPreviewIcon.style.borderColor = rgbToCss(iconBorder, 0.7);
  elements.iosPreviewIcon.style.boxShadow =
    `inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 5px 10px ${rgbToCss(mixColors("#0f172a", state.backgroundColor, 0.1), 0.14)}`;
}

function updateIconStyles(element, textElement, defaultShape, mode = "editor") {
  if (!element || !textElement) {
    return;
  }

  applyShape(element, defaultShape);
  element.style.background = state.backgroundColor;
  element.style.color = state.foregroundColor;
  element.style.transformOrigin = "center center";

  const imageElement = ensureAssetImage(element);
  const hasAsset = Boolean(state.assetDataUrl);

  if (!hasAsset && mode === "editor") {
    element.style.padding = `${state.padding}px`;
    element.style.transform = `scale(${state.zoom})`;
  } else if (mode === "ios-preview") {
    const previewScale = Math.min(1.08, Math.max(0.9, 0.98 + ((state.zoom - 1) * 0.28)));
    element.style.padding = hasAsset ? "0" : `${Math.max(8, Math.round(state.padding * 0.5))}px`;
    element.style.transform = `scale(${previewScale})`;
  } else {
    element.style.padding = "0";
    element.style.transform = "none";
  }

  imageElement.src = hasAsset ? state.assetDataUrl : "";
  imageElement.hidden = !hasAsset;
  imageElement.style.width = `${getAssetSize(mode)}%`;
  imageElement.style.height = `${getAssetSize(mode)}%`;
  imageElement.style.transform = hasAsset
    ? `translate(-50%, -50%) scale(${state.zoom})`
    : "translate(-50%, -50%) scale(1)";
  imageElement.style.mixBlendMode = (state.blendWhiteBackground && hasAsset) ? "multiply" : "normal";
  const iconText = getCurrentIconText();
  textElement.hidden = hasAsset || mode === "ios-preview";
  textElement.textContent = iconText;
  textElement.style.fontSize = getIconTextFontSize(iconText, mode);
}

function updateColorChip(chipId, hexId, colorValue) {
  const chip = document.querySelector(`#${chipId}`);
  const hex = document.querySelector(`#${hexId}`);
  if (chip) chip.style.background = colorValue;
  if (hex) hex.textContent = colorValue.toUpperCase();
  // Keep text readable on light vs dark colors
  const brightness = parseInt(colorValue.slice(1,3),16)*0.299 +
                     parseInt(colorValue.slice(3,5),16)*0.587 +
                     parseInt(colorValue.slice(5,7),16)*0.114;
  const isLight = brightness > 160;
  if (hex) hex.style.color = isLight ? '#1a2130' : '#ffffff';
  const dropper = chip && chip.querySelector('.color-dropper-icon');
  if (dropper) dropper.style.color = isLight ? '#555' : '#aaa';
  // Add border outline for light chips so they're visible on white panel
  if (chip) chip.style.border = isLight ? '1px solid #e0e4ea' : '1px solid transparent';
}

function render() {
  const zoomPct = Math.round((state.zoom - 1) * 100);
  const zoomEl = document.querySelector("#zoom-output");
  const paddingEl = document.querySelector("#padding-output");
  if (zoomEl) zoomEl.textContent = `${zoomPct >= 0 ? '+' : ''}${zoomPct}% zoom`;
  if (paddingEl) paddingEl.textContent = `${state.padding}px`;
  elements.projectName.value = state.projectName;
  if (elements.exportFileName) {
    elements.exportFileName.value = state.exportFileName;
  }
  elements.bgColor.value = state.backgroundColor;
  elements.fgColor.value = state.foregroundColor;
  elements.shape.value = state.shape;
  elements.blendBgCheckbox.checked = state.blendWhiteBackground;
  elements.uploadMeta.textContent = state.assetName ? `Selected: ${state.assetName}` : "No asset selected";
  elements.uploadMeta.title = state.assetName ? `Selected: ${state.assetName}` : "No asset selected";
  elements.clearUploadButton.hidden = !state.assetDataUrl;
  updateColorChip('bg-chip', 'bg-hex', state.backgroundColor);
  updateColorChip('fg-chip', 'fg-hex', state.foregroundColor);
  renderPlatformSelection();
  updateIconStyles(elements.editorIcon, elements.editorIconText, state.shape || "rounded-square", "editor");
  updateIconStyles(elements.showcaseStoreIcon, elements.showcaseStoreText, state.shape || "rounded-square", "preview");
  updateIconStyles(elements.showcasePhoneIcon, elements.showcasePhoneText, state.shape || "rounded-square", "preview");
  updateIconStyles(elements.exampleFintechIcon, elements.exampleFintechText, state.shape || "rounded-square", "preview");
  updateIconStyles(elements.exampleCommerceIcon, elements.exampleCommerceText, "squircle", "preview");
  updateIconStyles(elements.exampleMediaIcon, elements.exampleMediaText, "circle", "preview");
  updateIconStyles(elements.iosPreviewIcon, elements.iosPreviewText, state.shape || "rounded-square", "ios-preview");
  updateIosPreviewTheme();
  if (elements.iosPreviewLabel) {
    elements.iosPreviewLabel.textContent = getIosPreviewLabel(state.projectName);
  }
  if (elements.showcasePhoneName) {
    elements.showcasePhoneName.textContent = resolveProjectName(state.projectName);
  }
  updateIconStyles(elements.variantRoundIcon, elements.variantRoundText, "circle", "preview");
  updateIconStyles(elements.variantSquircleIcon, elements.variantSquircleText, "squircle", "preview");
  updateIconStyles(elements.variantLegacyIcon, elements.variantLegacyText, "legacy", "preview");
}

function syncStateFromInputs() {
  state.projectName = elements.projectName.value;
  state.exportFileName = resolveExportFileName(elements.exportFileName?.value || state.projectName);
  state.backgroundColor = elements.bgColor.value;
  state.foregroundColor = elements.fgColor.value;
  state.shape = elements.shape.value;
  state.zoom = Number(elements.zoom.value);
  state.padding = Number(elements.padding.value);
  state.blendWhiteBackground = elements.blendBgCheckbox.checked;
  render();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected file"));
    reader.readAsDataURL(file);
  });
}

function isSupportedImageFile(file) {
  if (!file) {
    return false;
  }

  if (/^image\/(png|jpeg|svg\+xml|webp)$/i.test(file.type || "")) {
    return true;
  }

  return /\.(png|jpe?g|svg|webp)$/i.test(file.name || "");
}

async function loadUploadedAsset(file) {
  if (!file) {
    return;
  }

  elements.uploadMeta.textContent = `Selected: ${file.name}`;
  elements.uploadMeta.title = `Selected: ${file.name}`;

  if (file.size > maxUploadSizeBytes) {
    throw new Error("Please choose an asset smaller than 10MB.");
  }

  if (!isSupportedImageFile(file)) {
    throw new Error("Only PNG, JPG, SVG, and WEBP files are supported right now.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  state.assetDataUrl = dataUrl;
  state.assetName = file.name;
  state.assetMimeType = file.type;
  elements.apiStatus.textContent = `Asset loaded: ${file.name}`;
  render();
}

async function handleAssetUpload(event) {
  const [file] = event.target.files || [];
  await loadUploadedAsset(file);
}

function clearUploadedAsset() {
  state.assetDataUrl = null;
  state.assetName = "";
  state.assetMimeType = "";
  elements.assetUpload.value = "";
  elements.apiStatus.textContent = "Uploaded asset removed.";
  render();
}

async function saveProject() {
  syncStateFromInputs();
  const resolvedProjectName = resolveProjectName(state.projectName);
  const iconText = getCurrentIconText();
  const analytics = getAnalyticsContext({
    projectName: resolvedProjectName,
    sourceAsset: state.assetName || null
  });

  const payload = {
    name: resolvedProjectName,
    platforms: getSelectedPlatforms(),
    analytics,
    country: analytics.country,
    platform: analytics.platform,
    deviceType: analytics.deviceType,
    sessionId: analytics.sessionId,
    icon: {
      assetUrl: state.assetDataUrl,
      assetDataUrl: state.assetDataUrl,
      assetName: state.assetName,
      assetMimeType: state.assetMimeType,
      exportFileName: state.exportFileName,
      text: iconText,
      autoText: true,
      backgroundColor: state.backgroundColor,
      foregroundColor: state.foregroundColor,
      gradient: null,
      zoom: state.zoom,
      padding: state.padding,
      blendWhiteBackground: state.blendWhiteBackground,
      shape: state.shape
    }
  };

  const endpoint = state.projectId
    ? `/api/public/projects/${state.projectId}`
    : "/api/public/projects";
  const method = state.projectId ? "PATCH" : "POST";

  const response = await fetch(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getTrackingHeaders()
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Unable to save project");
  }

  const data = await response.json();
  state.projectId = data.project.id;
  state.projectName = data.project.name || resolvedProjectName;
  state.assetDataUrl = data.project.icon.assetDataUrl || null;
  state.assetName = data.project.icon.assetName || "";
  state.assetMimeType = data.project.icon.assetMimeType || "";
  state.exportFileName = resolveExportFileName(data.project.icon.exportFileName || state.exportFileName || resolvedProjectName);
  state.blendWhiteBackground = Boolean(data.project.icon.blendWhiteBackground);
  elements.apiStatus.textContent = `Project saved: ${data.project.name} (${data.project.id.slice(0, 8)})`;
  render();
}

async function refreshPreview() {
  if (!state.projectId) {
    elements.apiStatus.textContent = "Save a project first to fetch backend preview data.";
    return;
  }

  const response = await fetch(`/api/public/projects/${state.projectId}/preview?mode=device`, {
    headers: getTrackingHeaders()
  });

  if (!response.ok) {
    throw new Error("Unable to load preview");
  }

  const data = await response.json();
  elements.apiStatus.textContent =
    `Preview synced: Android ${data.preview.android.cornerStyle}, iOS ${data.preview.ios.cornerStyle}`;
}

async function generateExportPlan() {
  if (!hasSelectedPlatform()) {
    elements.apiStatus.textContent = "Select at least one platform before generating the export.";
    return;
  }

  await saveProject();
  const selectedPlatforms = getSelectedPlatforms();

  state.isExporting = true;
  renderPlatformSelection();
  const platformLabel = selectedPlatforms.length === 2 ? "Android and iOS" : selectedPlatforms[0] === "ios" ? "iOS" : "Android";
  setExportMessage(`Preparing your ${platformLabel} export package. The download will start automatically.`);
  elements.apiStatus.textContent = `Building ${platformLabel} export zip...`;

  const response = await fetch(`/api/public/projects/${state.projectId}/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTrackingHeaders()
    },
    body: JSON.stringify({
      platforms: selectedPlatforms,
      exportFileName: state.exportFileName,
      ...getAnalyticsContext({
        projectId: state.projectId,
        projectName: resolveProjectName(state.projectName)
      }),
      analytics: getAnalyticsContext({
        projectId: state.projectId,
        projectName: resolveProjectName(state.projectName)
      })
    })
  });

  if (!response.ok) {
    state.isExporting = false;
    renderPlatformSelection();
    throw new Error("Unable to generate export zip");
  }

  const fileName =
    extractFilename(response.headers.get("Content-Disposition")) ||
    `${state.exportFileName}.zip`;
  const zipBlob = await response.blob();

  downloadBlob(zipBlob, fileName);

  state.lastExportFileName = fileName;
  state.lastExportAt = new Date().toLocaleString();
  state.isExporting = false;
  renderPlatformSelection();
  setExportMessage(buildExportSummary(fileName, selectedPlatforms));
  elements.apiStatus.textContent = `Export ready: ${fileName}`;
}

function bindEvents() {
  [
    elements.projectName,
    elements.exportFileName,
    elements.bgColor,
    elements.fgColor,
    elements.shape,
    elements.zoom,
    elements.padding,
    elements.blendBgCheckbox
  ].forEach((input) => {
    input.addEventListener("input", syncStateFromInputs);
  });

  elements.assetUpload.addEventListener("change", async (event) => {
    try {
      await handleAssetUpload(event);
    } catch (error) {
      elements.assetUpload.value = "";
      elements.uploadMeta.textContent = "No asset selected";
      elements.uploadMeta.title = "No asset selected";
      elements.apiStatus.textContent = error.message;
    }
  });

  elements.assetUpload.addEventListener("click", () => {
    elements.assetUpload.value = "";
  });

  const dropzoneArea = document.querySelector("#dropzone-area");
  if (dropzoneArea) {
    dropzoneArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzoneArea.classList.add('drag-active');
    });
    dropzoneArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropzoneArea.classList.remove('drag-active');
    });
    dropzoneArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneArea.classList.remove('drag-active');
      const [file] = e.dataTransfer.files || [];

      if (!file) {
        return;
      }

      loadUploadedAsset(file).catch((error) => {
        elements.uploadMeta.textContent = "No asset selected";
        elements.uploadMeta.title = "No asset selected";
        elements.apiStatus.textContent = error.message;
      });
    });
  }

  elements.clearUploadButton.addEventListener("click", clearUploadedAsset);

  elements.exportPlatformInputs.forEach((input) => {
    input.addEventListener("change", () => {
      syncPlatformSelectionFromInputs();
      renderPlatformSelection();

      if (!hasSelectedPlatform()) {
        elements.apiStatus.textContent = "Select Android, iOS, or both to generate an export.";
      }
    });
  });

  elements.saveProjectButton.addEventListener("click", async () => {
    try {
      await saveProject();
    } catch (error) {
      elements.apiStatus.textContent = error.message;
    }
  });

  elements.loadPreviewButton.addEventListener("click", async () => {
    try {
      await refreshPreview();
    } catch (error) {
      elements.apiStatus.textContent = error.message;
    }
  });

  elements.exportButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await generateExportPlan();
      } catch (error) {
        state.isExporting = false;
        renderPlatformSelection();
        setExportMessage(error.message);
        elements.apiStatus.textContent = error.message;
      }
    });
  });
}

render();
bindEvents();
trackClientEvent("page_view", {
  page: window.location.pathname,
  referrer: document.referrer || null
});
