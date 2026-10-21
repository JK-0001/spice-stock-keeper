import { useEffect, useState } from 'react';
import {
  Download,
  Upload,
  HardDrive,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImportFromExcelDialog } from '@/components/settings/ImportFromExcelDialog';

export default function Settings() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);

  // App version + updater state
  const [version, setVersion] = useState<string>('…');
  const [updateState, setUpdateState] = useState<UpdateState>({
    status: 'idle',
    version: null,
    error: null,
  });
  const [checking, setChecking] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [v, s] = await Promise.all([
          window.electronAPI.getAppVersion(),
          window.electronAPI.getUpdateState(),
        ]);
        if (!active) return;
        setVersion(v);
        setUpdateState(s);
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleCheckForUpdates = async () => {
    setChecking(true);
    try {
      const result = await window.electronAPI.checkForUpdates();
      setUpdateState(result);
      switch (result.status) {
        case 'downloaded':
          toast({
            title: `Update ready${result.version ? ` (${result.version})` : ''}`,
            description: 'Click Restart & Install to apply.',
          });
          break;
        case 'not-available':
          toast({ title: "You're on the latest version", description: `SpiceIn v${version}` });
          break;
        case 'available':
          toast({
            title: 'Update is downloading',
            description: 'It will install when you restart the app.',
          });
          break;
        case 'dev':
          toast({
            title: 'Updates disabled in dev',
            description: 'Install the packaged build to receive updates.',
          });
          break;
        case 'error':
          toast({
            title: 'Update check failed',
            description: result.error ?? 'Unknown error',
            variant: 'destructive',
          });
          break;
      }
    } catch (err) {
      toast({
        title: 'Update check failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleRestartAndInstall = async () => {
    setRestarting(true);
    try {
      const r = await window.electronAPI.restartAndInstall();
      if (!r.ok) {
        toast({ title: r.message, variant: 'destructive' });
        setRestarting(false);
      }
      // On success the app quits + relaunches; no further UI.
    } catch (err) {
      toast({
        title: 'Could not restart',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      setRestarting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await window.electronAPI.createManualBackup();
      if (res.success) {
        toast({ title: 'Backup saved', description: res.message });
      } else {
        toast({
          title: res.message === 'Backup cancelled' ? 'Cancelled' : 'Backup failed',
          description: res.message,
          variant: res.message === 'Backup cancelled' ? 'default' : 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Backup failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await window.electronAPI.importDatabase();
      if (res.needsRestart) {
        toast({ title: 'Data imported', description: 'Restarting…' });
        return; // app is relaunching itself
      }
      if (res.cancelled) {
        toast({ title: 'Cancelled', description: 'Import was cancelled.' });
      } else if (res.success) {
        toast({ title: 'Data imported', description: res.message });
      } else {
        toast({
          title: 'Import failed',
          description: res.message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const updateDownloaded = updateState.status === 'downloaded';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Backup, restore, and app options</p>
      </div>

      {/* About + updates */}
      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground">SpiceIn</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Version <span className="font-mono text-foreground">v{version}</span>
              </p>
              {updateDownloaded ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Update {updateState.version ? `v${updateState.version} ` : ''}downloaded —
                  restart to install.
                </p>
              ) : updateState.status === 'error' ? (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {updateState.error ?? 'Update check failed.'}
                </p>
              ) : updateState.status === 'available' ? (
                <p className="text-sm text-muted-foreground mt-2">
                  A new version is downloading in the background…
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  SpiceIn checks for updates automatically once an hour. You can also check now.
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            {updateDownloaded ? (
              <>
                <Button
                  onClick={handleRestartAndInstall}
                  disabled={restarting}
                  className="min-w-[160px]"
                >
                  {restarting ? 'Restarting…' : 'Restart & Install'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCheckForUpdates}
                  disabled={checking}
                >
                  <RefreshCw
                    className={'w-3 h-3 mr-1 ' + (checking ? 'animate-spin' : '')}
                  />
                  {checking ? 'Checking…' : 'Check again'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={handleCheckForUpdates}
                disabled={checking}
                className="min-w-[160px]"
              >
                <RefreshCw className={'w-4 h-4 mr-2 ' + (checking ? 'animate-spin' : '')} />
                {checking ? 'Checking…' : 'Check for updates'}
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg divide-y divide-border">
        {/* Export */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Export data</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Save all your SpiceIn data (inventory, cold storages, sale orders, builtys,
                everything) to a single <code className="text-xs">.db</code> file. Use this to
                move your data to another laptop, or to keep a manual backup on a USB drive
                or cloud folder.
              </p>
            </div>
          </div>
          <Button onClick={handleExport} disabled={exporting} className="shrink-0 min-w-[140px]">
            {exporting ? 'Saving…' : 'Export Data'}
          </Button>
        </div>

        {/* Import */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Import data</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Replace all data on this laptop with data from an exported{' '}
                <code className="text-xs">.db</code> file. Use this on a new laptop to bring in
                data from your other machine. A backup of your current data is saved
                automatically before import, so nothing is lost. The app will restart after
                import.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleImport}
            disabled={importing}
            className="shrink-0 min-w-[140px]"
          >
            {importing ? 'Importing…' : 'Import Data'}
          </Button>
        </div>
      </section>

      {/* Excel import — seed item + party dropdowns from a spreadsheet */}
      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Import from Excel</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Load a list of item names and party names from an Excel file (
                <code className="text-xs">.xlsx</code>, <code className="text-xs">.xls</code>, or{' '}
                <code className="text-xs">.csv</code>). You'll see a preview where you can mark
                which columns are items vs. parties, edit any cell, and uncheck rows you don't
                want. Imported names show up in the autocomplete dropdowns across the app.
                Duplicates are skipped automatically.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setExcelDialogOpen(true)}
            className="shrink-0 min-w-[140px]"
          >
            Import from Excel
          </Button>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h2 className="font-semibold text-foreground">Automatic backups</h2>
            <p className="text-sm text-muted-foreground">
              SpiceIn automatically backs up your data on startup, every 6 hours while running,
              and on app close. The last 7 backups are kept.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Backup folder:{' '}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                %AppData%\SpiceIn\backups
              </code>
            </p>
          </div>
        </div>
      </section>

      <ImportFromExcelDialog open={excelDialogOpen} onOpenChange={setExcelDialogOpen} />
    </div>
  );
}
