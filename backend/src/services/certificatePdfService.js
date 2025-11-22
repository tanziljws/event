// Lazy load puppeteer to prevent blocking startup
let puppeteer = null;
const getPuppeteer = () => {
  if (!puppeteer) {
    try {
      puppeteer = require('puppeteer');
    } catch (error) {
      console.error('⚠️  Puppeteer not available:', error.message);
      return null;
    }
  }
  return puppeteer;
};
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');

class CertificatePdfService {
  constructor() {
    this.templatePath = path.join(__dirname, '../templates/certificates/certificate-template.html');
    this.outputDir = path.join(__dirname, '../../uploads/certificates');
  }

  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating certificates directory:', error);
      throw error;
    }
  }

  async generateCertificatePdf(certificateData) {
    let browser;
    try {
      await this.ensureOutputDirectory();

      // Launch Puppeteer
      const puppeteerLib = getPuppeteer();
      if (!puppeteerLib) {
        throw new Error('Puppeteer is not available');
      }
      browser = await puppeteerLib.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 800, height: 600 });

      // Read template
      const template = await fs.readFile(this.templatePath, 'utf8');

      // Replace placeholders with actual data
      const htmlContent = this.replaceTemplatePlaceholders(template, certificateData);

      // Set content with longer timeout for font loading
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      // Generate filename
      const filename = `certificate_${certificateData.certificateNumber}_${Date.now()}.pdf`;
      const filePath = path.join(this.outputDir, filename);
      const certificateUrl = `/uploads/certificates/${filename}`;

      // Save PDF file
      await fs.writeFile(filePath, pdfBuffer);

      logger.info(`Certificate PDF generated: ${filename}`);

      return {
        filename,
        filePath,
        certificateUrl,
        pdfBuffer
      };

    } catch (error) {
      logger.error('Error generating certificate PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  replaceTemplatePlaceholders(template, data) {
    // If we have template data from database, use it
    if (data.template) {
      return this.generateDynamicTemplate(data);
    }

    // Fallback to static template with Google Fonts
    const placeholders = {
      '{{companyInitials}}': data.companyInitials || 'EM',
      '{{participantName}}': data.participantName || 'Nama Peserta',
      '{{eventTitle}}': data.eventTitle || 'Judul Event',
      '{{eventDate}}': data.eventDate || 'Tanggal Event',
      '{{eventLocation}}': data.eventLocation || 'Lokasi Event',
      '{{certificateNumber}}': data.certificateNumber || 'CERT-000000',
      '{{signerName}}': data.signerName || 'John Doe',
      '{{signerTitle}}': data.signerTitle || 'Chief Executive Officer',
      '{{issuedDate}}': data.issuedDate || new Date().toLocaleDateString('id-ID'),
      '{{verificationUrl}}': data.verificationUrl || 'https://example.com/verify'
    };

    let htmlContent = template;
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
    });

    // Add Google Fonts to static template if not already present
    if (!htmlContent.includes('fonts.googleapis.com')) {
      const fontLinks = `
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Ephesis:wght@400&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Allura&family=Alex+Brush&family=Berkshire+Swash&family=Caveat:wght@400;500;600;700&family=Kalam:wght@300;400;700&family=Pacifico&family=Satisfy&family=Yellowtail&family=Amatic+SC:wght@400;700&family=Indie+Flower&family=Lobster&family=Righteous&family=Shadows+Into+Light&family=Special+Elite&display=swap" rel="stylesheet">
      `;
      
      // Insert font links before closing </head> tag
      htmlContent = htmlContent.replace('</head>', `${fontLinks}</head>`);
    }

    return htmlContent;
  }

  generateDynamicTemplate(data) {
    const { template } = data;
    
    // Debug logging
    logger.info('Template data received:', {
      backgroundImage: template.backgroundImage ? 'Present' : 'Missing',
      backgroundSize: template.backgroundSize,
      elementsCount: template.elements?.length || 0,
      elements: template.elements?.map(el => ({
        type: el.type,
        text: el.text,
        fontFamily: el.fontFamily,
        fontSize: el.fontSize,
        isDynamic: el.isDynamic,
        dynamicType: el.dynamicType,
        position: el.position
      }))
    });
    
    // Replace dynamic text in elements
    const elements = template.elements.map(element => {
      if (element.type === 'text' && element.isDynamic) {
        let text = element.text;
        if (element.dynamicType === 'user_name') {
          text = text.replace('[Nama Peserta]', data.participantName);
        } else if (element.dynamicType === 'event_name') {
          text = text.replace('[Nama Event]', data.eventTitle);
        }
        return { ...element, text };
      }
      return element;
    });

    // Generate HTML with dynamic elements
    const elementsHtml = elements.map(element => {
      if (element.type === 'text') {
        // Debug logging
        logger.info(`Generating text element: ${element.text} with font: ${element.fontFamily}`);
        
        return `
          <div style="
            position: absolute;
            left: ${element.position.x}px;
            top: ${element.position.y}px;
            font-size: ${element.fontSize}px;
            font-family: '${element.fontFamily}', cursive, serif;
            color: ${element.color};
            font-weight: ${element.fontWeight};
            text-align: ${element.textAlign};
            z-index: 10;
          ">${element.text}</div>
        `;
      } else if (element.type === 'signature') {
        // Debug logging
        logger.info(`Generating signature element: ${element.text} with font: ${element.fontFamily}`);
        
        // Use dynamic signature data if available, otherwise use element text
        const signatureText = data.signerName || element.text || 'John Doe';
        const signatureTitle = data.signerTitle || element.title || 'Chief Executive Officer';
        
        return `
          <div style="
            position: absolute;
            left: ${element.position.x}px;
            top: ${element.position.y}px;
            font-size: ${element.fontSize}px;
            font-family: '${element.fontFamily}', cursive, serif;
            color: ${element.color};
            font-weight: ${element.fontWeight};
            text-align: ${element.textAlign};
            z-index: 10;
          ">${signatureText}</div>
          ${element.title ? `
          <div style="
            position: absolute;
            left: ${element.position.x}px;
            top: ${element.position.y + 30}px;
            font-size: ${element.fontSize * 0.7}px;
            font-family: '${element.fontFamily}', cursive, serif;
            color: ${element.color};
            font-weight: normal;
            text-align: ${element.textAlign};
            z-index: 10;
          ">${signatureTitle}</div>
          ` : ''}
        `;
      }
      return '';
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Ephesis:wght@400&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Allura&family=Alex+Brush&family=Berkshire+Swash&family=Caveat:wght@400;500;600;700&family=Kalam:wght@300;400;700&family=Pacifico&family=Satisfy&family=Yellowtail&family=Amatic+SC:wght@400;700&family=Indie+Flower&family=Lobster&family=Righteous&family=Shadows+Into+Light&family=Special+Elite&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 800px;
            height: 600px;
            position: relative;
            background-image: url('${template.backgroundImage}');
            background-size: ${template.backgroundSize};
            background-position: center;
            background-repeat: no-repeat;
          }
        </style>
      </head>
      <body>
        ${elementsHtml}
      </body>
      </html>
    `;
  }

  async generateCertificateNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `CERT-${timestamp}-${random}`;
  }

  async createDigitalSignature(signerData) {
    // In a real implementation, this would create a digital signature
    // For now, we'll return placeholder data
    return {
      signerName: signerData.name || 'John Doe',
      signerTitle: signerData.title || 'Chief Executive Officer',
      signatureHash: `sha256:${Date.now().toString(36)}`,
      signatureDate: new Date().toISOString()
    };
  }

  async validateCertificate(certificateUrl) {
    try {
      const filePath = path.join(__dirname, '../../uploads/certificates', path.basename(certificateUrl));
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCertificateInfo(certificateUrl) {
    try {
      const filePath = path.join(__dirname, '../../uploads/certificates', path.basename(certificateUrl));
      const stats = await fs.stat(filePath);
      
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }
}

module.exports = new CertificatePdfService();
