import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';

@Injectable()
export class EmfMetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly serviceName: string,
    private readonly namespace: string,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const route: string = req.route?.path ?? req.url ?? 'unknown';
    const method: string = req.method;
    const start = Date.now();

    const emit = (errorCount: number, statusCode: number) => {
      const latency = Date.now() - start;
      const payload = {
        _aws: {
          Timestamp: Date.now(),
          CloudWatchMetrics: [
            {
              Namespace: this.namespace,
              Dimensions: [['Service'], ['Service', 'Route', 'Method']],
              Metrics: [
                { Name: 'RequestCount', Unit: 'Count' },
                { Name: 'RequestLatencyMs', Unit: 'Milliseconds' },
                { Name: 'ErrorCount', Unit: 'Count' },
              ],
            },
          ],
        },
        Service: this.serviceName,
        Route: route,
        Method: method,
        StatusCode: statusCode,
        RequestCount: 1,
        RequestLatencyMs: latency,
        ErrorCount: errorCount,
      };
      process.stdout.write(JSON.stringify(payload) + '\n');
    };

    return next.handle().pipe(
      tap(() => emit(0, res.statusCode ?? 200)),
      catchError(err => {
        const status: number = err?.status ?? err?.response?.statusCode ?? 500;
        emit(1, status);
        return throwError(() => err);
      }),
    );
  }
}
