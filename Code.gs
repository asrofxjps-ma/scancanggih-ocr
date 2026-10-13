/**
 * Serves the HTML UI.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('UploadForm')
    .setTitle('ScanCanggih OCR Ringan')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover')
    .addMetaTag('apple-mobile-web-app-capable', 'yes')
    .addMetaTag('mobile-web-app-capable', 'yes');
}

/**
 * Menerima POST request daripada telefon dan menjalankan Google Drive OCR.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const fileBytes = Utilities.base64Decode(data.base64);
    const blob = Utilities.newBlob(fileBytes, data.type || "image/jpeg", data.name || "document.jpg");

    const resource = {
      title: "[OCR_TEMP] " + (data.name || "doc.jpg")
    };

    const ocrFile = Drive.Files.insert(resource, blob, {
      ocr: true,
      ocrLanguage: 'ms'
    });

    const doc = DocumentApp.openById(ocrFile.id);
    const extractedText = doc.getBody().getText();

    try {
      Drive.Files.remove(ocrFile.id);
    } catch (err) {}

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      text: extractedText.trim() ? extractedText : "Tiada teks dikesan."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Memproses fail muat naik menggunakan Google Drive Native OCR (Di atas awan pelayan Google).
 */
function processUploadedFile(fileData) {
  try {
    let originalMimeType = fileData.type;
    const fileName = fileData.name || "document.jpg";
    
    if (!originalMimeType || originalMimeType === "") {
      originalMimeType = "image/jpeg";
    }

    // Tukar base64 kepada Blob
    const fileBytes = Utilities.base64Decode(fileData.base64);
    const blob = Utilities.newBlob(fileBytes, originalMimeType, fileName);

    const resource = {
      title: "[OCR_TEMP] " + fileName
    };

    // Jalankan OCR di Google Drive Cloud (Pantas dan Ringan untuk Telefon)
    const ocrFile = Drive.Files.insert(resource, blob, {
      ocr: true,
      ocrLanguage: 'ms' // Menyokong Bahasa Melayu & Inggeris
    });

    const doc = DocumentApp.openById(ocrFile.id);
    const extractedText = doc.getBody().getText();

    // Padam fail sementara
    try {
      Drive.Files.remove(ocrFile.id);
    } catch (e) {}

    if (!extractedText.trim()) {
      return "OCR selesai, tetapi tiada teks dikesan pada dokumen ini.";
    }

    return extractedText;

  } catch (error) {
    return "Gagal memproses fail: " + error.toString();
  }
}
