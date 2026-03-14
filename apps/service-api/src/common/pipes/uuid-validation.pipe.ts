import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { AppException } from '../errors';
import { ErrorCode } from '@medical-portal/shared';

@Injectable()
export class UuidValidationPipe implements PipeTransform<string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isUUID(value, 4)) {
      throw new AppException(
        ErrorCode.VALIDATION_INVALID_INPUT,
        { field: metadata.data, expected: 'uuid_v4' },
        `Invalid UUID format for ${metadata.data}. Expected a valid UUID v4.`,
      );
    }
    return value;
  }
}
