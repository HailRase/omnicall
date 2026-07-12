# P13 Video Calls — WU8 SBC Smoke Checklist (F-027)

Manual gate before closing F-027. Run with real adapters against a video-capable SBC.

## Setup

- `.env.local` with SIP credentials; `npm run dev`
- Open `http://localhost:5173/?adapters=real`
- Camera/mic permissions granted; second endpoint that can send/receive video

## Smoke cases

| ID | Case | Expected | Result |
| --- | --- | --- | --- |
| V1 | Dialpad **Call** (audio) | Audio-only SDP; no video surface; mic mute works | |
| V2 | Dialpad **Video call** | Video m-line; local cam privacy-muted; surface + cam control visible | |
| V3 | Enable camera mid-call | Local preview appears; remote sees video (if peer supports) | |
| V4 | Disable camera | Local preview muted/placeholder; outbound video muted via replaceTrack | |
| V5 | Expanded or fullscreen → screen share | In-app picker (screen/window); share from expanded or fullscreen; stop restores camera muted | |
| V6 | OS stop screen share (`onended`) | Source returns to camera (muted); no stuck screen track | |
| V7 | Incoming **Answer** | Audio answer; no forced video | |
| V8 | Incoming **Answer with video** | Video mode; surface + cam controls | |
| V9 | Hold during video | Cam/screen controls disabled while Held; resume restores | |
| V10 | Remote no-video (SDP port 0 / INFO `no-video-remote`) | Remote placeholder; `remoteVideoPresent=false` | |
| V11 | Stub path (deny camera) | Call still connects with stub track; cam control disabled/unavailable | |
| V12 | Regression: mute/hold/DTMF/headset | Unchanged vs audio-only baseline | |

## Close criteria

- V1–V9 and V12 **PASS** on target SBC
- V10–V11 PASS or documented SBC limitation
- Update `STATUS.md` WU8 → done; F-027 → **implemented**
- Optional SemVer MINOR bump only when cutting a distribution release

## Record

**Date:**  
**SBC / env:**  
**Build / commit:**  
**Notes:**  
