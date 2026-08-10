import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { CategoriaForo } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ForoService } from './foro.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-actual.decorator';

export class CrearPublicacionDto {
  @ApiProperty({ example: 'Cómo usé la Raspberry para un sensor de aula' })
  @IsString()
  @MinLength(4)
  @MaxLength(120)
  titulo: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  contenido: string;

  @ApiProperty({ enum: CategoriaForo })
  @IsEnum(CategoriaForo)
  categoria: CategoriaForo;
}

export class FiltroForoDto {
  @ApiPropertyOptional({ enum: CategoriaForo })
  @IsOptional()
  @IsEnum(CategoriaForo)
  categoria?: CategoriaForo;

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
  @Max(50)
  limite?: number = 10;
}

@ApiTags('foro')
@Controller('foro')
export class ForoController {
  constructor(private readonly foroService: ForoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar publicaciones del foro con filtro por categoría y paginación' })
  listar(@Query() filtro: FiltroForoDto) {
    return this.foroService.listar(filtro);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una publicación' })
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.foroService.obtener(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Publicar en el foro (requiere sesión)',
    description: 'La primera publicación de un usuario otorga un objeto de regalo para su mascota.',
  })
  crear(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: CrearPublicacionDto) {
    return this.foroService.crear(usuario, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una publicación (autor o administrador)' })
  eliminar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    return this.foroService.eliminar(usuario, id);
  }
}
