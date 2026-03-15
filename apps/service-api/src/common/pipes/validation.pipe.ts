import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true, // Strip away properties that don't have decorators
      forbidNonWhitelisted: true, // Reject unexpected fields for stricter request validation
      transform: false, // Disable automatic transformation
      transformOptions: {
        enableImplicitConversion: false, // Disable implicit type conversion
      },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = this.formatValidationErrors(validationErrors);

        return new BadRequestException({
          message: `Validation failed: ${errors.length} field(s) have issues`,
          errorCount: errors.length,
          errors,
          hint: 'Please check the required fields and their formats',
        });
      },
    });
  }

  private formatValidationErrors(validationErrors: ValidationError[]): {
    field: string;
    constraint: string;
    message: string;
    receivedValue: unknown;
    nestedErrors?: unknown[];
  }[] {
    const errors = [];

    for (const error of validationErrors) {
      const constraints = error.constraints || {};

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatValidationErrors(error.children);
        errors.push({
          field: error.property,
          constraint: 'nested',
          message: `Nested validation failed in ${error.property}`,
          receivedValue: this.getReceivedValue(error),
          nestedErrors,
        });
        continue;
      }

      // Handle individual field errors
      const fieldErrors = Object.entries(constraints).map(([constraint, message]) => {
        // Provide more user-friendly error messages
        let friendlyMessage = message;

        if (constraint === 'isNotEmpty') {
          friendlyMessage = `${error.property} is required and cannot be empty`;
        } else if (constraint === 'isString') {
          friendlyMessage = `${error.property} must be a string`;
        } else if (constraint === 'maxLength') {
          const match = message.match(/(\d+)/);
          const maxLength = match ? match[1] : '255';
          friendlyMessage = `${error.property} must not exceed ${maxLength} characters`;
        } else if (constraint === 'isEnum') {
          friendlyMessage = `${error.property} must be one of the allowed values`;
        } else {
          friendlyMessage = message;
        }

        return {
          field: error.property,
          constraint,
          message: friendlyMessage,
          receivedValue: this.getReceivedValue(error),
        };
      });

      errors.push(...fieldErrors);
    }

    return errors;
  }

  private getReceivedValue(error: ValidationError): unknown {
    return error.value !== undefined ? error.value : 'Not provided';
  }
}
