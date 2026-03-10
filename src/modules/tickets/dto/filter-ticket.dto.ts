import {
  TicketStatus,
  Department,
  TicketPriority,
} from '@prisma/client';

// Types for filtering the inputs
export interface GetTicketsFilterDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  department?: Department;
  page?: number;
  limit?: number;
}
