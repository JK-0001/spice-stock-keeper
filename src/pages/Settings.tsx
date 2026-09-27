import { useState } from 'react';
import { Download, Upload, HardDrive, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

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

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Backup, restore, and app options</p>
      </div>

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
    </div>
  );
}
