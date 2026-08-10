import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('salud')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Estado del servicio' })
  salud() {
    return { servicio: 'lis-api', estado: 'ok', docs: '/docs' };
  }
}
