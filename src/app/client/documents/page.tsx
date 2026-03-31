import { DocumentLibrary } from "@/components/documents/DocumentLibrary";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";

export function ClientDocumentsPage() {
  const { clientId } = useAuth();
  
  if (!clientId) {
    return <div className="p-8 text-center text-slate-500">Carregando informações do cliente...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Meus Documentos" 
        description="Acesse seus contratos, minutas, briefings e relatórios em um só lugar."
      />
      
      <DocumentLibrary clientIdFilter={clientId} />
    </div>
  );
}
