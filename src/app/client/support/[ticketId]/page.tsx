import { useParams } from 'react-router-dom';
import { TicketChatView } from '@/modules/support/components/TicketChatView';

export function ClientTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();

  if (!ticketId) return null;

  return (
    <div className="w-full h-full">
      <TicketChatView ticketId={ticketId} />
    </div>
  );
}
