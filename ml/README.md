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
├── dummy-translator/        # ES→EN placeholder container (honors the contract)
├── dummy-classifier/        # Classifier placeholder container (honors the contract)
└── training/                # Placeholder training notebooks (for the ML teammate)
    ├── train_classifier.ipynb
    └── train_translator.ipynb
```

## Current status

- **Backend**: integration complete and working (fail-open). With `MODERATION_ENABLED=false` it
  stores everything as `moderationStatus=UNCHECKED` without depending on AWS.
- **Infra (CDK)**: `FbookAiModerationStack` provisions the S3 bucket `fbook-ml-<account>`, the ECR
  repos `fbook-ml-translator` / `fbook-ml-classifier`, and the 2 SageMaker endpoints. It is only
  deployed with `--context deployAi=true` (always-on endpoints, ~$50+/month each).
- **Models**: dummies honoring the contract. The ML teammate replaces them with the real ones.

## Flow to bring the AI module to production

1. **Upload the dataset** (in English) to `s3://fbook-ml-<account>/dataset/`.
2. **Train** with the notebooks in `training/` (or the ML team's own pipeline), honoring
   `CONTRACT.md`.
3. **Publish the inference images** to the ECR repos:
   ```bash
   # example for the classifier (same for the translator with its repo)
   REPO=<account>.dkr.ecr.us-east-1.amazonaws.com/fbook-ml-classifier
   aws ecr get-login-password | docker login --username AWS --password-stdin $REPO
   docker build -t $REPO:latest ml/dummy-classifier   # or the real model image
   docker push $REPO:latest
   ```
4. **Deploy the endpoints**:
   ```bash
   cd ../fbook-cdk
   npx cdk deploy FbookAiModerationStack FbookPublicationStack --context deployAi=true --profile fbook
   ```
   This creates/updates the SageMaker endpoints and turns on `MODERATION_ENABLED=true` in the
   publication microservice (which already has the `sagemaker:InvokeEndpoint` permission).
5. **Validate** that the responses honor `CONTRACT.md` and that a toxic post/comment ends up as
   `moderationStatus=FLAGGED` with `toxicityScore` and `lang`.

## Turn the module off (cost saving)

```bash
npx cdk destroy FbookAiModerationStack --profile fbook
npx cdk deploy FbookPublicationStack --profile fbook   # back to MODERATION_ENABLED=false → fail-open
```

## Test the dummies locally

```bash
docker build -t dummy-classifier ml/dummy-classifier && docker run -p 8080:8080 dummy-classifier
curl -s localhost:8080/invocations -H 'Content-Type: application/json' \
  -d '{"text":"you are an idiot"}'   # => {"label":"bullying","score":...}
```
