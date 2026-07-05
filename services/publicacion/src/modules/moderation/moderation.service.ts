import { Injectable, Logger } from '@nestjs/common';
import {
  SageMakerRuntimeClient,
  InvokeEndpointCommand,
} from '@aws-sdk/client-sagemaker-runtime';

/**
 * Resultado de moderar un texto. Se persiste junto al post/comentario.
 *
 * - OK        → el clasificador determinó que el texto no es cyberbullying.
 * - FLAGGED   → el clasificador marcó el texto como cyberbullying.
 * - UNCHECKED → no se pudo moderar (flag apagado, sin endpoints, o error/timeout de SageMaker).
 *               Política fail-open: el contenido se guarda igual sin bloquear al usuario.
 */
export interface ModerationResult {
  moderationStatus: 'OK' | 'FLAGGED' | 'UNCHECKED';
  toxicityScore: number | null;
  lang: string | null;
}

interface TranslatorResponse {
  text: string;
  srcLang: string;
}

interface ClassifierResponse {
  label: 'bullying' | 'ok';
  score: number;
}

const UNCHECKED: ModerationResult = {
  moderationStatus: 'UNCHECKED',
  toxicityScore: null,
  lang: null,
};

/**
 * Orquesta el pipeline de detección de cyberbullying:
 *   texto → traductor (ES→EN, propio en SageMaker) → clasificador (propio en SageMaker) → veredicto.
 *
 * La detección de idioma vive en el contrato del traductor (devuelve `srcLang`);
 * si el texto ya está en inglés el endpoint lo devuelve intacto con srcLang='en'.
 *
 * Controlado por env vars inyectadas por CDK (ver publication-stack.ts):
 *   MODERATION_ENABLED             'true' | 'false'  (default 'false')
 *   SAGEMAKER_TRANSLATOR_ENDPOINT  nombre del endpoint del traductor
 *   SAGEMAKER_CLASSIFIER_ENDPOINT  nombre del endpoint del clasificador
 *   MODERATION_TIMEOUT_MS          timeout por invocación (default 4000)
 */
@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  private readonly enabled = process.env.MODERATION_ENABLED === 'true';
  private readonly translatorEndpoint = process.env.SAGEMAKER_TRANSLATOR_ENDPOINT ?? '';
  private readonly classifierEndpoint = process.env.SAGEMAKER_CLASSIFIER_ENDPOINT ?? '';
  private readonly timeoutMs = Number(process.env.MODERATION_TIMEOUT_MS ?? 4000);

  private readonly client = new SageMakerRuntimeClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
  });

  async moderate(text: string): Promise<ModerationResult> {
    if (!this.enabled || !this.translatorEndpoint || !this.classifierEndpoint) {
      return UNCHECKED;
    }
    if (!text || !text.trim()) {
      // Nada que moderar; se trata como OK para no ensuciar métricas de fallo.
      return { moderationStatus: 'OK', toxicityScore: 0, lang: null };
    }

    try {
      // 1) Traducción ES→EN (con detección de idioma incluida en el contrato).
      const translation = await this.invoke<TranslatorResponse>(
        this.translatorEndpoint,
        { text },
      );

      // 2) Clasificación de cyberbullying sobre el texto en inglés.
      const classification = await this.invoke<ClassifierResponse>(
        this.classifierEndpoint,
        { text: translation.text },
      );

      return {
        moderationStatus: classification.label === 'bullying' ? 'FLAGGED' : 'OK',
        toxicityScore: classification.score,
        lang: translation.srcLang ?? null,
      };
    } catch (err: any) {
      // Fail-open: cualquier error/timeout no debe impedir guardar el contenido.
      this.logger.warn(`Moderación no disponible, se guarda como UNCHECKED: ${err?.message ?? err}`);
      return UNCHECKED;
    }
  }

  /** Invoca un endpoint SageMaker con JSON in/out y un timeout duro por request. */
  private async invoke<T>(endpointName: string, payload: unknown): Promise<T> {
    const command = new InvokeEndpointCommand({
      EndpointName: endpointName,
      ContentType: 'application/json',
      Accept: 'application/json',
      Body: Buffer.from(JSON.stringify(payload)),
    });

    const response = await this.client.send(command, {
      abortSignal: AbortSignal.timeout(this.timeoutMs),
    });

    const body = Buffer.from(response.Body as Uint8Array).toString('utf-8');
    return JSON.parse(body) as T;
  }
}
