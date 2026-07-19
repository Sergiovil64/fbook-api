# Classifier container — cyberbullying (real model)

SageMaker BYOC container for the `fbook-bullying-classifier` endpoint. Wraps the DistilBERT binary
model trained by the team (`ml/training/train_classifier.ipynb`, on Google Colab GPU) and exposes it
under the project contract (`ml/CONTRACT.md` §2): `POST /invocations` →
`{ "label": "bullying" | "ok", "score": 0.0–1.0 }`.

- Base model: `distilbert-base-uncased`, binary head (`num_labels=2`).
- Labels: `{0: not_cyberbullying, 1: cyberbullying}` → mapped to `ok` / `bullying`.
- `score` = probability of the `cyberbullying` class (used as `toxicityScore` in the backend).
- Preprocessing (`clean_text`) is copied verbatim from the notebook for train/inference parity.
- Input text arrives in English (the `fbook-translator` endpoint translates it first).
- `token_type_ids` is dropped from the tokenizer output before calling the model: DistilBERT has no
  segment embeddings and `DistilBertForSequenceClassification.forward()` does not accept it (some
  saved tokenizer configs still emit it by default).

## Trained artifact — `model/`

`model/` holds the artifact produced by `ml/training/train_classifier.ipynb`
(`config.json`, `model.safetensors` ~255MB, `tokenizer.json`, `tokenizer_config.json`). It is
**gitignored** (see root `.gitignore` in `fbook-api/`) because of its size — whoever builds/deploys
this image must have it in place locally first. It gets baked into the Docker image at build time.

## Status

✅ CDK asset in `fbook-cdk/lib/ai-moderation-stack.ts` points at this directory.
✅ Validated locally: `/ping` → 200, `/invocations` returns `{label, score}` for bullying/ok/empty text.
✅ Deployed to AWS as the `fbook-bullying-classifier` SageMaker endpoint (`ml.t2.medium`) and verified
end-to-end against real traffic (2026-07-19) — see `../../decisions-ai-moderation.md §10`.

## Test locally

```bash
docker build -t fbook-classifier ml/classifier && docker run -p 8080:8080 fbook-classifier
curl -s localhost:8080/invocations -H 'Content-Type: application/json' \
  -d '{"text":"you are stupid, nobody likes you"}'   # => {"label":"bullying","score":0.64...}
```

## Deploy

```bash
cd fbook-cdk
npx cdk deploy FbookAiModerationStack FbookPublicationStack --context deployAi=true --profile fbook
```
