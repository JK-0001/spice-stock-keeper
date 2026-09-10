# Distribution Guide - For You (The Developer)

## Files to Share with Clients

After the build completes, you'll find these files in the `release/1.0.0/` folder:

### Windows Installer
```
Spice-Stock-Keeper-1.0.0-Windows-Setup.exe
```
- **Size:** ~150-200 MB
- **For:** Windows 10+ (64-bit)
- **Type:** NSIS installer with wizard

### Linux Packages
```
Spice-Stock-Keeper-1.0.0-Linux.AppImage
Spice-Stock-Keeper-1.0.0-Linux.deb
```
- **AppImage:** Universal, works on any Linux distribution
- **.deb:** For Debian/Ubuntu-based systems

---

## Distribution via Google Drive

### Step 1: Upload to Google Drive

1. Go to [Google Drive](https://drive.google.com)
2. Click "New" → "Folder" → Name it "Spice Stock Keeper v1.0.0"
3. Upload the installer files:
   - `Spice-Stock-Keeper-1.0.0-Windows-Setup.exe`
   - `Spice-Stock-Keeper-1.0.0-Linux.AppImage`
   - `Spice-Stock-Keeper-1.0.0-Linux.deb`
4. Also upload `INSTALLATION_GUIDE.md` (convert to PDF for better readability)

### Step 2: Set Permissions

1. Right-click the folder
2. Click "Share"
3. Change to "Anyone with the link"
4. Set permission to "Viewer"
5. Copy the link

### Step 3: Share with Client

**Email Template:**

```
Subject: Spice Stock Keeper - Desktop Application Ready

Hi [Client Name],

Your Spice Stock Keeper desktop application is ready for installation!

Download Link: [Your Google Drive Link]

Installation Instructions:
- Windows users: Download and run "Spice-Stock-Keeper-1.0.0-Windows-Setup.exe"
- Linux users: Download "Spice-Stock-Keeper-1.0.0-Linux.AppImage" or the .deb package

Full installation guide is included in the folder.

Features:
✓ Inventory management with cold storage tracking
✓ Automated billing cycles (30 days)
✓ Reports and PDF export
✓ Automatic backups (startup, every 6 hours, on close)
✓ Completely offline - no internet required

The application stores all data locally on the user's computer, ensuring privacy and data security.

If you need any assistance with installation, please let me know!

Best regards,
[Your Name]
```

---

## Alternative Distribution Methods

### Option 1: WeTransfer (For Large Files)
1. Go to [wetransfer.com](https://wetransfer.com)
2. Upload the installer files
3. Enter client's email
4. Add message with installation instructions
5. Send

**Pros:** Simple, no account needed
**Cons:** Link expires in 7 days

### Option 2: Dropbox
Similar to Google Drive, better for team sharing.

### Option 3: Direct Email (If file size permits)
Compress installers into a ZIP file and email directly.

---

## Version Updates

When you need to release an update:

1. **Update version in package.json:**
   ```json
   "version": "1.1.0"
   ```

2. **Rebuild:**
   ```bash
   npm run build:all
   ```

3. **Create new folder in Google Drive:**
   - "Spice Stock Keeper v1.1.0"
   - Upload new installers

4. **Notify clients:**
   - Send email with new download link
   - Include changelog of what's new/fixed

### Important Note:
- Users can install new version over old one
- Their data (database and backups) will be preserved
- No uninstall needed before updating

---

## Build Commands Reference

```bash
# Build for Windows only
npm run build:win

# Build for Linux only
npm run build:linux

# Build for both (what we just ran)
npm run build:all

# Development mode
npm run dev
```

---

## File Sizes (Approximate)

- Windows .exe: ~150-200 MB
- Linux AppImage: ~150-200 MB
- Linux .deb: ~150-200 MB

Total for all platforms: ~450-600 MB

---

## Client Onboarding Checklist

- [ ] Build completed successfully
- [ ] Upload installers to Google Drive
- [ ] Upload INSTALLATION_GUIDE.md
- [ ] Set folder permissions to "Anyone with link"
- [ ] Test download link works
- [ ] Send email to client with download link
- [ ] Provide installation support if needed
- [ ] Confirm client successfully installed and can use the app

---

## Support Tips

### Common Client Questions

**Q: Do I need internet to use the app?**
A: No, it works completely offline. All data is stored locally.

**Q: Can I install this on multiple computers?**
A: Yes, but each installation has its own separate database. Data is not synced between computers.

**Q: What if I want to move data to another computer?**
A: Use the "Manual Backup" feature, copy the backup file to the new computer, and restore it.

**Q: How do I update to a new version?**
A: Simply install the new version. Your data will be preserved.

**Q: Is my data safe?**
A: Yes! The app creates automatic backups every 6 hours while running, plus on startup and close. Last 7 backups are kept.

---

## Next Steps

1. Wait for build to complete
2. Check `release/1.0.0/` folder for installer files
3. Test installers on Windows/Linux if possible
4. Upload to Google Drive
5. Send to client

---

Good luck with the distribution! 🚀
