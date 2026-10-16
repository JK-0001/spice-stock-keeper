import { useRef, useState, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { FileUp, Upload, X, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

type ColumnRole = 'ignore' | 'items' | 'parties';

interface SheetState {
  name: string;
  // Raw table of strings. First row is NOT assumed to be a header; the user
  // decides per-row whether to include it. headers[i] is the Excel-style
  // letter (A, B, C) just for display.
  headers: string[];
  rows: string[][];
}

interface ParsedWorkbook {
  fileName: string;
  sheets: SheetState[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportFromExcelDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  // Per-sheet state keyed by sheet name
  const [columnRoles, setColumnRoles] = useState<Record<string, ColumnRole[]>>({});
  const [rowIncluded, setRowIncluded] = useState<Record<string, boolean[]>>({});
  const [editedRows, setEditedRows] = useState<Record<string, string[][]>>({});
  const [importing, setImporting] = useState(false);

  function resetAll() {
    setWorkbook(null);
    setActiveSheetIdx(0);
    setColumnRoles({});
    setRowIncluded({});
    setEditedRows({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) resetAll();
    onOpenChange(nextOpen);
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheets: SheetState[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const aoa: unknown[][] = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            blankrows: false,
            defval: '',
          });
          const maxCols = aoa.reduce((m, r) => Math.max(m, r.length), 0);
          const headers = Array.from({ length: maxCols }, (_, i) => colLetter(i));
          const rows = aoa.map((r) => {
            const padded: string[] = [];
            for (let i = 0; i < maxCols; i++) {
              const v = r[i];
              padded.push(v == null ? '' : String(v));
            }
            return padded;
          });
          return { name, headers, rows };
        });

        const roles: Record<string, ColumnRole[]> = {};
        const incl: Record<string, boolean[]> = {};
        const edited: Record<string, string[][]> = {};
        sheets.forEach((s) => {
          roles[s.name] = s.headers.map(() => 'ignore');
          incl[s.name] = s.rows.map(() => true);
          edited[s.name] = s.rows.map((r) => [...r]);
        });

        setWorkbook({ fileName: file.name, sheets });
        setActiveSheetIdx(0);
        setColumnRoles(roles);
        setRowIncluded(incl);
        setEditedRows(edited);
      } catch (err) {
        toast({
          title: 'Could not read file',
          description:
            err instanceof Error ? err.message : 'Please pick a valid .xlsx, .xls, or .csv file.',
          variant: 'destructive',
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: 'Could not read file',
        description: 'File read failed.',
        variant: 'destructive',
      });
    };
    reader.readAsArrayBuffer(file);
  }

  const activeSheet = workbook?.sheets[activeSheetIdx] ?? null;
  const activeRoles = activeSheet ? columnRoles[activeSheet.name] ?? [] : [];
  const activeIncluded = activeSheet ? rowIncluded[activeSheet.name] ?? [] : [];
  const activeEdited = activeSheet ? editedRows[activeSheet.name] ?? [] : [];

  function setRole(colIdx: number, role: ColumnRole) {
    if (!activeSheet) return;
    setColumnRoles((prev) => {
      const next = { ...prev };
      const arr = [...(next[activeSheet.name] ?? [])];
      arr[colIdx] = role;
      next[activeSheet.name] = arr;
      return next;
    });
  }

  function toggleRow(rowIdx: number) {
    if (!activeSheet) return;
    setRowIncluded((prev) => {
      const next = { ...prev };
      const arr = [...(next[activeSheet.name] ?? [])];
      arr[rowIdx] = !arr[rowIdx];
      next[activeSheet.name] = arr;
      return next;
    });
  }

  function toggleAllRows(include: boolean) {
    if (!activeSheet) return;
    setRowIncluded((prev) => {
      const next = { ...prev };
      next[activeSheet.name] = (next[activeSheet.name] ?? []).map(() => include);
      return next;
    });
  }

  function editCell(rowIdx: number, colIdx: number, value: string) {
    if (!activeSheet) return;
    setEditedRows((prev) => {
      const next = { ...prev };
      const table = (next[activeSheet.name] ?? []).map((r) => [...r]);
      if (!table[rowIdx]) table[rowIdx] = [];
      table[rowIdx][colIdx] = value;
      next[activeSheet.name] = table;
      return next;
    });
  }

  // Collect what will be imported across ALL sheets, from edited rows,
  // honouring column roles and row-include checkboxes. Deduplicates
  // case-insensitively within the import batch.
  const collected = useMemo(() => {
    if (!workbook) return { items: [] as string[], parties: [] as string[], emptyRows: 0 };
    const items = new Set<string>();
    const itemsLower = new Set<string>();
    const parties = new Set<string>();
    const partiesLower = new Set<string>();
    let emptyRows = 0;

    for (const sheet of workbook.sheets) {
      const roles = columnRoles[sheet.name] ?? [];
      const incl = rowIncluded[sheet.name] ?? [];
      const edited = editedRows[sheet.name] ?? sheet.rows;
      edited.forEach((row, rIdx) => {
        if (!incl[rIdx]) return;
        let rowContributed = false;
        row.forEach((cell, cIdx) => {
          const role = roles[cIdx];
          if (role === 'ignore') return;
          const name = (cell ?? '').toString().trim();
          if (!name) return;
          const lower = name.toLowerCase();
          if (role === 'items' && !itemsLower.has(lower)) {
            items.add(name);
            itemsLower.add(lower);
            rowContributed = true;
          } else if (role === 'parties' && !partiesLower.has(lower)) {
            parties.add(name);
            partiesLower.add(lower);
            rowContributed = true;
          }
        });
        // Count rows that have mapped columns but contributed nothing
        // (i.e. all mapped cells were empty) — gives client feedback.
        const anyMapped = row.some((_, cIdx) => roles[cIdx] && roles[cIdx] !== 'ignore');
        if (anyMapped && !rowContributed) emptyRows++;
      });
    }
    return { items: [...items], parties: [...parties], emptyRows };
  }, [workbook, columnRoles, rowIncluded, editedRows]);

  const noMappingPicked =
    !!workbook &&
    Object.values(columnRoles).every((roles) => roles.every((r) => r === 'ignore'));

  const nothingToImport = collected.items.length === 0 && collected.parties.length === 0;

  const handleImport = useCallback(async () => {
    if (!workbook || nothingToImport) return;
    setImporting(true);
    try {
      let itemResult = { inserted: 0, skipped: 0 };
      let partyResult = { inserted: 0, skipped: 0 };
      if (collected.items.length) {
        itemResult = await window.electronAPI.importItemsMaster(collected.items);
      }
      if (collected.parties.length) {
        partyResult = await window.electronAPI.importPartiesMaster(collected.parties);
      }
      await qc.invalidateQueries({ queryKey: ['suggestions'] });

      const parts: string[] = [];
      if (collected.items.length) {
        parts.push(
          `${itemResult.inserted} item${itemResult.inserted === 1 ? '' : 's'} added` +
            (itemResult.skipped
              ? ` (${itemResult.skipped} already existed or blank)`
              : '')
        );
      }
      if (collected.parties.length) {
        parts.push(
          `${partyResult.inserted} part${partyResult.inserted === 1 ? 'y' : 'ies'} added` +
            (partyResult.skipped
              ? ` (${partyResult.skipped} already existed or blank)`
              : '')
        );
      }
      toast({
        title: 'Import complete',
        description: parts.join(' • '),
      });
      handleClose(false);
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  }, [workbook, collected, nothingToImport, qc, toast]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-primary" />
            Import items & parties from Excel
          </DialogTitle>
          <DialogDescription>
            Pick an Excel file, mark which columns are Item Names and which are Party Names, then
            import. Only new names are added — existing ones (case-insensitive) are skipped.
          </DialogDescription>
        </DialogHeader>

        {!workbook ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="font-medium text-foreground">Select an Excel file</p>
                <p className="text-sm text-muted-foreground mt-1">
                  .xlsx, .xls, or .csv
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChosen}
              />
              <Button onClick={() => fileInputRef.current?.click()}>Choose file</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="px-6 py-3 border-b bg-muted/30 flex flex-wrap items-center gap-3">
              <div className="text-sm text-muted-foreground flex items-center gap-2 min-w-0">
                <FileUp className="w-4 h-4 shrink-0" />
                <span className="truncate font-medium text-foreground">{workbook.fileName}</span>
              </div>
              {workbook.sheets.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Sheet:</span>
                  <Select
                    value={String(activeSheetIdx)}
                    onValueChange={(v) => setActiveSheetIdx(Number(v))}
                  >
                    <SelectTrigger className="h-8 w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {workbook.sheets.map((s, i) => (
                        <SelectItem key={s.name} value={String(i)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-2 ml-auto text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => toggleAllRows(true)}
                >
                  Select all rows
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => toggleAllRows(false)}
                >
                  Clear rows
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={resetAll}
                >
                  <X className="w-3 h-3 mr-1" /> Pick different file
                </Button>
              </div>
            </div>

            {/* Preview table */}
            <div className="flex-1 overflow-auto">
              {activeSheet && activeSheet.rows.length > 0 ? (
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-background z-10">
                    {/* Column letters */}
                    <tr className="border-b">
                      <th className="w-12 text-xs text-muted-foreground py-2 px-2 font-normal text-center border-r">
                        #
                      </th>
                      {activeSheet.headers.map((h, i) => (
                        <th
                          key={i}
                          className="text-xs text-muted-foreground py-2 px-2 font-normal text-left border-r min-w-[160px]"
                        >
                          Column {h}
                        </th>
                      ))}
                    </tr>
                    {/* Column role mapping */}
                    <tr className="border-b bg-muted/30">
                      <th className="w-12 py-2 px-2 border-r text-xs text-muted-foreground">
                        Map ↓
                      </th>
                      {activeSheet.headers.map((_, i) => (
                        <th key={i} className="py-2 px-2 border-r">
                          <Select
                            value={activeRoles[i] ?? 'ignore'}
                            onValueChange={(v) => setRole(i, v as ColumnRole)}
                          >
                            <SelectTrigger
                              className={
                                'h-8 ' +
                                (activeRoles[i] === 'items'
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                                  : activeRoles[i] === 'parties'
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                  : '')
                              }
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ignore">Ignore</SelectItem>
                              <SelectItem value="items">Item names</SelectItem>
                              <SelectItem value="parties">Party names</SelectItem>
                            </SelectContent>
                          </Select>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeEdited.map((row, rIdx) => {
                      const included = activeIncluded[rIdx] ?? true;
                      return (
                        <tr
                          key={rIdx}
                          className={
                            'border-b hover:bg-muted/30 ' +
                            (included ? '' : 'opacity-40')
                          }
                        >
                          <td className="w-12 py-1 px-2 border-r text-center">
                            <Checkbox
                              checked={included}
                              onCheckedChange={() => toggleRow(rIdx)}
                              aria-label={`Include row ${rIdx + 1}`}
                            />
                          </td>
                          {row.map((cell, cIdx) => {
                            const role = activeRoles[cIdx] ?? 'ignore';
                            return (
                              <td
                                key={cIdx}
                                className={
                                  'py-1 px-1 border-r ' +
                                  (role === 'items'
                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/10'
                                    : role === 'parties'
                                    ? 'bg-blue-50/40 dark:bg-blue-950/10'
                                    : '')
                                }
                              >
                                <input
                                  type="text"
                                  value={cell}
                                  onChange={(e) => editCell(rIdx, cIdx, e.target.value)}
                                  className="w-full h-8 px-2 bg-transparent focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring rounded text-sm"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-10 text-center text-muted-foreground">
                  This sheet is empty.
                </div>
              )}
            </div>

            {/* Footer with counts + import button */}
            <div className="p-4 border-t bg-muted/30 flex items-center gap-4 flex-wrap">
              {noMappingPicked ? (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Pick at least one column as <b className="mx-1">Item names</b> or
                  <b className="mx-1">Party names</b> to continue.
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Will import{' '}
                  <b className="text-foreground">{collected.items.length}</b> item
                  {collected.items.length === 1 ? '' : 's'} and{' '}
                  <b className="text-foreground">{collected.parties.length}</b> part
                  {collected.parties.length === 1 ? 'y' : 'ies'}.
                  {collected.emptyRows > 0 && (
                    <span className="ml-2">
                      ({collected.emptyRows} empty row{collected.emptyRows === 1 ? '' : 's'}{' '}
                      skipped)
                    </span>
                  )}
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || nothingToImport || noMappingPicked}
                >
                  {importing
                    ? 'Importing…'
                    : `Import ${collected.items.length + collected.parties.length} name${
                        collected.items.length + collected.parties.length === 1 ? '' : 's'
                      }`}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Excel-style column letters: A, B, …, Z, AA, AB, …
function colLetter(index: number): string {
  let s = '';
  let n = index;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}
