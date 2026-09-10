# SpiceIn Icon

## Current Status

The app is currently using the default Electron icon. A custom SVG icon has been created with:
- A warehouse building (dark gray with red roof)
- A red chili (mirchi)
- "SpiceIn" branding badge

## Adding the Custom Icon

To use the custom icon in the app, you need to convert the SVG to ICO and PNG formats:

### Option 1: Online Converter (Easiest)
1. Go to https://convertio.co/svg-ico/
2. Upload `icon.svg`
3. Convert to ICO format (256x256, 128x128, 64x64, 48x48, 32x32, 16x16 sizes)
4. Download as `icon.ico`
5. Save to this directory (`build-resources/icon.ico`)

### Option 2: Using ImageMagick
```bash
convert -background none icon.svg -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

### Option 3: Using Online Tools
- https://cloudconvert.com/svg-to-ico
- https://image.online-convert.com/convert-to-ico
- https://www.aconvert.com/icon/svg-to-ico/

## After Converting

Once you have `icon.ico`, update `forge.config.js`:

```javascript
packagerConfig: {
  asar: true,
  name: 'SpiceIn',
  executableName: 'SpiceIn',
  icon: './build-resources/icon', // Electron will add .ico/.icns automatically
},
```

And for the Squirrel installer:

```javascript
{
  name: '@electron-forge/maker-squirrel',
  config: {
    name: 'SpiceIn',
    setupIcon: './build-resources/icon.ico',
  },
}
```

Then rebuild: `npm run make`

## Icon Design

The current icon features:
- **Warehouse**: Represents storage facility
- **Red Chili**: Represents spices (mirchi)
- **SpiceIn Badge**: Brand identity
- **Color Scheme**: Dark gray (#2c3e50), Red (#e74c3c), Yellow accents (#f39c12)

Feel free to modify `icon.svg` to customize the design!
