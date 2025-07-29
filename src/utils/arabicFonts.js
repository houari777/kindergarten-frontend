// Font configuration
const fontConfig = {
  Amiri: {
    normal: '/fonts/Amiri-Regular.ttf',
    bold: '/fonts/Amiri-Bold.ttf',
    italics: '/fonts/Amiri-Regular.ttf',
    bolditalics: '/fonts/Amiri-Bold.ttf'
  }
};

// Cache for loaded fonts
const loadedFonts = new Map();

// Function to load a font file
async function loadFontFile(url) {
  if (loadedFonts.has(url)) {
    return loadedFonts.get(url);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load font: ${url}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    
    loadedFonts.set(url, base64);
    return base64;
  } catch (error) {
    console.error('Error loading font file:', error);
    throw error;
  }
}

// Function to initialize fonts
async function loadFonts() {
  try {
    if (!window.pdfMake) {
      throw new Error('pdfMake is not loaded');
    }

    // Initialize VFS if it doesn't exist
    window.pdfMake.vfs = window.pdfMake.vfs || {};
    
    // Load each font file
    const fontFiles = new Set();
    Object.values(fontConfig.Amiri).forEach(fontPath => {
      fontFiles.add(fontPath);
    });

    // Load all font files
    await Promise.all(
      Array.from(fontFiles).map(async (fontPath) => {
        const fontName = fontPath.split('/').pop();
        const fontData = await loadFontFile(fontPath);
        window.pdfMake.vfs[fontName] = fontData;
      })
    );

    // Configure pdfmake to use our fonts
    window.pdfMake.fonts = {
      ...window.pdfMake.fonts,
      Amiri: {
        normal: 'Amiri-Regular.ttf',
        bold: 'Amiri-Bold.ttf',
        italics: 'Amiri-Regular.ttf',
        bolditalics: 'Amiri-Bold.ttf'
      }
    };

    return true;
  } catch (error) {
    console.error('Error initializing Arabic fonts:', error);
    return false;
  }
}

export { loadFonts };
