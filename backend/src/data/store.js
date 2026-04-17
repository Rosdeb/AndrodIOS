const now = new Date("2026-03-29T06:00:00.000Z");

const projects = [
  {
    id: "project_demo_001",
    name: "Nebula Notes",
    sourceType: "upload",
    platforms: ["android", "ios"],
    icon: {
      assetUrl: "/website/assets/icons/app-builder-icon.png",
      assetDataUrl: "/website/assets/icons/app-builder-icon.png",
      assetName: "app-builder-icon.png",
      assetMimeType: "image/png",
      text: "NN",
      foregroundColor: "#ffffff",
      backgroundColor: "#ffffff",
      gradient: null,
      zoom: 1,
      padding: 18,
      blendWhiteBackground: false,
      positionX: 0,
      positionY: -4,
      shadow: 24,
      shape: "rounded-square"
    },
    createdAt: "2026-03-28T07:20:00.000Z",
    updatedAt: "2026-03-29T05:18:00.000Z"
  }
];

const exports = [
  {
    id: "export_demo_001",
    projectId: "project_demo_001",
    type: "zip",
    platforms: ["android", "ios"],
    status: "completed",
    country: "United States",
    createdAt: "2026-03-29T05:20:00.000Z",
    files: {
      android: [
        "mipmap-mdpi/ic_launcher.png",
        "mipmap-hdpi/ic_launcher.png",
        "mipmap-xhdpi/ic_launcher.png",
        "mipmap-xxhdpi/ic_launcher.png",
        "mipmap-xxxhdpi/ic_launcher.png",
        "playstore.png"
      ],
      ios: [
        "appstore.png",
        "AppIcon.appiconset/iphone-app-60@3x.png",
        "AppIcon.appiconset/iphone-app-60@2x.png",
        "AppIcon.appiconset/ipad-pro-83.5@2x.png",
        "AppIcon.appiconset/ipad-app-76@2x.png",
        "AppIcon.appiconset/iphone-spotlight-40@3x.png",
        "AppIcon.appiconset/iphone-settings-29@3x.png",
        "AppIcon.appiconset/Contents.json"
      ]
    }
  }
];

const analyticsEvents = [
  {
    id: "event_001",
    type: "page_view",
    country: "United States",
    platform: "web",
    deviceType: "desktop",
    createdAt: "2026-03-29T01:15:00.000Z",
    metadata: { page: "/" }
  },
  {
    id: "event_002",
    type: "upload_completed",
    country: "India",
    platform: "android",
    deviceType: "desktop",
    createdAt: "2026-03-29T01:40:00.000Z",
    metadata: { fileType: "svg" }
  },
  {
    id: "event_003",
    type: "color_changed",
    country: "India",
    platform: "android",
    deviceType: "desktop",
    createdAt: "2026-03-29T01:42:00.000Z",
    metadata: { color: "#ff6b35" }
  },
  {
    id: "event_004",
    type: "preview_opened",
    country: "Bangladesh",
    platform: "ios",
    deviceType: "mobile",
    createdAt: "2026-03-29T02:10:00.000Z",
    metadata: { previewMode: "device" }
  },
  {
    id: "event_005",
    type: "export_started",
    country: "United States",
    platform: "ios",
    deviceType: "desktop",
    createdAt: "2026-03-29T03:00:00.000Z",
    metadata: { exportTarget: "ios" }
  },
  {
    id: "event_006",
    type: "export_completed",
    country: "United States",
    platform: "ios",
    deviceType: "desktop",
    createdAt: "2026-03-29T03:01:00.000Z",
    metadata: { exportTarget: "ios" }
  },
  {
    id: "event_007",
    type: "export_completed",
    country: "India",
    platform: "android",
    deviceType: "desktop",
    createdAt: "2026-03-29T04:00:00.000Z",
    metadata: { exportTarget: "android" }
  },
  {
    id: "event_008",
    type: "gradient_applied",
    country: "Germany",
    platform: "web",
    deviceType: "desktop",
    createdAt: "2026-03-29T04:30:00.000Z",
    metadata: { preset: "sunset" }
  },
  {
    id: "event_009",
    type: "page_view",
    country: "Brazil",
    platform: "web",
    deviceType: "mobile",
    createdAt: "2026-03-29T05:10:00.000Z",
    metadata: { page: "/editor" }
  },
  {
    id: "event_010",
    type: "export_completed",
    country: "Bangladesh",
    platform: "android-ios",
    deviceType: "desktop",
    createdAt: "2026-03-29T05:45:00.000Z",
    metadata: { exportTarget: "both" }
  }
];

export const store = {
  now,
  projects,
  exports,
  analyticsEvents
};
