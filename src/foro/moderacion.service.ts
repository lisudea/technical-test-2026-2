import Anthropic from '@anthropic-ai/sdk';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CategoriaForo } from '@prisma/client';

const CATEGORIAS: Record<CategoriaForo, string> = {
  EXPERIENCIAS: 'experiencias usando equipos del laboratorio',
  CREACIONES: 'proyectos, apps o SaaS que la persona creó',
  CONSEJOS: 'consejos para otros desarrolladores',
  METODOLOGIAS: 'metodologías de diseño o de trabajo',
};

interface Veredicto {
  aprobado: boolean;
  razon: string;
}

const ESQUEMA = {
  type: 'object',
  properties: {
    aprobado: { type: 'boolean' },
    razon: { type: 'string' },
  },
  required: ['aprobado', 'razon'],
  additionalProperties: false,
} as const;

@Injectable()
export class ModeracionService {
  private readonly logger = new Logger(ModeracionService.name);
  private cliente?: Anthropic;
  private modelo: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) this.cliente = new Anthropic({ apiKey });
    this.modelo = config.get<string>('ANTHROPIC_MODEL') ?? 'claude-opus-4-8';
  }

  get activa() {
    return !!this.cliente;
  }

  async revisar(entrada: { titulo: string; contenido: string; categoria: CategoriaForo }) {
    if (!this.cliente) return;

    let veredicto: Veredicto;
    try {
      const respuesta = await this.cliente.messages.create({
        model: this.modelo,
        max_tokens: 512,
        system:
          'Eres el moderador del foro del Laboratorio de Innovación y Software (LIS) de la Universidad de Antioquia. ' +
          'Habilitas una publicación solo si es apropiada (sin insultos, spam, contenido ilegal ni datos sensibles) ' +
          'y encaja con la temática del foro: experiencias con equipos, creaciones y apps, consejos a desarrolladores ' +
          'y metodologías de diseño. Sé permisivo con el contenido genuino de la comunidad; rechaza solo lo que ' +
          'claramente sobra. La razón debe ser breve y amable, dirigida al autor.',
        messages: [
          {
            role: 'user',
            content:
              `Categoría elegida: ${entrada.categoria} (${CATEGORIAS[entrada.categoria]}).\n\n` +
              `Título: ${entrada.titulo}\n\nContenido:\n${entrada.contenido}`,
          },
        ],
        output_config: { format: { type: 'json_schema', schema: ESQUEMA } },
      });

      const texto = respuesta.content.find((b) => b.type === 'text');
      if (!texto) return;
      veredicto = JSON.parse(texto.text) as Veredicto;
    } catch (err) {
      this.logger.warn(`Moderación con Claude no disponible, se permite la publicación: ${err}`);
      return;
    }

    if (!veredicto.aprobado) {
      throw new BadRequestException(veredicto.razon || 'La publicación no cumple las normas del foro.');
    }
  }
}
