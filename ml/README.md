# AI module — Cyberbullying detection

Scaffolding for the AI final project module: automatic moderation of posts and comments detecting
cyberbullying. The classifier is trained on an **English** dataset; to support **Spanish**, a
neural ES→EN translator runs as a preceding phase.

Both models run on **SageMaker** as owned endpoints, and the **publication** microservice consumes
them as a filter (see `../services/publicacion/src/modules/moderation/`).

```
ES/EN text → [fbook-translator] → EN text → [fbook-bullying-classifier] → {label, score}
                  (SageMaker)                       (SageMaker)
```

## Structure

```
ml/
├── CONTRACT.md              # I/O contract for both endpoints (SOURCE OF TRUTH)
├── translator/              # REAL ES→EN container (fastText LID + Helsinki-NLP MarianMT)
│   ├── app.py               #   BYOC wrapper: /ping + /invocations → {text, srcLang}
│   └── models/              #   model modules reused from PR #11 (feature/nlp-fase1)
├── classifier/              # REAL cyberbullying container (DistilBERT binary)
│   ├── app.py               #   BYOC wrapper: /ping + /invocations → {label, score}
│   └── model/               #   trained artifact (gitignored, ~255MB — see its README)
└── training/                # Training notebook + dataset (for the ML teammate)
    ├── train_classifier.ipynb   # DistilBERT binary fine-tuning (translator needs no training)
    └── cyberbullying_tweets.csv
```

## Current status — **deployed and verified end-to-end (2026-07-19)**

- **Backend**: integration complete and working. `MODERATION_ENABLED=true` in the deployed
  `publicacion` service (turned on automatically because `FbookAiModerationStack` was deployed with
  `--context deployAi=true`). With the flag off it falls back to fail-open
  (`moderationStatus=UNCHECKED`) without depending on AWS.
- **Infra (CDK)**: `FbookAiModerationStack` is **live** — S3 bucket `fbook-ml-<account>`, the 2
  inference images (built & pushed by `DockerImageAsset`), and the 2 SageMaker endpoints
  (`fbook-translator`, `fbook-bullying-classifier`, both `ml.t2.medium`, `InService`). Always-on
  endpoints, ~$50+/month each while deployed — destroy when not actively demoing/testing (see
  `../../decisions-ai-moderation.md §10`).
- **Models** — both real, deployed, and verified against real AWS infra:
  - **Translator** (`translator/`): fastText LID for language detection + Helsinki-NLP/opus-mt-es-en
    (MarianMT) for ES→EN, reused from PR #11 and wrapped in the BYOC contract (`{text, srcLang}`).
  - **Classifier** (`classifier/`): DistilBERT binary (`distilbert-base-uncased`, trained in
    `training/train_classifier.ipynb` on Google Colab GPU) wrapped in the BYOC contract
    (`{label, score}`). The trained artifact lives in `classifier/model/` (gitignored, ~255MB — see
    `classifier/README.md`).

**End-to-end verification results** (via the real ALB + Cognito JWT + real SageMaker endpoints, see
`../../decisions-ai-moderation.md §10` for the full write-up):

| Input | `lang` | `moderationStatus` | `toxicityScore` |
|---|---|---|---|
| "You are a stupid idiot, nobody likes you, just disappear" (en) | `en` | `FLAGGED` | 0.964 |
| "que tengan todos un excelente dia, los quiero mucho" (es, benign) | `es` | `OK` | 0.137 |
| "eres una basura humana, todos te odian y ojala desaparezcas" (es, toxic) | `es` | `FLAGGED` | 0.768 |

## Flow to bring the AI module to production

The inference images are built and pushed by CDK itself (`DockerImageAsset` in
`AiModerationStack`), so there is **no manual `docker build`/`push` step** and no ECR ordering
problem: `cdk deploy` builds the images, uploads them, and only then creates the endpoints.

```bash
cd fbook-cdk
npx cdk deploy FbookAiModerationStack FbookPublicationStack --context deployAi=true --profile fbook
```

The first deploy builds the translator image (~800 MB of models, be patient). This creates the
SageMaker endpoints and turns on `MODERATION_ENABLED=true` in the publication microservice (which
already has the `sagemaker:InvokeEndpoint` permission). Validate that the responses honor
`CONTRACT.md` and that a toxic post/comment ends up as `moderationStatus=FLAGGED` with
`toxicityScore` and `lang` — already done, see the table above.

> **Note if redeploying from scratch:** `FbookPublicationStack` needs `usuario` running too
> (`PublicacionesService.create()` validates `idUsuario` against it synchronously), and the whole
> app needs Cognito + network + cluster + ALB deployed first. See `fbook-cdk/ARCHITECTURE.md` for
> the full stack dependency order.

## Turn the module off (cost saving)

```bash
npx cdk destroy FbookAiModerationStack --profile fbook
npx cdk deploy FbookPublicationStack --profile fbook   # back to MODERATION_ENABLED=false → fail-open
```

## Test locally

Real classifier (needs `classifier/model/` populated — see `classifier/README.md`):

```bash
docker build -t fbook-classifier ml/classifier && docker run -p 8080:8080 fbook-classifier
curl -s localhost:8080/invocations -H 'Content-Type: application/json' \
  -d '{"text":"you are stupid, nobody likes you"}'   # => {"label":"bullying","score":0.64...}
```

Real translator (first build downloads ~800 MB of models, be patient):

```bash
docker build -t fbook-translator ml/translator && docker run -p 8080:8080 fbook-translator
curl -s localhost:8080/invocations -H 'Content-Type: application/json' \
  -d '{"text":"eres un idiota, nadie te quiere"}'
# => {"text":"you are an idiot, nobody likes you","srcLang":"es"}
```
