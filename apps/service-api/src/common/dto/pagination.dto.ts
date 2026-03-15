import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

const toNumber = (value: unknown): number | undefined => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : undefined;
};

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  limit?: number;
}
