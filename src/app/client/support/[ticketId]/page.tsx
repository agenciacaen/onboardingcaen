import { useParams } from 'react-router-dom';
import { TicketChatView } from '@/modules/support/components/TicketChatView';

export function ClientTicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <div className="w-full h-full">
      <TicketChatView ticketId={id} />
    </div>
  );
}
