import { TicketStatus } from 'src/generated/prisma/enums';

export interface AssignTicketDto {
  assigneeId: string;
}

export interface UpdateTicketStatusDto {
  status: TicketStatus;
}
