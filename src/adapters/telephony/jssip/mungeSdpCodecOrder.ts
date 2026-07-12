const AUXILIARY_CODEC_TOKENS = ["rtx", "red", "ulpfec", "fec", "telephone-event"] as const;

/**
 * - Purpose: reorder and filter audio/video payload types in local SDP.
 * - Inputs: SDP text and preferred enabled audio/video MIME types.
 * - Outputs: SDP media payload order aligned to preferences; keeps auxiliaries.
 */
export function mungeSdpCodecOrder(
  sdp: string,
  preferredAudioMimeTypes: readonly string[],
  preferredVideoMimeTypes: readonly string[] = [],
): string {
  if (preferredAudioMimeTypes.length === 0 && preferredVideoMimeTypes.length === 0) {
    return sdp;
  }

  const normalizedAudioPreferences = preferredAudioMimeTypes.map(normalizeMimeType);
  const normalizedVideoPreferences = preferredVideoMimeTypes.map(normalizeMimeType);
  const lines = sdp.split(/\r?\n/u);
  const output: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const mediaKind = resolveMediaKind(line);
    if (mediaKind === null) {
      output.push(line);
      index += 1;
      continue;
    }

    const sectionEnd = findMediaSectionEnd(lines, index + 1);
    const section = lines.slice(index, sectionEnd);
    const preferences =
      mediaKind === "audio" ? normalizedAudioPreferences : normalizedVideoPreferences;
    output.push(...reorderMediaSection(section, mediaKind, preferences));
    index = sectionEnd;
  }

  return joinSdpLines(output, sdp);
}

function reorderMediaSection(
  sectionLines: readonly string[],
  mediaKind: "audio" | "video",
  preferredMimeTypes: readonly string[],
): readonly string[] {
  const mediaLine = sectionLines[0];
  if (
    mediaLine === undefined ||
    !mediaLine.startsWith(`m=${mediaKind} `) ||
    preferredMimeTypes.length === 0
  ) {
    return sectionLines;
  }

  const mediaParts = mediaLine.split(" ");
  const originalPayloadOrder = mediaParts.slice(3);
  if (originalPayloadOrder.length === 0) {
    return sectionLines;
  }

  const payloadCodecByType = buildPayloadCodecMap(sectionLines, mediaKind);
  const usedPayloadTypes = new Set<string>();
  const orderedVoicePayloadTypes: string[] = [];

  for (const mimeType of preferredMimeTypes) {
    for (const payloadType of originalPayloadOrder) {
      if (usedPayloadTypes.has(payloadType)) {
        continue;
      }
      if (payloadCodecByType.get(payloadType) === mimeType) {
        orderedVoicePayloadTypes.push(payloadType);
        usedPayloadTypes.add(payloadType);
      }
    }
  }

  const auxiliaryPayloadTypes = originalPayloadOrder.filter((payloadType) => {
    if (usedPayloadTypes.has(payloadType)) {
      return false;
    }
    const mimeType = payloadCodecByType.get(payloadType);
    return mimeType === undefined || isAuxiliaryMimeType(mimeType);
  });

  const orderedPayloadTypes = [...orderedVoicePayloadTypes, ...auxiliaryPayloadTypes];
  if (orderedPayloadTypes.length === 0) {
    return sectionLines;
  }

  const reorderedMediaLine = [...mediaParts.slice(0, 3), ...orderedPayloadTypes].join(" ");
  const allowedPayloadTypes = new Set(orderedPayloadTypes);

  return sectionLines
    .map((line, lineIndex) => (lineIndex === 0 ? reorderedMediaLine : line))
    .filter((line) => shouldKeepAttributeLine(line, allowedPayloadTypes));
}

function buildPayloadCodecMap(
  sectionLines: readonly string[],
  mediaKind: "audio" | "video",
): Map<string, string> {
  const payloadCodecByType = new Map<string, string>();

  for (const line of sectionLines) {
    if (!line.startsWith("a=rtpmap:")) {
      continue;
    }
    const payloadPart = line.slice("a=rtpmap:".length);
    const separatorIndex = payloadPart.indexOf(" ");
    if (separatorIndex <= 0) {
      continue;
    }
    const payloadType = payloadPart.slice(0, separatorIndex).trim();
    const codecName = payloadPart.slice(separatorIndex + 1).split("/")[0]?.trim().toLowerCase();
    if (codecName === undefined || codecName.length === 0) {
      continue;
    }
    payloadCodecByType.set(payloadType, `${mediaKind}/${codecName}`);
  }

  return payloadCodecByType;
}

function isAuxiliaryMimeType(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase();
  return AUXILIARY_CODEC_TOKENS.some((token) => normalized.includes(token));
}

function resolveMediaKind(line: string): "audio" | "video" | null {
  if (line.startsWith("m=audio ")) {
    return "audio";
  }
  if (line.startsWith("m=video ")) {
    return "video";
  }
  return null;
}

function shouldKeepAttributeLine(line: string, allowedPayloadTypes: ReadonlySet<string>): boolean {
  if (!line.startsWith("a=rtpmap:") && !line.startsWith("a=fmtp:") && !line.startsWith("a=rtcp-fb:")) {
    return true;
  }

  const payloadType = extractPayloadTypeFromAttribute(line);
  if (payloadType === null) {
    return true;
  }

  return allowedPayloadTypes.has(payloadType);
}

function extractPayloadTypeFromAttribute(line: string): string | null {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex < 0) {
    return null;
  }
  const value = line.slice(separatorIndex + 1);
  const payloadType = value.split(" ")[0]?.trim();
  return payloadType !== undefined && payloadType.length > 0 ? payloadType : null;
}

function findMediaSectionEnd(lines: readonly string[], startIndex: number): number {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (lines[index]?.startsWith("m=") === true) {
      return index;
    }
  }
  return lines.length;
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? mimeType.trim().toLowerCase();
}

function joinSdpLines(lines: readonly string[], originalSdp: string): string {
  const usesCrLf = originalSdp.includes("\r\n");
  const joined = lines.join(usesCrLf ? "\r\n" : "\n");
  if (originalSdp.endsWith("\r\n")) {
    return `${joined}\r\n`;
  }
  if (originalSdp.endsWith("\n")) {
    return `${joined}\n`;
  }
  return joined;
}
