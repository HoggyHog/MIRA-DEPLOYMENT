import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import katex from 'katex';

interface PDFOptions {
  title: string;
  subject: string;
  grade: string;
  topic: string;
}

interface PDFElement {
  type: 'header' | 'paragraph' | 'list' | 'equation' | 'section';
  content: string;
  level?: number;
  items?: string[];
  style?: 'bold' | 'italic' | 'normal';
}

export const generatePDF = async (elementId: string, options: PDFOptions): Promise<void> => {
  try {
    // Get the element containing the content
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Parse content into structured elements
    const structuredContent = parseContentToStructure(element);
    
    // Create PDF with structured layout
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;
    
    // Set default font
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    
    // Add header
    currentY = addPDFHeader(pdf, options, margin, currentY);
    
    // Process each content element
    for (const element of structuredContent) {
      // Check if we need a new page
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;
      }
      
      currentY = addContentElement(pdf, element, margin, currentY, contentWidth);
    }

    // Generate filename
    const filename = `${options.subject}_${options.topic}_Grade${options.grade}_Exam.pdf`
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');

    // Download the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

// Parse HTML content into structured PDF elements
const parseContentToStructure = (element: HTMLElement): PDFElement[] => {
  const elements: PDFElement[] = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    null
  );

  let node;
  while (node = walker.nextNode()) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      const textContent = el.textContent?.trim() || '';
      
      if (!textContent) continue;

      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          elements.push({
            type: 'header',
            content: textContent,
            level: parseInt(tagName.charAt(1))
          });
          break;
        case 'p':
          if (textContent && !isChildOfProcessedElement(el)) {
            elements.push({
              type: 'paragraph',
              content: processLatexInText(textContent)
            });
          }
          break;
        case 'strong':
        case 'b':
          if (!isChildOfProcessedElement(el)) {
            elements.push({
              type: 'paragraph',
              content: textContent,
              style: 'bold'
            });
          }
          break;
        case 'em':
        case 'i':
          if (!isChildOfProcessedElement(el)) {
            elements.push({
              type: 'paragraph',
              content: textContent,
              style: 'italic'
            });
          }
          break;
        case 'ul':
        case 'ol':
          const listItems = Array.from(el.querySelectorAll('li')).map(li => 
            processLatexInText(li.textContent?.trim() || '')
          );
          if (listItems.length > 0) {
            elements.push({
              type: 'list',
              content: '',
              items: listItems
            });
          }
          break;
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent?.trim();
      if (textContent && !isChildOfProcessedElement(node.parentElement)) {
        // Check if this text contains math expressions
        if (containsLatex(textContent)) {
          elements.push({
            type: 'equation',
            content: processLatexInText(textContent)
          });
        } else if (textContent.length > 0) {
          elements.push({
            type: 'paragraph',
            content: textContent
          });
        }
      }
    }
  }

  return elements;
};

// Check if element is child of already processed elements
const isChildOfProcessedElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  const parent = element.parentElement;
  if (!parent) return false;
  
  const parentTag = parent.tagName.toLowerCase();
  return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'ul', 'ol'].includes(parentTag);
};

// Check if text contains LaTeX expressions
const containsLatex = (text: string): boolean => {
  return /\\frac|\\sqrt|\^|\{|\}|\\[a-zA-Z]+/.test(text) || 
         /\\\(|\\\[|\$/.test(text);
};

// Process LaTeX expressions in text
const processLatexInText = (text: string): string => {
  // Handle fractions
  text = text.replace(/\\frac\s*\{\s*([^}]+)\s*\}\s*\{\s*([^}]+)\s*\}/g, '($1)/($2)');
  
  // Handle superscripts
  text = text.replace(/([a-zA-Z0-9]+)\^\{([^}]+)\}/g, '$1^($2)');
  text = text.replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '$1^$2');
  
  // Handle subscripts
  text = text.replace(/([a-zA-Z0-9]+)_\{([^}]+)\}/g, '$1_($2)');
  text = text.replace(/([a-zA-Z0-9]+)_([a-zA-Z0-9]+)/g, '$1_$2');
  
  // Handle square roots
  text = text.replace(/\\sqrt\s*\{\s*([^}]+)\s*\}/g, '√($1)');
  
  // Clean up LaTeX delimiters
  text = text.replace(/\\\(([^)]+)\\\)/g, '$1');
  text = text.replace(/\\\[([^\]]+)\\\]/g, '$1');
  text = text.replace(/\$([^$]+)\$/g, '$1');
  
  // Replace mathematical symbols
  text = text.replace(/\\pi/g, 'π');
  text = text.replace(/\\alpha/g, 'α');
  text = text.replace(/\\beta/g, 'β');
  text = text.replace(/\\theta/g, 'θ');
  text = text.replace(/\\lambda/g, 'λ');
  text = text.replace(/\\mu/g, 'μ');
  text = text.replace(/\\sigma/g, 'σ');
  text = text.replace(/\\pm/g, '±');
  text = text.replace(/\\neq/g, '≠');
  text = text.replace(/\\leq/g, '≤');
  text = text.replace(/\\geq/g, '≥');
  text = text.replace(/\\times/g, '×');
  text = text.replace(/\\div/g, '÷');
  
  // Clean up markdown
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  
  return text;
};

// Add PDF header
const addPDFHeader = (pdf: jsPDF, options: PDFOptions, margin: number, startY: number): number => {
  let currentY = startY;
  
  // Title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(16);
  const titleLines = pdf.splitTextToSize(options.title, 170);
  pdf.text(titleLines, margin, currentY);
  currentY += titleLines.length * 8;
  
  // Subject info
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  const subjectInfo = `Subject: ${options.subject} | Grade: ${options.grade} | Topic: ${options.topic}`;
  pdf.text(subjectInfo, margin, currentY);
  currentY += 6;
  
  // Date
  pdf.setFontSize(10);
  const dateInfo = `Generated on: ${new Date().toLocaleDateString()}`;
  pdf.text(dateInfo, margin, currentY);
  currentY += 8;
  
  // Separator line
  pdf.setDrawColor(0, 0, 0);
  pdf.line(margin, currentY, 190, currentY);
  currentY += 12;
  
  return currentY;
};

// Add content element to PDF
const addContentElement = (pdf: jsPDF, element: PDFElement, margin: number, currentY: number, contentWidth: number): number => {
  let y = currentY;
  
  switch (element.type) {
    case 'header':
      // Set font based on header level
      pdf.setFont('times', 'bold');
      const fontSize = Math.max(14 - (element.level! - 1) * 2, 10);
      pdf.setFontSize(fontSize);
      
      // Add spacing before header
      y += element.level === 1 ? 8 : 6;
      
      // Split and add header text
      const headerLines = pdf.splitTextToSize(element.content, contentWidth);
      pdf.text(headerLines, margin, y);
      y += headerLines.length * (fontSize * 0.4) + 4;
      break;
      
    case 'paragraph':
      // Set font style
      pdf.setFont('times', element.style === 'bold' ? 'bold' : 'normal');
      pdf.setFontSize(11);
      
      // Split text to fit width
      const paragraphLines = pdf.splitTextToSize(element.content, contentWidth);
      pdf.text(paragraphLines, margin, y);
      y += paragraphLines.length * 5 + 3;
      break;
      
    case 'equation':
      // Format mathematical expressions with special styling
      pdf.setFont('times', 'italic');
      pdf.setFontSize(11);
      
      // Center equations if they look like display math
      const isDisplayMath = element.content.includes('=') || element.content.length > 20;
      const equationLines = pdf.splitTextToSize(element.content, contentWidth);
      
      if (isDisplayMath) {
        // Center the equation
        equationLines.forEach((line: string, index: number) => {
          const textWidth = pdf.getTextWidth(line);
          const centerX = margin + (contentWidth - textWidth) / 2;
          pdf.text(line, centerX, y + index * 5);
        });
      } else {
        // Inline equation
        pdf.text(equationLines, margin, y);
      }
      
      y += equationLines.length * 5 + 6;
      break;
      
    case 'list':
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      
      element.items?.forEach((item, index) => {
        const bullet = `${index + 1}. `;
        const itemText = bullet + item;
        const itemLines = pdf.splitTextToSize(itemText, contentWidth - 5);
        
        pdf.text(itemLines, margin + 5, y);
        y += itemLines.length * 5 + 2;
      });
      
      y += 3; // Extra spacing after list
      break;
      
    case 'section':
      // Add section break
      y += 8;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, margin + contentWidth, y);
      y += 8;
      break;
  }
  
  return y;
};

// Enhanced preprocessing function that handles markdown and LaTeX
const preprocessContentForPDF = (content: string): string => {
  // First, handle LaTeX equations by rendering them with KaTeX
  let processedContent = content;
  
  // Handle block equations \[ ... \]
  processedContent = processedContent.replace(/\\\[([^\]]+)\\\]/g, (match, equation) => {
    try {
      const rendered = katex.renderToString(equation, { 
        displayMode: true,
        throwOnError: false,
        output: 'html'
      });
      return `<div class="katex-block" style="text-align: center; margin: 15px 0;">${rendered}</div>`;
    } catch (e) {
      // Fallback for invalid LaTeX
      return `<div class="math-block" style="text-align: center; margin: 15px 0; font-style: italic;">${equation}</div>`;
    }
  });
  
  // Handle inline equations \( ... \)
  processedContent = processedContent.replace(/\\\(([^)]+)\\\)/g, (match, equation) => {
    try {
      const rendered = katex.renderToString(equation, { 
        displayMode: false,
        throwOnError: false,
        output: 'html'
      });
      return `<span class="katex-inline">${rendered}</span>`;
    } catch (e) {
      // Fallback for invalid LaTeX
      return `<span class="math-inline" style="font-style: italic;">${equation}</span>`;
    }
  });
  
  // Handle simple math expressions like x^2, fractions, etc.
  processedContent = processedContent.replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, (match, base, exp) => {
    try {
      const rendered = katex.renderToString(`${base}^{${exp}}`, { 
        displayMode: false,
        throwOnError: false,
        output: 'html'
      });
      return `<span class="katex-inline">${rendered}</span>`;
    } catch (e) {
      return `${base}<sup>${exp}</sup>`;
    }
  });
  
  // Handle fractions like \frac{a}{b}
  processedContent = processedContent.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
    try {
      const rendered = katex.renderToString(`\\frac{${num}}{${den}}`, { 
        displayMode: false,
        throwOnError: false,
        output: 'html'
      });
      return `<span class="katex-inline">${rendered}</span>`;
    } catch (e) {
      return `<span class="math-fraction">(${num})/(${den})</span>`;
    }
  });
  
  // Convert markdown headers to proper HTML
  processedContent = processedContent.replace(/^### (.+)$/gm, '<h3 style="font-size: 14px; font-weight: bold; margin: 15px 0 10px 0;">$1</h3>');
  processedContent = processedContent.replace(/^## (.+)$/gm, '<h2 style="font-size: 16px; font-weight: bold; margin: 20px 0 12px 0;">$1</h2>');
  processedContent = processedContent.replace(/^# (.+)$/gm, '<h1 style="font-size: 18px; font-weight: bold; margin: 25px 0 15px 0; text-align: center;">$1</h1>');
  
  // Convert bold markdown to HTML
  processedContent = processedContent.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>');
  
  // Convert italic markdown to HTML
  processedContent = processedContent.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em style="font-style: italic;">$1</em>');
  
  // Convert line breaks to proper paragraphs
  processedContent = processedContent.replace(/\n\n/g, '</p><p style="margin: 10px 0; line-height: 1.6;">');
  processedContent = processedContent.replace(/\n/g, '<br>');
  
  // Wrap content in paragraph tags if not already wrapped
  if (!processedContent.trim().startsWith('<')) {
    processedContent = `<p style="margin: 10px 0; line-height: 1.6;">${processedContent}</p>`;
  }
  
  return processedContent;
};

// Enhanced styling function for PDF content
const stylePDFContent = (element: HTMLElement): void => {
  // Apply base styles to ensure consistent rendering
  element.style.cssText = `
    font-family: 'Times New Roman', serif;
    font-size: 12px;
    color: black;
    background: white;
    line-height: 1.6;
    padding: 20px;
    max-width: none;
    width: 100%;
  `;
  
  // Style all headings consistently
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading) => {
    const h = heading as HTMLElement;
    h.style.cssText = `
      font-family: 'Times New Roman', serif;
      font-weight: bold;
      color: black;
      margin: 20px 0 12px 0;
      page-break-after: avoid;
      page-break-inside: avoid;
      background: transparent;
    `;
    
    if (h.tagName === 'H1') {
      h.style.fontSize = '18px';
      h.style.textAlign = 'center';
      h.style.marginTop = '25px';
      h.style.marginBottom = '15px';
    } else if (h.tagName === 'H2') {
      h.style.fontSize = '16px';
      h.style.marginTop = '20px';
    } else if (h.tagName === 'H3') {
      h.style.fontSize = '14px';
      h.style.marginTop = '15px';
    }
  });
  
  // Style paragraphs
  const paragraphs = element.querySelectorAll('p');
  paragraphs.forEach((p) => {
    (p as HTMLElement).style.cssText = `
      font-family: 'Times New Roman', serif;
      font-size: 12px;
      color: black;
      margin: 10px 0;
      line-height: 1.6;
      text-align: justify;
      background: transparent;
    `;
  });
  
  // Style KaTeX rendered content
  const katexElements = element.querySelectorAll('.katex, .katex-display, .katex-inline, .katex-block');
  katexElements.forEach((katex) => {
    (katex as HTMLElement).style.cssText = `
      font-family: 'KaTeX_Main', 'Times New Roman', serif;
      color: black;
      background: transparent;
      border: none;
      box-shadow: none;
    `;
  });
  
  // Style math fallbacks
  const mathElements = element.querySelectorAll('.math-block, .math-inline, .math-fraction');
  mathElements.forEach((math) => {
    (math as HTMLElement).style.cssText = `
      font-family: 'Times New Roman', serif;
      font-style: italic;
      color: black;
      background: transparent;
    `;
  });
  
  // Style strong/bold elements
  const strongElements = element.querySelectorAll('strong, b');
  strongElements.forEach((strong) => {
    (strong as HTMLElement).style.cssText = `
      font-family: 'Times New Roman', serif;
      font-weight: bold;
      color: black;
      background: transparent;
    `;
  });
  
  // Style emphasis/italic elements
  const emElements = element.querySelectorAll('em, i');
  emElements.forEach((em) => {
    (em as HTMLElement).style.cssText = `
      font-family: 'Times New Roman', serif;
      font-style: italic;
      color: black;
      background: transparent;
    `;
  });
  
  // Ensure all elements have consistent styling
  const allElements = element.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (!htmlEl.style.fontFamily) {
      htmlEl.style.fontFamily = "'Times New Roman', serif";
    }
    if (!htmlEl.style.color) {
      htmlEl.style.color = "black";
    }
    htmlEl.style.backgroundColor = "transparent";
    htmlEl.style.border = "none";
    htmlEl.style.boxShadow = "none";
  });
};

// Enhanced PDF generation with KaTeX and markdown preprocessing
export const generateEnhancedPDF = async (content: string, options: PDFOptions): Promise<void> => {
  try {
    // Create a temporary container for rendering
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 210mm;
      padding: 20px;
      font-family: 'Times New Roman', serif;
      font-size: 12px;
      line-height: 1.6;
      color: black;
      background: white;
    `;
    
    // First preprocess the content to handle markdown and LaTeX
    const processedContent = preprocessContentForPDF(content);
    container.innerHTML = processedContent;
    document.body.appendChild(container);
    
    // Apply consistent styling after DOM insertion
    stylePDFContent(container);
    
    // Wait for KaTeX rendering and font loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate PDF using html2canvas with enhanced settings
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: container.scrollWidth,
      height: container.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (element) => {
        // Skip elements that might cause rendering issues
        return element.classList.contains('katex-error');
      }
    });
    
    // Clean up
    document.body.removeChild(container);
    
    // Create PDF with better page handling
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    const contentHeight = pageHeight - (2 * margin);
    
    // Calculate scaling to fit content properly
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const mmPerPx = 0.264583; // Conversion factor
    const scaledWidth = Math.min(contentWidth, imgWidth * mmPerPx);
    const scaledHeight = (imgHeight * mmPerPx) * (scaledWidth / (imgWidth * mmPerPx));
    
    // Handle multi-page content with proper breaks
    const totalPages = Math.ceil(scaledHeight / contentHeight);
    
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const yOffset = i * contentHeight;
      const sourceY = (yOffset / scaledHeight) * imgHeight;
      const sourceHeight = Math.min((contentHeight / scaledHeight) * imgHeight, imgHeight - sourceY);
      
      // Create a canvas for this page
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = sourceHeight;
      const pageCtx = pageCanvas.getContext('2d')!;
      
      // Fill with white background
      pageCtx.fillStyle = '#ffffff';
      pageCtx.fillRect(0, 0, imgWidth, sourceHeight);
      
      // Draw the content
      pageCtx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
      
      const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
      const pageScaledHeight = sourceHeight * mmPerPx * (scaledWidth / (imgWidth * mmPerPx));
      
      pdf.addImage(pageImgData, 'PNG', margin, margin, scaledWidth, pageScaledHeight);
    }
    
    // Download the PDF
    pdf.save(`${options.subject}_${options.grade}_exam.pdf`);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('Failed to generate PDF');
  }
};

