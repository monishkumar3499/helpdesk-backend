import {
  Department,
  TicketPriority,
  TicketStatus,
} from 'src/generated/prisma/enums';

// Types for filtering the inputs
export interface GetTicketsFilterDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  department?: Department;
  page?: number;
  limit?: number;
}
