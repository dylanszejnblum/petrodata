import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 50;
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): { data: T[]; pagination: { page: number; limit: number; total: number } } {
  return { data, pagination: { page, limit, total } };
}

export function skipTake(page: number, limit: number): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}
