import { Router } from "express";
import { verifyAdminToken } from "./admin.js";

const router = Router();

router.post("/github-sync/commit", verifyAdminToken, async (req, res) => {
  try {
    const { owner, repo, token, branch, path: filePath, content, message } = req.body || {};
    if (!owner || !repo || !token || !filePath || !content) {
      return res.status(400).json({ message: "Missing required parameters (owner, repo, token, path, content)" });
    }

    const cleanBranch = branch ? branch.trim() : "main";
    const cleanPath = filePath.replace(/^\/+/g, "");
    const cleanOwner = owner.trim();
    const cleanToken = token.trim();
    let cleanRepo = repo.trim();

    const authHeader = cleanToken.toLowerCase().startsWith("ghp_")
      ? `token ${cleanToken}`
      : `Bearer ${cleanToken}`;

    try {
      for (const endpoint of [
        `https://api.github.com/users/${cleanOwner}/repos?per_page=100`,
        `https://api.github.com/orgs/${cleanOwner}/repos?per_page=100`,
      ]) {
        const resolveRes = await fetch(endpoint, {
          headers: { Authorization: authHeader, Accept: "application/vnd.github.v3+json", "User-Agent": "node-fetch" },
        });
        if (resolveRes.ok) {
          const repos = (await resolveRes.json()) as any[];
          if (Array.isArray(repos)) {
            const matching = repos.find((r) => r.name?.toLowerCase() === cleanRepo.toLowerCase());
            if (matching && matching.name !== cleanRepo) cleanRepo = matching.name;
          }
          break;
        }
      }
    } catch {}

    let sha: string | undefined;
    let getErrorContext = "";

    try {
      const fetchRes = await fetch(
        `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${cleanPath}?ref=${encodeURIComponent(cleanBranch)}&_t=${Date.now()}`,
        {
          headers: {
            Authorization: authHeader,
            Accept: "application/vnd.github.v3+json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            "User-Agent": "node-fetch",
          },
        }
      );

      if (fetchRes.ok) {
        const data = (await fetchRes.json()) as any;
        if (data?.sha) sha = data.sha;
      } else if (fetchRes.status === 404) {
        const fallbackRes = await fetch(
          `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${cleanPath}?_t=${Date.now()}`,
          {
            headers: {
              Authorization: authHeader,
              Accept: "application/vnd.github.v3+json",
              "Cache-Control": "no-cache",
              "User-Agent": "node-fetch",
            },
          }
        );
        if (fallbackRes.ok) {
          const d = (await fallbackRes.json()) as any;
          if (d?.sha) sha = d.sha;
        } else if (fallbackRes.status !== 404) {
          const errJSON = (await fallbackRes.json().catch(() => ({}))) as any;
          getErrorContext = `Default branch lookup failed with status ${fallbackRes.status}: ${errJSON.message || "Unknown"}`;
        }
      } else {
        const errJSON = (await fetchRes.json().catch(() => ({}))) as any;
        getErrorContext = `Target branch lookup failed with status ${fetchRes.status}: ${errJSON.message || "Unknown"}`;
      }
    } catch (e: any) {
      getErrorContext = `Network error fetching repository contents: ${e.message || e}`;
    }

    if (getErrorContext && !sha) {
      return res.status(400).json({
        message: `GitHub Sync connection aborted. ${getErrorContext}\n\nPlease check your repository config and token permissions.`,
      });
    }

    const encodedContent = Buffer.from(content, "utf8").toString("base64");
    const payload: any = {
      message: message || "Admin Release Sync: Static file update",
      content: encodedContent,
      branch: cleanBranch,
    };
    if (sha) payload.sha = sha;

    const saveRes = await fetch(
      `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${cleanPath}`,
      {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "node-fetch",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      let errMsg = errText;
      try { errMsg = JSON.parse(errText).message || errText; } catch {}
      return res.status(saveRes.status).json({ message: errMsg });
    }

    const result = (await saveRes.json()) as any;
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ message: `Internal server error during GitHub sync: ${err.message || err}` });
  }
});

export default router;
