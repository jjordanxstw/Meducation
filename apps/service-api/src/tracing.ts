/**
 * OpenTelemetry tracing bootstrap (9.1).
 *
 * Imported as the very first line of main.ts so auto-instrumentation can hook
 * http/express/pg before those modules are loaded. Tracing is only enabled when
 * OTEL_EXPORTER_OTLP_ENDPOINT is set, so local/dev runs are unaffected.
 *
 * The SDK is required lazily (P2): the auto-instrumentations bundle pulls in
 * dozens of packages, and loading it unconditionally slowed every Render cold
 * start even though tracing is off in most environments.
 */
/* eslint-disable @typescript-eslint/no-var-requires */

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();

if (endpoint && process.env.OTEL_SDK_DISABLED !== 'true') {
  const { NodeSDK } = require('@opentelemetry/sdk-node') as typeof import('@opentelemetry/sdk-node');
  const { getNodeAutoInstrumentations } =
    require('@opentelemetry/auto-instrumentations-node') as typeof import('@opentelemetry/auto-instrumentations-node');
  const { OTLPTraceExporter } =
    require('@opentelemetry/exporter-trace-otlp-http') as typeof import('@opentelemetry/exporter-trace-otlp-http');
  const { resourceFromAttributes } = require('@opentelemetry/resources') as typeof import('@opentelemetry/resources');
  const { ATTR_SERVICE_NAME } =
    require('@opentelemetry/semantic-conventions') as typeof import('@opentelemetry/semantic-conventions');

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'medical-portal-api',
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint.replace(/\/$/, '')}/v1/traces`,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  const shutdown = () => {
    sdk
      .shutdown()
      .catch(() => undefined)
      .finally(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export {};
