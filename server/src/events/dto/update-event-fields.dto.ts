import { PartialType } from '@nestjs/swagger';
import { CreateEventFieldsDto } from './create-event-fields.dto';

export class UpdateEventFieldsDto extends PartialType(CreateEventFieldsDto) {}
