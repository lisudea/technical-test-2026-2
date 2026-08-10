import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CategoriaEquipo, EstadoEquipo } from '@prisma/client';

export class FiltroEquiposDto {
  @ApiPropertyOptional({ enum: CategoriaEquipo })
  @IsOptional()
  @IsEnum(CategoriaEquipo)
  categoria?: CategoriaEquipo;

  @ApiPropertyOptional({ enum: EstadoEquipo })
  @IsOptional()
  @IsEnum(EstadoEquipo)
  estado?: EstadoEquipo;

  @ApiPropertyOptional({ description: 'Busca por nombre o serial' })
  @IsOptional()
  @IsString()
  buscar?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 10;
}
