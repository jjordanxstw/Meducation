import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class UuidValidationPipe implements PipeTransform<string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isUUID(value, 4)) {
      throw new BadRequestException(
        `Invalid UUID format for ${metadata.data}. Expected a valid UUID v4.`,
      );
    }
    return value;
  }
}
