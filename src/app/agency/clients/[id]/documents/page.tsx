import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentLibrary } from "@/components/documents/DocumentLibrary";
import { FileText } from "lucide-react";

export default function AgencyClientDocumentsPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentLibrary clientIdFilter={id || ""} />
        </CardContent>
      </Card>
    </div>
  );
}
