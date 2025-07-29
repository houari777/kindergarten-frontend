import { amiriFont } from '../assets/fonts/amiriFont';

// Initialize pdfmake with custom configuration
export async function initializePdfMake() {
  try {
    // Dynamically import pdfmake
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    
    const pdfMake = pdfMakeModule.default;
    
    // Initialize the virtual file system
    pdfMake.vfs = pdfFonts.pdfMake.vfs || {};
    
    // Add our fonts to pdfmake
    pdfMake.fonts = {
      ...amiriFont,
      // Fallback fonts
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
    
    // Set default font
    pdfMake.fonts.defaultFont = 'Amiri';
    
    return pdfMake;
  } catch (error) {
    console.error('Error initializing pdfmake:', error);
    return null;
  }
}
