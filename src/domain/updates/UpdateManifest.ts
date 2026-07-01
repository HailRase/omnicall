export type UpdatePlatformId = "win32" | "darwin" | "linux";

export type UpdateManifestPlatforms = Readonly<
  Partial<Record<UpdatePlatformId, string>>
>;

export type UpdateManifest = Readonly<{
  latestVersion: string;
  downloadUrl: string;
  releaseDate?: string;
  releaseNotesUrl?: string;
  platforms?: UpdateManifestPlatforms;
  minimumSupportedVersion?: string;
}>;
