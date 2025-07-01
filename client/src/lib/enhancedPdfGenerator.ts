import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import katex from 'katex';

interface PDFOptions {
  title: string;
  subject: string;
  grade: string;
  topic: string;
  type?: 'exam' | 'lesson';
}

export const generateEnhancedPDF = async (
  content: string,
  options: PDFOptions
): Promise<void> => {
  try {
    // Create a temporary container for the content
    const container = document.createElement('div');
    container.id = 'pdf-temp-container';
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 210mm;
      min-height: auto;
      padding: 25mm 20mm;
      font-family: 'Times New Roman', serif;
      font-size: 12px;
      line-height: 1.6;
      color: black;
      background: white;
      box-sizing: border-box;
      overflow: visible;
    `;

    // Process markdown content to HTML with enhanced LaTeX handling
    const processedHTML = convertMarkdownToHTML(content);
    container.innerHTML = processedHTML;
    
    // Append to document body for rendering
    document.body.appendChild(container);

    // Wait for KaTeX rendering to complete and ensure all content is rendered
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Force layout recalculation to ensure all content is visible
    container.style.height = 'auto';
    const actualHeight = Math.max(container.scrollHeight, container.offsetHeight);
    container.style.minHeight = `${actualHeight}px`;

    // Generate PDF using html2canvas with full content capture
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: container.scrollWidth,
      height: actualHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
      removeContainer: false,
      windowWidth: container.scrollWidth,
      windowHeight: actualHeight
    });

    // Clean up the temporary container
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 40; // 20mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 20; // 20mm top margin

    // Add first page
    pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - 40); // Account for top and bottom margins

    // Add additional pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 20; // 20mm top margin
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 40);
    }

    // Generate filename based on type
    let filename: string;
    if (options.type === 'lesson') {
      filename = `${options.subject.replace(/\s+/g, '_')}_Class_${options.grade}_Lesson.pdf`;
    } else {
      filename = `${options.subject.replace(/\s+/g, '_')}_Class_${options.grade}_Exam.pdf`;
    }
    
    pdf.save(filename);
  } catch (error) {
    console.error('Enhanced PDF generation failed:', error);
    throw error;
  }
};

// Enhanced markdown to HTML conversion with proper LaTeX handling
const convertMarkdownToHTML = (content: string): string => {
  let processedContent = content;

  // First, fix common LaTeX division issues by preprocessing fractions
  processedContent = processedContent.replace(/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/g, (match, num, den) => {
    // Convert simple fractions like b/a or c/a to proper LaTeX
    return `\\(\\frac{${num}}{${den}}\\)`;
  });

  // Handle block equations \[ ... \] with enhanced rendering
  processedContent = processedContent.replace(/\\\[([^\]]+)\\\]/g, (match, equation) => {
    try {
      const cleanedEquation = cleanLatexExpression(equation);
      const rendered = katex.renderToString(cleanedEquation, { 
        displayMode: true,
        throwOnError: false,
        output: 'html',
        trust: true
      });
      return `<div class="katex-block" style="text-align: center; margin: 20px 0; font-size: 14px;">${rendered}</div>`;
    } catch (e) {
      // Enhanced fallback for invalid LaTeX with proper division rendering
      const fallbackContent = renderMathFallback(equation);
      return `<div class="math-block" style="text-align: center; margin: 20px 0; font-style: italic; font-size: 14px;">${fallbackContent}</div>`;
    }
  });
  
  // Handle inline equations \( ... \) with enhanced rendering
  processedContent = processedContent.replace(/\\\(([^)]+)\\\)/g, (match, equation) => {
    try {
      const cleanedEquation = cleanLatexExpression(equation);
      const rendered = katex.renderToString(cleanedEquation, { 
        displayMode: false,
        throwOnError: false,
        output: 'html',
        trust: true
      });
      return `<span class="katex-inline" style="font-size: 12px;">${rendered}</span>`;
    } catch (e) {
      // Enhanced fallback for invalid LaTeX with proper division rendering
      const fallbackContent = renderMathFallback(equation);
      return `<span class="math-inline" style="font-style: italic; font-size: 12px;">${fallbackContent}</span>`;
    }
  });

  // Handle single $ delimited equations
  processedContent = processedContent.replace(/\$([^$]+)\$/g, (match, equation) => {
    try {
      const cleanedEquation = cleanLatexExpression(equation);
      const rendered = katex.renderToString(cleanedEquation, { 
        displayMode: false,
        throwOnError: false,
        output: 'html',
        trust: true
      });
      return `<span class="katex-inline" style="font-size: 12px;">${rendered}</span>`;
    } catch (e) {
      const fallbackContent = renderMathFallback(equation);
      return `<span class="math-inline" style="font-style: italic; font-size: 12px;">${fallbackContent}</span>`;
    }
  });

  // Handle standalone fractions like \frac{a}{b}
  processedContent = processedContent.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
    try {
      const rendered = katex.renderToString(`\\frac{${num}}{${den}}`, { 
        displayMode: false,
        throwOnError: false,
        output: 'html',
        trust: true
      });
      return `<span class="katex-inline" style="font-size: 12px;">${rendered}</span>`;
    } catch (e) {
      return `<span class="math-fraction" style="font-style: italic;">(<span style="text-decoration: overline;">${num}</span>/<span style="text-decoration: underline;">${den}</span>)</span>`;
    }
  });

  // Convert markdown headers to proper HTML with enhanced styling
  processedContent = processedContent.replace(/^### (.+)$/gm, '<h3 style="font-size: 14px; font-weight: bold; margin: 20px 0 12px 0; color: black; page-break-after: avoid;">$1</h3>');
  processedContent = processedContent.replace(/^## (.+)$/gm, '<h2 style="font-size: 16px; font-weight: bold; margin: 25px 0 15px 0; color: black; page-break-after: avoid;">$1</h2>');
  processedContent = processedContent.replace(/^# (.+)$/gm, '<h1 style="font-size: 18px; font-weight: bold; margin: 30px 0 20px 0; text-align: center; color: black; page-break-after: avoid;">$1</h1>');
  
  // Convert bold markdown to HTML
  processedContent = processedContent.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: bold; color: black;">$1</strong>');
  
  // Convert italic markdown to HTML
  processedContent = processedContent.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em style="font-style: italic; color: black;">$1</em>');
  
  // Handle line breaks and sections properly to prevent content loss
  const lines = processedContent.split('\n');
  const processedLines = lines.map(line => {
    const trimmedLine = line.trim();
    
    // Skip empty lines but preserve them for spacing
    if (!trimmedLine) {
      return '<div style="height: 8px;"></div>';
    }
    
    // If line doesn't start with HTML tag, wrap in paragraph
    if (!trimmedLine.startsWith('<')) {
      return `<p style="margin: 8px 0; line-height: 1.6; color: black; text-align: justify;">${trimmedLine}</p>`;
    }
    
    return trimmedLine;
  });
  
  // Join all processed lines to ensure no content is lost
  processedContent = processedLines.join('\n');
  
  // Add container styling to ensure all content is visible
  processedContent = `<div style="width: 100%; min-height: 100%; color: black; background: white; overflow: visible;">
    ${processedContent}
  </div>`;
  
  return processedContent;
};

// Clean LaTeX expressions for better rendering
const cleanLatexExpression = (equation: string): string => {
  return equation
    .trim()
    // Fix spacing issues
    .replace(/\s+/g, ' ')
    // Ensure proper braces for fractions
    .replace(/\\frac\s*\{\s*([^}]+)\s*\}\s*\{\s*([^}]+)\s*\}/g, '\\frac{$1}{$2}')
    // Fix common issues with superscripts and subscripts
    .replace(/\^\s*\{([^}]+)\}/g, '^{$1}')
    .replace(/_\s*\{([^}]+)\}/g, '_{$1}')
    // Handle common symbols
    .replace(/\\times/g, '\\times')
    .replace(/\\div/g, '\\div')
    .replace(/\\pm/g, '\\pm')
    .replace(/\\mp/g, '\\mp');
};

// Enhanced math fallback renderer with proper division visualization
const renderMathFallback = (equation: string): string => {
  let fallback = equation;
  
  // Handle fractions with visual division line using HTML/CSS
  fallback = fallback.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, 
    '<span style="display: inline-block; text-align: center; vertical-align: middle;">' +
    '<span style="display: block; border-bottom: 1px solid black; padding-bottom: 2px;">$1</span>' +
    '<span style="display: block; padding-top: 2px;">$2</span>' +
    '</span>'
  );
  
  // Handle simple fractions like a/b
  fallback = fallback.replace(/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/g,
    '<span style="display: inline-block; text-align: center; vertical-align: middle;">' +
    '<span style="display: block; border-bottom: 1px solid black; padding-bottom: 2px;">$1</span>' +
    '<span style="display: block; padding-top: 2px;">$2</span>' +
    '</span>'
  );
  
  // Handle superscripts
  fallback = fallback.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
  fallback = fallback.replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');
  
  // Handle subscripts
  fallback = fallback.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
  fallback = fallback.replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');
  
  // Handle square roots
  fallback = fallback.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  
  // Clean up LaTeX commands
  fallback = fallback.replace(/\\([a-zA-Z]+)/g, '$1');
  
  return fallback;
};