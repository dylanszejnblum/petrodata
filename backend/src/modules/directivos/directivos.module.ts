import { Module } from '@nestjs/common';
import { OperatorsModule } from '../operators/operators.module';
import { DirectivosController } from './directivos.controller';
import { DirectivosService } from './directivos.service';

@Module({
  imports: [OperatorsModule],
  controllers: [DirectivosController],
  providers: [DirectivosService],
})
export class DirectivosModule {}
