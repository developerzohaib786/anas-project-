# HEIC Image Support

This application now supports HEIC/HEIF image files (commonly used by Apple devices). 

## Features

- **Automatic Conversion**: HEIC files are automatically converted to JPEG format upon upload
- **User Feedback**: Clear notifications during conversion process
- **Quality Control**: Conversion maintains 80% quality for optimal file size vs. quality balance
- **Cross-Browser Support**: Works in all modern browsers through client-side conversion

## How It Works

1. **Upload Detection**: When you upload images, the system detects HEIC/HEIF files
2. **Conversion Notice**: You'll see a notification that conversion is in progress
3. **Automatic Processing**: Files are converted to JPEG format using the `heic2any` library
4. **Seamless Integration**: Converted files work with all image generation features

## Supported Formats

- **Input**: HEIC, HEIF (plus all standard formats: JPEG, PNG, WebP, GIF, etc.)
- **Output**: Converted HEIC files become JPEG format
- **Quality**: 80% JPEG quality (configurable)

## Components Updated

- `src/components/ImageUpload.tsx` - Handles HEIC conversion during upload
- `src/utils/heic-converter.ts` - Core conversion utilities
- `src/lib/file-validation.ts` - Enhanced validation for HEIC files

## Usage

Simply upload HEIC files as you would any other image format:

1. **Create Page**: Upload HEIC images for reference in text-to-image generation
2. **Enhance Page**: Upload HEIC images to enhance or modify
3. **Video Page**: Use HEIC images as the base for video generation

The conversion happens automatically - no additional steps required!

## Technical Notes

- Conversion uses dynamic imports to avoid loading the conversion library unless needed
- Large HEIC files may take a moment to convert
- Original file metadata (creation date, etc.) is preserved where possible
- Converted files maintain the same quality level while being more compatible

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile browsers: Full support

No server-side processing required - all conversion happens in your browser for privacy and speed.