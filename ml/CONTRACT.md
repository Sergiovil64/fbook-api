# SageMaker endpoints I/O contract — AI module (cyberbullying moderation)

This document is the **source of truth** for the contract between the publication microservice
(`services/publicacion`) and the two SageMaker endpoints. The teammate who trains the real models
**must respect this contract exactly** so the integration keeps working with no backend changes.

Both endpoints receive and return **JSON** (`Content-Type: application/json`,
`Accept: application/json`) over SageMaker's standard `POST /invocations` path, and answer `200`
on `GET /ping` for the health check.

---

## 1. Translator — endpoint `fbook-translator`

Translates ES→EN as the phase prior to the classifier. **Language detection lives here**: if the
text is already in English, it is returned unchanged with `srcLang: "en"`.

**Request**
```json
{ "text": "eres un idiota, nadie te quiere" }
```

**Response**
```json
{ "text": "you are an idiot, nobody likes you", "srcLang": "es" }
```

| Field     | Type   | Description                                              |
| --------- | ------ | ------------------------------------------------------- |
| `text`    | string | Text translated to English (or the original if already EN). |
| `srcLang` | string | Detected language of the original text: `"es"` or `"en"`. |

---

## 2. Classifier — endpoint `fbook-bullying-classifier`

Classifies **English** text as cyberbullying or not. Trained on the English dataset.

**Request**
```json
{ "text": "you are an idiot, nobody likes you" }
```

**Response**
```json
{ "label": "bullying", "score": 0.94 }
```

| Field   | Type   | Description                                                   |
| ------- | ------ | ------------------------------------------------------------ |
| `label` | string | `"bullying"` or `"ok"`.                                      |
| `score` | number | Toxicity probability/confidence, `0.0`–`1.0`.               |

---

## 3. How the backend consumes it

`services/publicacion/src/modules/moderation/moderation.service.ts`:

1. `create`/`update` of a post or comment → `ModerationService.moderate(text)`.
2. Invokes `fbook-translator` → `{ text, srcLang }`.
3. Invokes `fbook-bullying-classifier` with the translated `text` → `{ label, score }`.
4. Persists on the item: `moderationStatus` (`FLAGGED` if `label==='bullying'`, otherwise `OK`),
   `toxicityScore = score`, `lang = srcLang`.
5. **Fail-open**: on any error/timeout (or when `MODERATION_ENABLED=false`), it stores
   `moderationStatus='UNCHECKED'` without blocking the user.

Per-invocation timeout: `MODERATION_TIMEOUT_MS` (default 4000 ms).

> When switching from dummy → real model, **the backend is not touched**: just replace the image
> in the corresponding ECR repo (`fbook-ml-translator` / `fbook-ml-classifier`) and update the
> endpoint, as long as the JSON in/out keeps following this contract.
