import { Router } from "express";
import { getRawFirebaseConfig } from "../lib/firebaseHelper.js";

const router = Router();

router.post("/v1/report-missing", async (req, res) => {
  const { appId } = req.body;
  if (!appId) return res.status(400).json({ error: "Missing App ID parameter." });

  try {
    let config: any;
    try { config = getRawFirebaseConfig(); } catch {
      return res.status(500).json({ error: "Firebase is not configured." });
    }

    const db = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;
    const apiSuffix = config.apiKey ? `?key=${config.apiKey}` : "";
    const reportId = `report_${appId.replace(/[^a-zA-Z0-9_\-]/g, "")}_${Date.now()}`.substring(0, 120);
    const fields = ["app_id", "username", "rating", "comment", "created_at", "helpful_count", "is_approved", "source"];
    const updateMaskParams = fields.map((f) => `updateMask.fieldPaths=${f}`).join("&");
    const patchUrl = `${db}/reviews/${reportId}${apiSuffix ? apiSuffix + "&" + updateMaskParams : "?" + updateMaskParams}`;

    const storeResponse = await fetch(patchUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          app_id: { stringValue: appId },
          username: { stringValue: "Anonymous Reporter" },
          rating: { doubleValue: 1.0 },
          comment: { stringValue: `MISSING_LINK_REPORT: Download link not available for app ${appId}.` },
          created_at: { stringValue: new Date().toISOString() },
          helpful_count: { integerValue: "0" },
          is_approved: { booleanValue: false },
          source: { stringValue: "missing_link_report" },
        },
      }),
    });

    const storeData = await storeResponse.json();
    if ((storeData as any).error) {
      return res
        .status((storeData as any).error.code || 500)
        .json({ error: (storeData as any).error.message || "Failed to register report." });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal server error." });
  }
});

export default router;
