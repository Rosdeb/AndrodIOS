const state = {
  projectId: null,
  projectName: "Nebula Notes",
  iconText: "NN",
  backgroundColor: "#2563eb",
  foregroundColor: "#ffffff",
  shape: "rounded-square",
  zoom: 1.1,
  padding: 18,
  shadow: 18,
  assetDataUrl: null,
  assetName: "",
  assetMimeType: "",
  lastExportFileName: "",
  lastExportAt: "",
  isExporting: false
};

const elements = {
  projectName: document.querySelector("#project-name"),
  iconText: document.querySelector("#icon-text"),
  bgColor: document.querySelector("#bg-color"),
  fgColor: document.querySelector("#fg-color"),
  shape: document.querySelector("#shape-select"),
  zoom: document.querySelector("#zoom-range"),
  zoomOutput: document.querySelector("#zoom-output"),
  padding: document.querySelector("#padding-range"),
  paddingOutput: document.querySelector("#padding-output"),
  shadow: document.querySelector("#shadow-range"),
  shadowOutput: document.querySelector("#shadow-output"),
  assetUpload: document.querySelector("#asset-upload"),
  uploadHelp: document.querySelector("#upload-help"),
  uploadMeta: document.querySelector("#upload-meta"),
  clearUploadButton: document.querySelector("#clear-upload-button"),
  editorIcon: document.querySelector("#editor-icon"),
  editorIconText: document.querySelector("#editor-icon-text"),
  androidIcon: document.querySelector("#android-preview-icon"),
  androidText: document.querySelector("#android-preview-text"),
  iosIcon: document.querySelector("#ios-preview-icon"),
  iosText: document.querySelector("#ios-preview-text"),
  androidAppName: document.querySelector("#android-app-name"),
  iosAppName: document.querySelector("#ios-app-name"),
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
  generateExportButton: document.querySelector("#generate-export-button")
};

function setExportMessage(message) {
  elements.exportOutput.textContent = message;
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

function clampText(value) {
  return value.trim().slice(0, 2).toUpperCase() || "IF";
}

function getShadow() {
  return `0 ${Math.max(8, state.shadow)}px ${state.shadow * 2}px rgba(37, 99, 235, 0.22)`;
}

function applyShape(element, defaultShape) {
  element.classList.remove("icon-shape-rounded-square", "icon-shape-squircle", "icon-shape-circle");
  const shapeName = state.shape || defaultShape;
  element.classList.add(`icon-shape-${shapeName}`);
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

function updateIconStyles(element, textElement, defaultShape, mode = "editor") {
  applyShape(element, defaultShape);
  element.style.background = state.backgroundColor;
  element.style.color = state.foregroundColor;
  element.style.boxShadow = getShadow();
  element.style.transformOrigin = "center center";

  if (mode === "editor") {
    element.style.padding = `${state.padding}px`;
    element.style.transform = `scale(${state.zoom})`;
  } else {
    element.style.padding = "0";
    element.style.transform = "none";
  }

  const imageElement = ensureAssetImage(element);
  const hasAsset = Boolean(state.assetDataUrl);

  imageElement.src = hasAsset ? state.assetDataUrl : "";
  imageElement.hidden = !hasAsset;
  textElement.hidden = hasAsset;
  textElement.textContent = clampText(state.iconText);
}

function render() {
  elements.zoomOutput.value = `${state.zoom.toFixed(2)}x`;
  elements.paddingOutput.value = `${state.padding}px`;
  elements.shadowOutput.value = String(state.shadow);
  elements.projectName.value = state.projectName;
  elements.iconText.value = state.iconText;
  elements.bgColor.value = state.backgroundColor;
  elements.fgColor.value = state.foregroundColor;
  elements.shape.value = state.shape;
  elements.uploadMeta.textContent = state.assetName ? `Selected: ${state.assetName}` : "No asset selected";
  elements.uploadHelp.textContent = state.assetName
    ? "Uploaded asset is active in the editor preview and will be saved with this project."
    : "Optional for now. If not uploaded, the preview uses the text icon.";
  elements.clearUploadButton.hidden = !state.assetDataUrl;
  elements.androidAppName.textContent = state.projectName;
  elements.iosAppName.textContent = state.projectName;
  updateIconStyles(elements.editorIcon, elements.editorIconText, "rounded-square", "editor");
  updateIconStyles(elements.androidIcon, elements.androidText, "rounded-square", "preview");
  updateIconStyles(elements.iosIcon, elements.iosText, "squircle", "preview");
  updateIconStyles(elements.variantRoundIcon, elements.variantRoundText, "circle", "preview");
  updateIconStyles(elements.variantSquircleIcon, elements.variantSquircleText, "squircle", "preview");
  updateIconStyles(elements.variantLegacyIcon, elements.variantLegacyText, "rounded-square", "preview");
}

function syncStateFromInputs() {
  state.projectName = elements.projectName.value.trim() || "Untitled App";
  state.iconText = clampText(elements.iconText.value);
  state.backgroundColor = elements.bgColor.value;
  state.foregroundColor = elements.fgColor.value;
  state.shape = elements.shape.value;
  state.zoom = Number(elements.zoom.value);
  state.padding = Number(elements.padding.value);
  state.shadow = Number(elements.shadow.value);
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

async function handleAssetUpload(event) {
  const [file] = event.target.files || [];

  if (!file) {
    return;
  }

  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Please choose an asset smaller than 4MB.");
  }

  if (!/^image\/(png|jpeg|svg\+xml)$/.test(file.type)) {
    throw new Error("Only PNG, JPG, and SVG files are supported right now.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  state.assetDataUrl = dataUrl;
  state.assetName = file.name;
  state.assetMimeType = file.type;
  elements.apiStatus.textContent = `Asset loaded: ${file.name}`;
  render();
}

function clearUploadedAsset() {
  state.assetDataUrl = null;
  state.assetName = "";
  state.assetMimeType = "";
  elements.assetUpload.value = "";
  elements.apiStatus.textContent = "Uploaded asset removed. Text preview restored.";
  render();
}

async function saveProject() {
  syncStateFromInputs();

  const payload = {
    name: state.projectName,
    platforms: ["android", "ios"],
    icon: {
      assetUrl: state.assetDataUrl,
      assetDataUrl: state.assetDataUrl,
      assetName: state.assetName,
      assetMimeType: state.assetMimeType,
      backgroundColor: state.backgroundColor,
      foregroundColor: state.foregroundColor,
      gradient: null,
      zoom: state.zoom,
      padding: state.padding,
      shadow: state.shadow,
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
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Unable to save project");
  }

  const data = await response.json();
  state.projectId = data.project.id;
  state.assetDataUrl = data.project.icon.assetDataUrl || null;
  state.assetName = data.project.icon.assetName || "";
  state.assetMimeType = data.project.icon.assetMimeType || "";
  elements.apiStatus.textContent = `Project saved: ${data.project.name} (${data.project.id.slice(0, 8)})`;
  render();
}

async function refreshPreview() {
  if (!state.projectId) {
    elements.apiStatus.textContent = "Save a project first to fetch backend preview data.";
    return;
  }

  const response = await fetch(`/api/public/projects/${state.projectId}/preview`);

  if (!response.ok) {
    throw new Error("Unable to load preview");
  }

  const data = await response.json();
  elements.apiStatus.textContent =
    `Preview synced: Android ${data.preview.android.cornerStyle}, iOS ${data.preview.ios.cornerStyle}`;
}

async function generateExportPlan() {
  if (!state.projectId) {
    await saveProject();
  }

  state.isExporting = true;
  elements.generateExportButton.disabled = true;
  setExportMessage("Preparing your export package. The zip download will start automatically.");
  elements.apiStatus.textContent = "Building Android and iOS export zip...";

  const response = await fetch(`/api/public/projects/${state.projectId}/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      platforms: ["android", "ios"],
      country: "Bangladesh",
      deviceType: "desktop"
    })
  });

  if (!response.ok) {
    state.isExporting = false;
    elements.generateExportButton.disabled = false;
    throw new Error("Unable to generate export zip");
  }

  const fileName =
    extractFilename(response.headers.get("Content-Disposition")) ||
    `${state.projectName.toLowerCase().replace(/\s+/g, "-")}-icons.zip`;
  const zipBlob = await response.blob();

  downloadBlob(zipBlob, fileName);

  state.lastExportFileName = fileName;
  state.lastExportAt = new Date().toLocaleString();
  state.isExporting = false;
  elements.generateExportButton.disabled = false;
  setExportMessage(
    [
      "Export complete",
      `Project: ${state.projectName}`,
      `File: ${fileName}`,
      "Platforms: Android + iOS",
      `Saved project: ${state.projectId}`,
      `Downloaded: ${state.lastExportAt}`
    ].join("\n")
  );
  elements.apiStatus.textContent = `Export ready: ${fileName}`;
}

function bindEvents() {
  [
    elements.projectName,
    elements.iconText,
    elements.bgColor,
    elements.fgColor,
    elements.shape,
    elements.zoom,
    elements.padding,
    elements.shadow
  ].forEach((input) => {
    input.addEventListener("input", syncStateFromInputs);
  });

  elements.assetUpload.addEventListener("change", async (event) => {
    try {
      await handleAssetUpload(event);
    } catch (error) {
      elements.assetUpload.value = "";
      elements.apiStatus.textContent = error.message;
    }
  });

  elements.clearUploadButton.addEventListener("click", clearUploadedAsset);

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

  elements.generateExportButton.addEventListener("click", async () => {
    try {
      await generateExportPlan();
    } catch (error) {
      state.isExporting = false;
      elements.generateExportButton.disabled = false;
      setExportMessage(error.message);
      elements.apiStatus.textContent = error.message;
    }
  });
}

render();
bindEvents();
