import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { toast } from "sonner";
import {
  Plus, Trash2, GripVertical, CheckSquare, Square,
  X, Check, Loader2, ListChecks
} from "lucide-react";

interface TrackColumn {
  id: string;
  title: string;
  order: number;
  color: string;
}

interface TrackRow {
  id: string;
  title: string;
  order: number;
}

interface TrackCheck {
  id: string;
  column_id: string;
  row_id: string;
  checked: boolean;
}

export default function TrackRoutinePage() {
  const [columns, setColumns] = useState<TrackColumn[]>([]);
  const [rows, setRows] = useState<TrackRow[]>([]);
  const [checks, setChecks] = useState<TrackCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newRowTitle, setNewRowTitle] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [addingRow, setAddingRow] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [colRes, rowRes, checkRes] = await Promise.all([
      supabase.from("track_routine_columns").select("*").order("order", { ascending: true }),
      supabase.from("track_routine_rows").select("*").order("order", { ascending: true }),
      supabase.from("track_routine_checks").select("*"),
    ]);

    if (colRes.error) toast.error("Erro ao carregar colunas.");
    if (rowRes.error) toast.error("Erro ao carregar linhas.");
    if (checkRes.error) toast.error("Erro ao carregar checks.");

    setColumns((colRes.data as TrackColumn[]) || []);
    setRows((rowRes.data as TrackRow[]) || []);
    setChecks((checkRes.data as TrackCheck[]) || []);

    // Auto-criar checks para combinações existentes
    const existingPairs = new Set((checkRes.data || []).map(c => `${c.column_id}-${c.row_id}`));
    const newChecks: { column_id: string; row_id: string; checked: boolean }[] = [];

    for (const col of colRes.data || []) {
      for (const row of rowRes.data || []) {
        if (!existingPairs.has(`${col.id}-${row.id}`)) {
          newChecks.push({ column_id: col.id, row_id: row.id, checked: false });
        }
      }
    }

    if (newChecks.length > 0) {
      const { data: inserted, error } = await supabase
        .from("track_routine_checks")
        .insert(newChecks)
        .select();

      if (!error && inserted) {
        setChecks(prev => [...prev, ...(inserted as TrackCheck[])]);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    setAddingColumn(true);
    const { data, error } = await supabase
      .from("track_routine_columns")
      .insert({ title: newColumnTitle.trim(), order: columns.length })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar coluna.");
    } else if (data) {
      setColumns(prev => [...prev, data as TrackColumn]);
      setNewColumnTitle("");

      // Criar checks para todas as linhas existentes
      const newChecks = rows.map(r => ({ column_id: data.id, row_id: r.id, checked: false }));
      const { data: inserted } = await supabase
        .from("track_routine_checks")
        .insert(newChecks)
        .select();

      if (inserted) {
        setChecks(prev => [...prev, ...(inserted as TrackCheck[])]);
      }
      toast.success("Coluna adicionada!");
    }
    setAddingColumn(false);
  };

  const handleAddRow = async () => {
    if (!newRowTitle.trim()) return;
    setAddingRow(true);
    const { data, error } = await supabase
      .from("track_routine_rows")
      .insert({ title: newRowTitle.trim(), order: rows.length })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar linha.");
    } else if (data) {
      setRows(prev => [...prev, data as TrackRow]);
      setNewRowTitle("");

      const newChecks = columns.map(c => ({ column_id: c.id, row_id: data.id, checked: false }));
      const { data: inserted } = await supabase
        .from("track_routine_checks")
        .insert(newChecks)
        .select();

      if (inserted) {
        setChecks(prev => [...prev, ...(inserted as TrackCheck[])]);
      }
      toast.success("Linha adicionada!");
    }
    setAddingRow(false);
  };

  const handleToggleCheck = async (columnId: string, rowId: string) => {
    const key = `${columnId}-${rowId}`;
    if (togglingIds.has(key)) return;

    setTogglingIds(prev => new Set(prev).add(key));

    const existing = checks.find(c => c.column_id === columnId && c.row_id === rowId);
    const newChecked = !existing?.checked;

    setChecks(prev =>
      prev.map(c =>
        c.column_id === columnId && c.row_id === rowId
          ? { ...c, checked: newChecked }
          : c
      )
    );

    if (existing) {
      await supabase
        .from("track_routine_checks")
        .update({ checked: newChecked, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    setTogglingIds(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const handleDeleteColumn = async (colId: string) => {
    const { error } = await supabase.from("track_routine_columns").delete().eq("id", colId);
    if (error) { toast.error("Erro ao excluir coluna."); return; }
    setColumns(prev => prev.filter(c => c.id !== colId));
    setChecks(prev => prev.filter(c => c.column_id !== colId));
    toast.success("Coluna excluída.");
  };

  const handleDeleteRow = async (rowId: string) => {
    const { error } = await supabase.from("track_routine_rows").delete().eq("id", rowId);
    if (error) { toast.error("Erro ao excluir linha."); return; }
    setRows(prev => prev.filter(r => r.id !== rowId));
    setChecks(prev => prev.filter(c => c.row_id !== rowId));
    toast.success("Linha excluída.");
  };

  const getCheck = (columnId: string, rowId: string) => {
    return checks.find(c => c.column_id === columnId && c.row_id === rowId);
  };

  if (loading) return <LoadingSkeleton className="h-[400px] w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <PageHeader
          title="Track Rotina"
          description="Checklist diário de tarefas e rotinas da equipe."
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Nova coluna..."
            value={newColumnTitle}
            onChange={e => setNewColumnTitle(e.target.value)}
            className="w-48 h-9 text-sm"
            onKeyDown={e => { if (e.key === 'Enter') handleAddColumn(); }}
          />
          <Button size="sm" onClick={handleAddColumn} disabled={!newColumnTitle.trim() || addingColumn}>
            {addingColumn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Coluna
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Nova linha..."
            value={newRowTitle}
            onChange={e => setNewRowTitle(e.target.value)}
            className="w-48 h-9 text-sm"
            onKeyDown={e => { if (e.key === 'Enter') handleAddRow(); }}
          />
          <Button size="sm" onClick={handleAddRow} disabled={!newRowTitle.trim() || addingRow}>
            {addingRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Linha
          </Button>
        </div>
      </div>

      {columns.length === 0 || rows.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Adicione colunas e linhas para começar.</p>
            <p className="text-xs mt-1">Colunas podem ser dias do mês, sprints, ou qualquer categoria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-64 min-w-[200px]">
                  Tarefas / Rotinas
                </th>
                {columns.map(col => (
                  <th key={col.id} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[80px] relative group">
                    <div className="flex items-center justify-center gap-1">
                      <span>{col.title}</span>
                      <button
                        onClick={() => handleDeleteColumn(col.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                        title="Excluir coluna"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${ri % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                  <td className="px-4 py-3 text-sm font-medium text-foreground group flex items-center gap-2">
                    <span className="truncate">{row.title}</span>
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 shrink-0 ml-auto"
                      title="Excluir linha"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                  {columns.map(col => {
                    const check = getCheck(col.id, row.id);
                    const isChecked = check?.checked || false;
                    const key = `${col.id}-${row.id}`;
                    const isToggling = togglingIds.has(key);

                    return (
                      <td key={col.id} className="px-3 py-3 text-center">
                        {isToggling ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                        ) : (
                          <button
                            onClick={() => handleToggleCheck(col.id, row.id)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            {isChecked ? (
                              <CheckSquare className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground" />
                            )}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
