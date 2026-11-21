# Architecture and privacy boundaries

```text
Signed-in shopper → habit questionnaire → optional local hand sizing
  → authenticated server function → Parallel live excerpts → AI Gateway structured verdict
  → user-owned phone_searches row → results and saved history
```

## Screening

`src/lib/research.functions.ts` validates answer shape, authenticates the caller, calls Lovable AI Gateway server-side and saves a structured verdict with the caller's user ID. Database row-level policies restrict access to owners. Private AI credentials are server-only.

New screenings fetch live excerpts through Parallel's connector gateway inside the authenticated function. Search calls run concurrently across independent and retail publisher groups. Results must cover five non-brand domains; output must contain exactly three picks, at least five rejections, and citations to five retrieved domains. Citation URLs must match fetched pages. Sources, excerpts and retrieval timestamp are saved in the result JSON; saved views never re-run a paid search. Brand domains are excluded entirely. There is no model-only fallback. AI interpretation and factual support for each paraphrase still require human review; URL validation alone does not verify a claim. Older saved results remain unchanged and are labeled model-knowledge screenings.

## Camera path

`PalmScan.tsx` opens a local camera stream with audio disabled. MediaPipe produces landmarks; paper detection supplies reference corners; `handMeasure.ts` transforms geometry into centimetres. Thirty samples are combined by median with movement checks. The visible canvas shows paper and hand outline approximations rather than the camera image.

Camera frames are transient browser data and are not saved or uploaded by this app. Palm-down positioning avoids presenting fingerprints; no fingerprint identity matching or biometric templates are implemented. Four numerical sizes per hand are summarized into answers and sent when the questionnaire is submitted. The outline comes from landmarks, not a detailed contour or a direct grip-circumference scan. Accuracy and repeatability still need real-world testing.

External model/WASM downloads require network access but do not upload camera frames. Manual ruler input uses the same numerical fields.

## Pages and tests

Public overview `/`, account entry `/auth`, and authenticated `/quiz`, `/results/$id`, `/history`. TanStack Query loads saved results; each content page has its own metadata.

The live-review, geometry and routing suites passed (eleven tests). A fresh signed-in live screening showed three picks, seven rejections and sixteen citations across six publishers, then restored from saved data after reload. These checks do not certify physical hand accuracy, review interpretation or comprehensive security.
