/**
 * DXF Export sınıfı - Kesim planlarını DXF formatında dışa aktarır
 */
class DXFExporter {
  constructor() {
    this.scale = 0.1; // 1mm = 0.1 DXF unit (1:10 ölçek)
    this.margin = 50; // Kenar boşluğu
    this.barSpacing = 100; // Profiller arası mesafe
    this.textHeight = 20; // Metin yüksekliği
  }
  
  /**
   * Optimizasyon sonuçlarını DXF formatında export et
   */
  exportToDXF(results, stockLength) {
    console.log('📄 DXF Export başlıyor...');
    
    const dxfContent = this.generateDXFContent(results, stockLength);
    this.downloadDXF(dxfContent, 'kesim_plani.dxf');
    
    console.log('✅ DXF dosyası indirildi!');
  }
  
  /**
   * DXF içeriğini oluştur
   */
  generateDXFContent(results, stockLength) {
    let dxf = this.getDXFHeader();
    
    // Entities section başlat
    dxf += "0\nSECTION\n2\nENTITIES\n";
    
    let currentY = this.margin;
    
    // Her stock bar için çizim oluştur
    results.stockBars.forEach((bar, index) => {
      dxf += this.drawStockBar(bar, index, currentY, stockLength);
      currentY += this.barSpacing;
    });
    
    // Kaynaklı parçalar için ayrı bölüm
    if (results.weldedParts && results.weldedParts.length > 0) {
      currentY += this.barSpacing; // Extra space
      dxf += this.drawWeldedPartsSection(results.weldedParts, currentY);
    }
    
    // Fire parçalar için ayrı bölüm
    if (results.firePieces && results.firePieces.length > 0) {
      currentY += this.barSpacing * 2;
      dxf += this.drawFirePartsSection(results.firePieces, currentY);
    }
    
    // Özet bilgiler
    currentY += this.barSpacing * 2;
    dxf += this.drawSummary(results, currentY);
    
    // Entities section bitir
    dxf += "0\nENDSEC\n";
    
    // DXF footer
    dxf += this.getDXFFooter();
    
    return dxf;
  }
  
  /**
   * Stock bar çizimi
   */
  drawStockBar(bar, index, y, stockLength) {
    let dxf = '';
    const barWidth = stockLength * this.scale;
    const barHeight = 30;
    
    // Profil çerçevesi
    dxf += this.drawRectangle(this.margin, y, barWidth, barHeight, 'PROFIL');
    
    // Profil başlığı
    dxf += this.drawText(`PROFIL #${index + 1}`, this.margin, y - 25, this.textHeight, 'BASLIK');
    
    let currentX = this.margin;
    
    // Her kesim parçası için
    bar.cuts.forEach((cut, cutIndex) => {
      const cutWidth = cut.length * this.scale;
      
      // Parça çerçevesi
      dxf += this.drawRectangle(currentX, y, cutWidth, barHeight, 'PARCA');
      
      // Parça etiketi
      const labelX = currentX + (cutWidth / 2);
      const labelY = y + (barHeight / 2);
      dxf += this.drawText(cut.position, labelX, labelY, this.textHeight * 0.6, 'ETIKET');
      
      // Uzunluk etiketi
      dxf += this.drawText(`${cut.length}mm`, labelX, labelY - 15, this.textHeight * 0.5, 'OLCU');
      
      // Kesim çizgisi (parçalar arası)
      if (cutIndex < bar.cuts.length - 1) {
        dxf += this.drawLine(currentX + cutWidth, y, currentX + cutWidth, y + barHeight, 'KESIM');
      }
      
      currentX += cutWidth;
    });
    
    // Fire bölümü
    if (bar.remainingLength > 0) {
      const fireWidth = bar.remainingLength * this.scale;
      
      // Fire çerçevesi (farklı renk)
      dxf += this.drawRectangle(currentX, y, fireWidth, barHeight, 'FIRE');
      
      // Fire etiketi
      const fireX = currentX + (fireWidth / 2);
      const fireY = y + (barHeight / 2);
      dxf += this.drawText('FIRE', fireX, fireY, this.textHeight * 0.6, 'FIRE_TEXT');
      dxf += this.drawText(`${bar.remainingLength}mm`, fireX, fireY - 15, this.textHeight * 0.5, 'FIRE_OLCU');
    }
    
    // Toplam uzunluk etiketi
    dxf += this.drawText(`Toplam: ${stockLength}mm`, this.margin + barWidth + 20, y + (barHeight / 2), this.textHeight * 0.7, 'TOPLAM');
    
    return dxf;
  }
  
  /**
   * Kaynaklı parçalar bölümü
   */
  drawWeldedPartsSection(weldedParts, startY) {
    let dxf = '';
    let currentY = startY;
    
    // Başlık
    dxf += this.drawText('KAYNAKLI PARÇALAR', this.margin, currentY, this.textHeight * 1.2, 'BASLIK');
    currentY += 40;
    
    weldedParts.forEach((part, index) => {
      const barHeight = 25;
      let currentX = this.margin;
      
      // Parça başlığı
      dxf += this.drawText(`${part.position}: ${part.targetLength}mm`, this.margin, currentY - 20, this.textHeight * 0.8, 'KAYNAK_BASLIK');
      
      // Her fire parçası için
      part.pieces.forEach((piece, pieceIndex) => {
        const pieceWidth = piece.length * this.scale;
        
        // Parça çerçevesi
        dxf += this.drawRectangle(currentX, currentY, pieceWidth, barHeight, 'KAYNAK_PARCA');
        
        // Parça etiketi
        const labelX = currentX + (pieceWidth / 2);
        const labelY = currentY + (barHeight / 2);
        dxf += this.drawText(piece.name, labelX, labelY, this.textHeight * 0.5, 'KAYNAK_ETIKET');
        dxf += this.drawText(`${piece.length}mm`, labelX, labelY - 10, this.textHeight * 0.4, 'KAYNAK_OLCU');
        
        currentX += pieceWidth;
        
        // Kaynak simgesi
        if (pieceIndex < part.pieces.length - 1) {
          dxf += this.drawWeldSymbol(currentX, currentY + (barHeight / 2));
          currentX += 20; // Kaynak simgesi için yer
        }
      });
      
      // Tolerans bilgisi
      dxf += this.drawText(`Tolerans: ±${part.tolerance}mm`, currentX + 30, currentY + (barHeight / 2), this.textHeight * 0.6, 'TOLERANS');
      
      currentY += 60;
    });
    
    return dxf;
  }
  
  /**
   * Fire parçalar bölümü
   */
  drawFirePartsSection(firePieces, startY) {
    let dxf = '';
    let currentY = startY;
    
    // Başlık
    dxf += this.drawText('FIRE PARÇALAR', this.margin, currentY, this.textHeight * 1.2, 'BASLIK');
    currentY += 40;
    
    const itemsPerRow = 5;
    let currentX = this.margin;
    let itemCount = 0;
    
    firePieces.forEach((fire, index) => {
      const fireWidth = Math.max(fire.length * this.scale, 80); // Minimum genişlik
      const fireHeight = 20;
      
      // Fire çerçevesi
      dxf += this.drawRectangle(currentX, currentY, fireWidth, fireHeight, 'FIRE');
      
      // Fire etiketi
      const labelX = currentX + (fireWidth / 2);
      const labelY = currentY + (fireHeight / 2);
      dxf += this.drawText(`${fire.name}: ${fire.length}mm`, labelX, labelY, this.textHeight * 0.5, 'FIRE_TEXT');
      
      currentX += fireWidth + 20;
      itemCount++;
      
      // Satır sonu kontrolü
      if (itemCount >= itemsPerRow) {
        currentY += 40;
        currentX = this.margin;
        itemCount = 0;
      }
    });
    
    return dxf;
  }
  
  /**
   * Özet bilgiler
   */
  drawSummary(results, startY) {
    let dxf = '';
    let currentY = startY;
    
    // Başlık
    dxf += this.drawText('ÖZET BİLGİLER', this.margin, currentY, this.textHeight * 1.2, 'BASLIK');
    currentY += 40;
    
    // Özet veriler
    const summaryData = [
      `Toplam Profil Sayısı: ${results.totalStockBars}`,
      `Malzeme Kullanım Oranı: ${results.materialUtilization}%`,
      `Kaynaklı Parça Sayısı: ${results.weldedParts ? results.weldedParts.length : 0}`,
      `Fire Parça Sayısı: ${results.firePieces ? results.firePieces.length : 0}`,
      `Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
      `Saat: ${new Date().toLocaleTimeString('tr-TR')}`
    ];
    
    summaryData.forEach((text, index) => {
      dxf += this.drawText(text, this.margin, currentY + (index * 25), this.textHeight * 0.8, 'OZET');
    });
    
    return dxf;
  }
  
  /**
   * Dikdörtgen çiz
   */
  drawRectangle(x, y, width, height, layer) {
    const color = this.getLayerColor(layer);
    return `0\nLWPOLYLINE\n8\n${layer}\n62\n${color}\n90\n5\n70\n1\n10\n${x}\n20\n${y}\n10\n${x + width}\n20\n${y}\n10\n${x + width}\n20\n${y + height}\n10\n${x}\n20\n${y + height}\n10\n${x}\n20\n${y}\n`;
  }
  
  /**
   * Çizgi çiz
   */
  drawLine(x1, y1, x2, y2, layer) {
    const color = this.getLayerColor(layer);
    return `0\nLINE\n8\n${layer}\n62\n${color}\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}\n`;
  }
  
  /**
   * Metin yaz
   */
  drawText(text, x, y, height, layer) {
    const color = this.getLayerColor(layer);
    return `0\nTEXT\n8\n${layer}\n62\n${color}\n10\n${x}\n20\n${y}\n40\n${height}\n1\n${text}\n72\n1\n`;
  }
  
  /**
   * Kaynak simgesi çiz
   */
  drawWeldSymbol(x, y) {
    let dxf = '';
    const size = 8;
    
    // Kaynak simgesi (üçgen)
    dxf += `0\nLWPOLYLINE\n8\nKAYNAK\n62\n3\n90\n4\n70\n1\n`;
    dxf += `10\n${x - size}\n20\n${y - size}\n`;
    dxf += `10\n${x + size}\n20\n${y - size}\n`;
    dxf += `10\n${x}\n20\n${y + size}\n`;
    dxf += `10\n${x - size}\n20\n${y - size}\n`;
    
    return dxf;
  }
  
  /**
   * Layer rengini al
   */
  getLayerColor(layer) {
    const colors = {
      'PROFIL': 7,      // Beyaz
      'PARCA': 2,       // Sarı
      'FIRE': 1,        // Kırmızı
      'KESIM': 8,       // Gri
      'KAYNAK_PARCA': 3, // Yeşil
      'KAYNAK': 5,      // Mavi
      'BASLIK': 7,      // Beyaz
      'ETIKET': 7,      // Beyaz
      'OLCU': 8,        // Gri
      'FIRE_TEXT': 1,   // Kırmızı
      'FIRE_OLCU': 1,   // Kırmızı
      'TOPLAM': 7,      // Beyaz
      'KAYNAK_BASLIK': 3, // Yeşil
      'KAYNAK_ETIKET': 7, // Beyaz
      'KAYNAK_OLCU': 8,   // Gri
      'TOLERANS': 8,      // Gri
      'OZET': 7          // Beyaz
    };
    
    return colors[layer] || 7;
  }
  
  /**
   * DXF header
   */
  getDXFHeader() {
    return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$HANDSEED
5
FFFF
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
VPORT
5
8
330
0
100
AcDbSymbolTable
70
4
0
VPORT
5
2E
330
8
100
AcDbSymbolTableRecord
100
AcDbViewportTableRecord
2
*ACTIVE
70
0
10
0.0
20
0.0
11
1.0
21
1.0
12
210.0
22
148.5
13
0.0
23
0.0
14
10.0
24
10.0
15
10.0
25
10.0
16
0.0
26
0.0
36
1.0
17
0.0
27
0.0
37
0.0
40
341.0
41
1.24
42
50.0
43
0.0
44
0.0
50
0.0
51
0.0
71
0
72
100
73
1
74
3
75
0
76
0
77
0
78
0
281
0
65
1
110
0.0
120
0.0
130
0.0
111
1.0
121
0.0
131
0.0
112
0.0
122
1.0
132
0.0
79
0
146
0.0
0
ENDTAB
0
TABLE
2
LTYPE
5
5
330
0
100
AcDbSymbolTable
70
1
0
LTYPE
5
14
330
5
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
BYBLOCK
70
0
3

72
65
73
0
40
0.0
0
LTYPE
5
15
330
5
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
BYLAYER
70
0
3

72
65
73
0
40
0.0
0
LTYPE
5
16
330
5
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
CONTINUOUS
70
0
3
Solid line
72
65
73
0
40
0.0
0
ENDTAB
0
TABLE
2
LAYER
5
2
330
0
100
AcDbSymbolTable
70
10
0
LAYER
5
10
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
0
70
0
62
7
6
CONTINUOUS
0
ENDTAB
0
TABLE
2
STYLE
5
3
330
0
100
AcDbSymbolTable
70
1
0
STYLE
5
11
330
3
100
AcDbSymbolTableRecord
100
AcDbTextStyleTableRecord
2
STANDARD
70
0
40
0.0
41
1.0
50
0.0
71
0
42
2.5
3
txt
4

0
ENDTAB
0
TABLE
2
VIEW
5
6
330
0
100
AcDbSymbolTable
70
0
0
ENDTAB
0
TABLE
2
UCS
5
7
330
0
100
AcDbSymbolTable
70
0
0
ENDTAB
0
TABLE
2
APPID
5
9
330
0
100
AcDbSymbolTable
70
2
0
APPID
5
12
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
2
ACAD
70
0
0
ENDTAB
0
TABLE
2
DIMSTYLE
5
A
330
0
100
AcDbSymbolTable
70
1
0
DIMSTYLE
5
27
330
A
100
AcDbSymbolTableRecord
100
AcDbDimStyleTableRecord
2
ISO-25
70
0
0
ENDTAB
0
TABLE
2
BLOCK_RECORD
5
1
330
0
100
AcDbSymbolTable
70
1
0
BLOCK_RECORD
5
1F
330
1
100
AcDbSymbolTableRecord
2
*MODEL_SPACE
0
BLOCK_RECORD
5
1B
330
1
100
AcDbSymbolTableRecord
2
*PAPER_SPACE
0
ENDTAB
0
ENDSEC
0
SECTION
2
BLOCKS
0
BLOCK
5
20
330
1F
100
AcDbEntity
8
0
100
AcDbBlockBegin
2
*MODEL_SPACE
70
0
10
0.0
20
0.0
30
0.0
3
*MODEL_SPACE
1

0
ENDBLK
5
21
330
1F
100
AcDbEntity
8
0
100
AcDbBlockEnd
0
BLOCK
5
1C
330
1B
100
AcDbEntity
67
1
8
0
100
AcDbBlockBegin
2
*PAPER_SPACE
70
0
10
0.0
20
0.0
30
0.0
3
*PAPER_SPACE
1

0
ENDBLK
5
1D
330
1B
100
AcDbEntity
67
1
8
0
100
AcDbBlockEnd
0
ENDSEC
`;
  }
  
  /**
   * DXF footer
   */
  getDXFFooter() {
    return `0
SECTION
2
OBJECTS
0
DICTIONARY
5
C
330
0
100
AcDbDictionary
3
ACAD_GROUP
350
D
3
ACAD_MLINESTYLE
350
17
0
DICTIONARY
5
D
330
C
100
AcDbDictionary
0
DICTIONARY
5
1A
330
C
100
AcDbDictionary
0
DICTIONARY
5
17
330
C
100
AcDbDictionary
3
STANDARD
350
18
0
MLINESTYLE
5
18
330
17
100
AcDbMlineStyle
2
STANDARD
70
0
3

62
256
51
90.0
52
90.0
71
2
49
0.5
62
256
6
BYLAYER
49
-0.5
62
256
6
BYLAYER
0
ENDSEC
0
EOF`;
  }
  
  /**
   * DXF dosyasını indir
   */
  downloadDXF(content, filename) {
    const blob = new Blob([content], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}