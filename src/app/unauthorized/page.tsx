
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-6">
      <h1 className="text-4xl font-bold text-destructive">Acesso Negado</h1>
      <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      <Link to="/">
        <Button>Voltar para o Início</Button>
      </Link>
    </div>
  );
}
