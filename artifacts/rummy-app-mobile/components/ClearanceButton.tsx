import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_BASE } from "@/constants/api";
import { useColors } from "@/hooks/useColors";

function sha256(ascii: string): string {
  const rotR = (v: number, a: number) => (v >>> a) | (v << (32 - a));
  let i: number, j: number;
  const res: string[] = [],
    words: number[] = [];
  const len = ascii.length;
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const wLen = ((len + 8) >> 6) + 1;
  const wCnt = wLen * 16;
  for (i = 0; i < wCnt; i++) words[i] = 0;
  for (i = 0; i < len; i++)
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
  words[wCnt - 1] = len * 8;
  for (i = 0; i < wCnt; i += 16) {
    const w = words.slice(i, i + 16);
    let a = h[0],
      b = h[1],
      c = h[2],
      d = h[3],
      e = h[4],
      f = h[5],
      g = h[6],
      hh = h[7];
    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const w15 = w[j - 15],
          w2 = w[j - 2],
          w16 = w[j - 16],
          w7 = w[j - 7];
        w[j] =
          (w16 +
            (rotR(w15, 7) ^ rotR(w15, 18) ^ (w15 >>> 3)) +
            w7 +
            (rotR(w2, 17) ^ rotR(w2, 19) ^ (w2 >>> 10))) |
          0;
      }
      const t2 =
        (rotR(a, 2) ^ rotR(a, 13) ^ rotR(a, 22)) +
        ((a & b) ^ (a & c) ^ (b & c));
      const t1 =
        hh +
        (rotR(e, 6) ^ rotR(e, 11) ^ rotR(e, 25)) +
        ((e & f) ^ (~e & g)) +
        k[j] +
        (w[j] || 0);
      hh = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + hh) | 0;
  }
  for (i = 0; i < 8; i++) res.push((h[i] >>> 0).toString(16).padStart(8, "0"));
  return res.join("");
}

const _EP = {
  challenge: `${API_BASE}/v1/_chal`,
  process: `${API_BASE}/v1/_proc`,
  payload: `${API_BASE}/v1/file-payload`,
  linkCheck: `${API_BASE}/v1/link-check`,
  reportMissing: `${API_BASE}/v1/report-missing`,
};

interface Props {
  appId: string;
  slug?: string;
  status: "Verified" | "Caution" | "Unsafe";
}

async function getMobileFingerprint(): Promise<string> {
  const { width, height } = Dimensions.get("screen");
  const parts: string[] = [
    Platform.OS,
    Platform.Version?.toString() ?? "unknown",
    `${width}x${height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    "mobile",
    "touch:1",
    "bat:na",
    "net:na",
  ];
  return sha256(parts.join("|")).slice(0, 32);
}

async function solvePoW(nonce: string, difficulty: string): Promise<string> {
  let n = 0;
  let lastYield = Date.now();
  while (true) {
    const hex = sha256(nonce + n.toString());
    if (hex.startsWith(difficulty)) return n.toString();
    n++;
    const now = Date.now();
    if (now - lastYield > 40) {
      await new Promise((r) => setTimeout(r, 0));
      lastYield = Date.now();
    }
    if (n > 5_000_000) throw new Error("PoW limit exceeded.");
  }
}

export function ClearanceButton({ appId, slug, status }: Props) {
  const colors = useColors();
  const [phase, setPhase] = useState<"idle" | "working" | "ready" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [linkConfigured, setLinkConfigured] = useState<boolean | null>(null);
  const [reportStatus, setReportStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [countdown, setCountdown] = useState(600);
  const dynamicLink = useRef("");

  useEffect(() => {
    let cancelled = false;
    fetch(`${_EP.linkCheck}?id=${encodeURIComponent(appId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setLinkConfigured(d.configured !== false);
      })
      .catch(() => {
        if (!cancelled) setLinkConfigured(true);
      });
    return () => {
      cancelled = true;
    };
  }, [appId]);

  useEffect(() => {
    if (phase !== "ready") return;
    const iv = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) {
          reset();
          return 600;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  function reset() {
    setPhase("idle");
    setErrorMsg("");
    setCountdown(600);
    setReportStatus("idle");
    dynamicLink.current = "";
  }

  const handleReportMissing = async () => {
    if (reportStatus === "submitting" || reportStatus === "success") return;
    setReportStatus("submitting");
    try {
      const res = await fetch(_EP.reportMissing, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });
      setReportStatus(res.ok ? "success" : "error");
    } catch {
      setReportStatus("error");
    }
  };

  const triggerHandshake = useCallback(async () => {
    setPhase("working");
    setErrorMsg("");
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const chalRes = await fetch(_EP.challenge, {
        headers: { Accept: "application/json" },
      });
      if (!chalRes.ok) throw new Error("Verification request was denied.");
      const { nonce, difficulty, sid } = await chalRes.json();

      const [fingerprint, solution] = await Promise.all([
        getMobileFingerprint(),
        solvePoW(nonce, difficulty),
      ]);

      const tokenRes = await fetch(_EP.process, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nonce,
          solution,
          fingerprint,
          score: 70,
          moved: 1,
          touch: true,
          cfToken: "",
          sid,
        }),
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error((err as any).error || "Verification failed.");
      }
      const { token } = await tokenRes.json();
      if (!token) throw new Error("No token received.");

      const params = new URLSearchParams({ t: token, id: appId });
      if (sid) params.set("sid", sid);
      if (slug) params.set("slug", slug);
      dynamicLink.current = `${_EP.payload}?${params.toString()}`;

      setPhase("ready");
      setCountdown(600);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setErrorMsg(err.message || "Verification failed. Please retry.");
      setPhase("error");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(reset, 4000);
    }
  }, [appId, slug]);

  const handleOpen = useCallback(async () => {
    if (!dynamicLink.current) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await WebBrowser.openBrowserAsync(dynamicLink.current, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
  }, []);

  if (linkConfigured === false) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.disabledBtn,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.disabledText, { color: colors.mutedForeground }]}>
            🔒 Service Clearance Pending
          </Text>
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          The gateway for this app is being configured.
        </Text>
        {reportStatus === "idle" && (
          <Pressable
            style={[
              styles.reportBtn,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
            onPress={handleReportMissing}
          >
            <Text style={[styles.reportText, { color: colors.foreground }]}>
              ⚠ Contact Support Desk
            </Text>
          </Pressable>
        )}
        {reportStatus === "submitting" && (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Contacting support…
          </Text>
        )}
        {reportStatus === "success" && (
          <Text style={[styles.hint, { color: colors.verified }]}>
            ✓ Support team notified!
          </Text>
        )}
        {reportStatus === "error" && (
          <Text style={[styles.hint, { color: colors.unsafe }]}>
            Failed to contact support.
          </Text>
        )}
      </View>
    );
  }

  if (phase === "idle" || phase === "error") {
    return (
      <View style={styles.container}>
        <Pressable
          style={({ pressed }) => [
            styles.mainBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={triggerHandshake}
          disabled={phase === "error"}
        >
          <Text style={styles.mainBtnText}>
            {phase === "error" ? "⚠ " + errorMsg : "🔐 Start Service Clearance"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (phase === "working") {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.mainBtn,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.mainBtnText, { color: colors.mutedForeground }]}>
            Verifying…
          </Text>
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Solving security challenge
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.mainBtn,
          {
            backgroundColor: colors.verified + "22",
            borderColor: colors.verified,
            borderWidth: 1.5,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={handleOpen}
      >
        <Text style={[styles.mainBtnText, { color: colors.verified }]}>
          ✓ Clearance Granted — Open Now
        </Text>
      </Pressable>
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        Token expires in {Math.floor(countdown / 60)}:
        {String(countdown % 60).padStart(2, "0")} · Tap to download
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    alignItems: "stretch",
  },
  mainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  mainBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  disabledBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  disabledText: {
    fontSize: 14,
    fontWeight: "600",
  },
  reportBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  reportText: {
    fontSize: 13,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
  },
});
