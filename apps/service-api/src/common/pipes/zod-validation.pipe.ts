import { Injectable, PipeTransform } from '@nestjs/common';
import { ErrorCode } from '@medical-portal/shared';
import { AppException } from '../errors';

/**
 * Minimal structural shape of a Zod schema's safeParse result. Declared
 * structurally (rather than importing zod's nominal types) so the pipe is
 * immune to zod version skew between packages.
 */
export interface ParsableSchema<T> {
  safeParse(value: unknown):
    | { success: true; data: T }
    | { success: false; error: { issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }> } };
}

/**
 * Validates (and parses/coerces) a value against a Zod schema from
 * @medical-portal/shared. Usage:
 *   @Body(new ZodValidationPipe(createSubjectSchema)) dto: CreateSubjectInput
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ParsableSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      throw new AppException(ErrorCode.VALIDATION_FAILED, { issues }, 'Validation failed');
    }
    return result.data;
  }
}
