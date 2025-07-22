// Import pdfmake
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize pdfmake with vfs_fonts
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else {
  pdfMake.vfs = {};
}

// Use a standard font that supports Arabic
// This is a fallback in case the font files aren't loaded
const defaultFont = {
  normal: 'Helvetica',
  bold: 'Helvetica-Bold',
  italics: 'Helvetica-Oblique',
  bolditalics: 'Helvetica-BoldOblique'
};

// Configure fonts
pdfMake.fonts = {
  default: defaultFont,
  Helvetica: defaultFont
};

// Arabic PDF generator utility
export const arabicPdf = {
  // Get the initialized pdfMake instance
  getPdfMake: () => {
    if (!pdfMake || !pdfMake.createPdf) {
      console.error('pdfMake is not properly initialized');
      return null;
    }
    return pdfMake;
  },
  
  // Create a document with Arabic support
  createDocument: (content, options = {}) => {
    const defaultOptions = {
      pageOrientation: 'portrait',
      pageSize: 'A4',
      defaultStyle: {
        font: 'Arabic',
        alignment: 'right',
        rtl: true,
        fontSize: 11,
        lineHeight: 1.5
      },
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
          alignment: 'center'
        },
        subheader: {
          fontSize: 12,
          margin: [0, 0, 0, 20],
          alignment: 'right'
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'white',
          fillColor: '#1976d2',
          alignment: 'center',
          margin: [0, 5, 0, 5]
        }
      }
    };
    
    return {
      ...defaultOptions,
      ...options,
      content: Array.isArray(content) ? content : [content]
    };
  }
};
