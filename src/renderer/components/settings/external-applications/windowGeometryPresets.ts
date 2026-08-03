/**
 * - Purpose: size preset definitions for External Application window geometry.
 * - Inputs: none (static catalog).
 * - Outputs: preset id, width, height, and i18n label key.
 */

export type WindowGeometryPresetId =
  | "hd16_9"
  | "default"
  | "compact"
  | "standard4_3"
  | "vga";

export type WindowGeometryPreset = Readonly<{
  id: WindowGeometryPresetId;
  width: number;
  height: number;
  labelKey:
    | "settings.integrations.externalApplications.windowGeometry.presets.hd16_9"
    | "settings.integrations.externalApplications.windowGeometry.presets.default"
    | "settings.integrations.externalApplications.windowGeometry.presets.compact"
    | "settings.integrations.externalApplications.windowGeometry.presets.standard4_3"
    | "settings.integrations.externalApplications.windowGeometry.presets.vga";
}>;

export const WINDOW_GEOMETRY_PRESETS: ReadonlyArray<WindowGeometryPreset> = [
  {
    id: "hd16_9",
    width: 1280,
    height: 720,
    labelKey: "settings.integrations.externalApplications.windowGeometry.presets.hd16_9",
  },
  {
    id: "default",
    width: 1100,
    height: 800,
    labelKey: "settings.integrations.externalApplications.windowGeometry.presets.default",
  },
  {
    id: "compact",
    width: 900,
    height: 700,
    labelKey: "settings.integrations.externalApplications.windowGeometry.presets.compact",
  },
  {
    id: "standard4_3",
    width: 800,
    height: 600,
    labelKey: "settings.integrations.externalApplications.windowGeometry.presets.standard4_3",
  },
  {
    id: "vga",
    width: 640,
    height: 480,
    labelKey: "settings.integrations.externalApplications.windowGeometry.presets.vga",
  },
];

export function matchWindowGeometryPreset(
  width: number,
  height: number,
): WindowGeometryPresetId | null {
  const match = WINDOW_GEOMETRY_PRESETS.find(
    (preset) => preset.width === width && preset.height === height,
  );
  return match?.id ?? null;
}
