import Anthropic from '@anthropic-ai/sdk';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CategoriaForo } from '@prisma/client';

const CATEGORIAS: Record<CategoriaForo, string> = {
  EXPERIENCIAS: 'experiencias usando equipos o recursos del laboratorio',
  CREACIONES: 'proyectos, prototipos, apps o cosas que la persona creó',
  CONSEJOS: 'consejos para otros estudiantes o profesionales',
  METODOLOGIAS: 'metodologías de diseño, investigación o de trabajo',
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

  async revisar(entrada: {
    titulo: string;
    contenido: string;
    categoria: CategoriaForo;
    area?: string | null;
  }) {
    if (!this.cliente) return;

    let veredicto: Veredicto;
    try {
      const respuesta = await this.cliente.messages.create({
        model: this.modelo,
        max_tokens: 512,
        system:
          'Eres el moderador del foro del Laboratorio Integrado de Sistemas (LIS) de la Universidad de Antioquia. ' +
          'Al LIS llegan estudiantes de muchas carreras de ingeniería (sistemas, telecomunicaciones, electrónica, ' +
          'eléctrica, mecánica, ambiental, industrial, biomédica y otras), no solo sistemas. ' +
          'Habilita una publicación si es apropiada y aporta a la comunidad: experiencias con equipos o proyectos, ' +
          'creaciones, consejos, metodologías, dudas o aprendizajes de CUALQUIER disciplina. No la rechaces por la ' +
          'carrera ni por el tema técnico. Rechaza solo lo que claramente sobra: insultos, spam o publicidad, ' +
          'contenido ilegal o datos personales sensibles. Ante la duda, aprueba. La razón debe ser breve y amable, ' +
          'dirigida al autor.',
        messages: [
          {
            role: 'user',
            content:
              `Categoría: ${entrada.categoria} (${CATEGORIAS[entrada.categoria]}).` +
              (entrada.area ? ` Área/carrera del autor: ${entrada.area}.` : '') +
              `\n\nTítulo: ${entrada.titulo}\n\nContenido:\n${entrada.contenido}`,
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
