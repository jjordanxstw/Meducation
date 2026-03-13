/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are set and have correct values.
 * Throws descriptive errors in development, logs warnings in production.
 */

type EnvVar = {
  name: string;
  required: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  description: string;
};

const ENV_VARS: EnvVar[] = [
  {
    name: 'NEXT_PUBLIC_API_URL',
    required: false,
    defaultValue: '/api/v1',
    validator: (value) => {
      try {
        new URL(value.startsWith('/') ? `http://localhost${value}` : value);
        return true;
      } catch {
        return false;
      }
    },
    description: 'Base URL for API requests',
  },
  {
    name: 'NODE_ENV',
    required: false,
    defaultValue: 'development',
    validator: (value) => ['development', 'production', 'test'].includes(value),
    description: 'Environment mode (development, production, test)',
  },
  {
    name: 'NEXT_PUBLIC_API_TIMEOUT',
    required: false,
    defaultValue: '30000',
    validator: (value) => {
      const num = parseInt(value, 10);
      return !isNaN(num) && num > 0 && num <= 120000; // Max 2 minutes
    },
    description: 'API request timeout in milliseconds (max 120000)',
  },
];

/**
 * Validate a single environment variable
 */
function validateEnvVar(envVar: EnvVar): { valid: boolean; value: string; warnings: string[] } {
  const warnings: string[] = [];
  const rawValue = process.env[envVar.name];
  let value = rawValue ?? envVar.defaultValue ?? '';

  // Check if required variable is missing
  if (envVar.required && !rawValue) {
    throw new Error(
      `Missing required environment variable: ${envVar.name}\n` +
      `Description: ${envVar.description}`
    );
  }

  // Use default value if not set
  if (!rawValue && envVar.defaultValue) {
    warnings.push(
      `Using default value for ${envVar.name}: "${envVar.defaultValue}"`
    );
  }

  // Validate value format
  if (envVar.validator && !envVar.validator(value)) {
    throw new Error(
      `Invalid value for ${envVar.name}: "${value}"\n` +
      `Description: ${envVar.description}`
    );
  }

  return { valid: true, value, warnings };
}

/**
 * Validate all environment variables
 */
export function validateEnv(): {
  valid: boolean;
  warnings: string[];
  env: Record<string, string>;
} {
  const warnings: string[] = [];
  const env: Record<string, string> = {};
  let hasError = false;

  for (const envVar of ENV_VARS) {
    try {
      const result = validateEnvVar(envVar);
      env[envVar.name] = result.value;
      warnings.push(...result.warnings);
    } catch (error) {
      hasError = true;
      const message = error instanceof Error ? error.message : String(error);

      if (process.env.NODE_ENV === 'production') {
        console.error(`[Env Validation Error] ${message}`);
      } else {
        console.error(`\n❌ ${message}\n`);
      }
    }
  }

  // Log warnings
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('\n⚠️ Environment Variable Warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn('');
  }

  // Security check for production
  if (process.env.NODE_ENV === 'production') {
    const prodWarnings: string[] = [];

    // Check for insecure configurations
    if (env.NEXT_PUBLIC_API_URL?.includes('localhost')) {
      prodWarnings.push('API URL points to localhost in production');
    }

    if (env.NEXT_PUBLIC_API_URL?.startsWith('http://')) {
      prodWarnings.push('API URL uses insecure HTTP (not HTTPS) in production');
    }

    if (prodWarnings.length > 0) {
      console.error('\n🚨 Production Security Warnings:');
      prodWarnings.forEach(warning => console.error(`  - ${warning}`));
      console.error('');
    }
  }

  return {
    valid: !hasError,
    warnings,
    env,
  };
}

/**
 * Get validated environment variable
 */
export function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    const envVar = ENV_VARS.find(e => e.name === name);
    if (envVar?.required) {
      throw new Error(`Required environment variable not set: ${name}`);
    }
    return envVar?.defaultValue ?? '';
  }
  return value;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Validate environment on module load
 */
const envValidation = validateEnv();
if (!envValidation.valid) {
  const errorMessage =
    'Environment validation failed. Please check your configuration.\n' +
    'Required environment variables are missing or invalid.';
  console.error(errorMessage);
  if (isDevelopment()) {
    throw new Error(errorMessage);
  }
}

export { envValidation };
