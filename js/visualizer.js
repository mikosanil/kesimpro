/**
 * Visualizer - Handles the visualization of optimization results
 */
class Visualizer {
  constructor(stockLength) {
    this.stockLength = stockLength;
  }
  
  /**
   * Update stock length
   * 
   * @param {number} length - New stock length
   */
  setStockLength(length) {
    this.stockLength = length;
  }
  
  /**
   * Create a visual representation of a stock bar
   * 
   * @param {Object} stockBar - Stock bar data
   * @param {number} barIndex - Index of the bar
   * @returns {HTMLElement} The stock bar element
   */
  createStockBarVisualization(stockBar, barIndex) {
    const stockBarElement = document.createElement('div');
    stockBarElement.className = 'stock-bar';
    
    // Create the header
    const headerElement = document.createElement('div');
    headerElement.className = 'stock-bar-header';
    
    const titleElement = document.createElement('h4');
    titleElement.textContent = `Profil #${barIndex + 1}`;
    
    const usageElement = document.createElement('span');
    const remainingLength = stockBar.remainingLength || 0;
    const usedLength = this.stockLength - remainingLength;
    const usedPercentage = calculatePercentage(usedLength, this.stockLength);
    usageElement.textContent = `Kullanım: ${usedPercentage}% (${formatLength(usedLength)} / ${formatLength(this.stockLength)})`;
    usageElement.className = usedPercentage > 80 ? 'text-success' : '';
    
    headerElement.appendChild(titleElement);
    headerElement.appendChild(usageElement);
    stockBarElement.appendChild(headerElement);
    
    // Create the visualization bar
    const visualizationElement = document.createElement('div');
    visualizationElement.className = 'stock-bar-visualization';
    
    // Add cut pieces to the visualization
    stockBar.cuts.forEach((cut, index) => {
      const pieceElement = document.createElement('div');
      pieceElement.className = 'stock-bar-piece cut';
      
      // Calculate the width as a percentage of the stock length
      const widthPercentage = (cut.length / this.stockLength) * 100;
      pieceElement.style.width = `${widthPercentage}%`;
      
      // Set a unique color based on position
      pieceElement.style.backgroundColor = this.getColorForPosition(cut.position);
      
      // Add label if enough space
      if (widthPercentage > 8) {
        pieceElement.textContent = `${cut.position}`;
      }
      
      // Add tooltip
      pieceElement.title = `${cut.position} - ${formatLength(cut.length)}`;
      
      visualizationElement.appendChild(pieceElement);
    });
    
    // Add the remainder if any
    if (remainingLength >= 50) {
      const remainderElement = document.createElement('div');
      remainderElement.className = 'stock-bar-piece remainder';
      
      const widthPercentage = (remainingLength / this.stockLength) * 100;
      remainderElement.style.width = `${widthPercentage}%`;
      
      if (widthPercentage > 5) {
        remainderElement.textContent = `Fire: ${formatLength(remainingLength)}`;
      }
      
      remainderElement.title = `Fire: ${formatLength(remainingLength)}`;
      
      visualizationElement.appendChild(remainderElement);
    }
    
    stockBarElement.appendChild(visualizationElement);
    
    // Create the pieces list
    const piecesListElement = document.createElement('div');
    piecesListElement.className = 'stock-bar-pieces-list';
    
    const piecesText = stockBar.cuts.map(cut => 
      `${cut.position}: ${formatLength(cut.length)}`
    ).join(' + ');
    
    if (remainingLength >= 50) {
      piecesListElement.textContent = `${piecesText} + Fire: ${formatLength(remainingLength)}`;
    } else {
      piecesListElement.textContent = piecesText;
    }
    
    stockBarElement.appendChild(piecesListElement);
    
    return stockBarElement;
  }
  
  /**
   * Get a consistent color for a position
   * 
   * @param {string} position - Position identifier
   * @returns {string} CSS color
   */
  getColorForPosition(position) {
    const colors = [
      '#3B6E8F', '#4C8DAF', '#2D5A75', '#5B9CCD', 
      '#4EAAA0', '#6E7E99', '#8B95A7', '#A67C8A',
      '#B8860B', '#CD853F', '#D2691E', '#FF6347'
    ];
    
    // Create a simple hash from the position string
    let hash = 0;
    for (let i = 0; i < position.length; i++) {
      hash = position.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
  
  /**
   * Create a visual representation of fire pieces
   * 
   * @param {Array} firePieces - Array of fire pieces
   * @returns {Array<HTMLElement>} Array of fire piece elements
   */
  createFirePiecesVisualization(firePieces) {
    // Sort fire pieces by length (descending) and then by name
    const sortedPieces = [...firePieces].sort((a, b) => {
      if (b.length !== a.length) {
        return b.length - a.length;
      }
      return a.name.localeCompare(b.name);
    });
    
    return sortedPieces.map(piece => {
      const pieceElement = document.createElement('div');
      pieceElement.className = 'fire-piece-item';
      
      const nameElement = document.createElement('div');
      nameElement.className = 'fire-piece-name';
      nameElement.textContent = piece.name;
      
      const lengthElement = document.createElement('div');
      lengthElement.className = 'fire-piece-length';
      lengthElement.textContent = formatLength(piece.length);
      
      const sourceElement = document.createElement('div');
      sourceElement.className = 'fire-piece-source';
      sourceElement.textContent = `Profil #${piece.stockBarIndex + 1}'den`;
      
      pieceElement.appendChild(nameElement);
      pieceElement.appendChild(lengthElement);
      pieceElement.appendChild(sourceElement);
      
      return pieceElement;
    });
  }
  
  /**
   * Create a visual representation of welded parts
   * 
   * @param {Array} weldedParts - Array of welded parts
   * @returns {Array<HTMLElement>} Array of welded part elements
   */
  createWeldedPartsVisualization(weldedParts) {
    // Defensive check to ensure weldedParts is an array
    if (!Array.isArray(weldedParts)) {
      return [];
    }
    
    // Sort welded parts by position
    const sortedParts = [...weldedParts].sort((a, b) => {
      // Extract numeric part from position for proper sorting
      const aNum = a.position.match(/\d+/);
      const bNum = b.position.match(/\d+/);
      
      if (aNum && bNum) {
        const aNumber = parseInt(aNum[0]);
        const bNumber = parseInt(bNum[0]);
        if (aNumber !== bNumber) {
          return aNumber - bNumber;
        }
      }
      
      return a.position.localeCompare(b.position);
    });
    
    return sortedParts.map(part => {
      const partElement = document.createElement('div');
      partElement.className = 'welded-part-item';
      
      const titleElement = document.createElement('div');
      titleElement.className = 'welded-part-title';
      titleElement.textContent = `${part.position}: ${formatLength(part.targetLength)}`;
      
      const formulaElement = document.createElement('div');
      formulaElement.className = 'welded-formula';
      
      const formula = part.pieces.map(piece => 
        `${piece.name} (${formatLength(piece.length)})`
      ).join(' + ');
      
      formulaElement.textContent = `${formula} = ${formatLength(part.actualLength)}`;
      
      const toleranceElement = document.createElement('div');
      toleranceElement.className = 'welded-tolerance';
      toleranceElement.textContent = `Tolerans: ±${part.tolerance}mm`;
      
      partElement.appendChild(titleElement);
      partElement.appendChild(formulaElement);
      partElement.appendChild(toleranceElement);
      
      return partElement;
    });
  }
  
  /**
   * Update the results section with visualization
   * 
   * @param {Object} results - Optimization results
   */
  displayResults(results) {
    // Get container elements
    const resultsPlaceholder = document.getElementById('results-placeholder');
    const resultsContent = document.getElementById('results-content');
    const stockBarsContainer = document.getElementById('stock-bars-container');
    const firePiecesList = document.getElementById('fire-pieces-list');
    const weldedPartsList = document.getElementById('welded-parts-list');
    const totalBarsElement = document.getElementById('total-bars');
    const utilizationElement = document.getElementById('utilization');
    const weldedPartsElement = document.getElementById('welded-parts');
    
    // Show results content, hide placeholder
    resultsPlaceholder.classList.add('hidden');
    resultsContent.classList.remove('hidden');
    
    // Update summary
    totalBarsElement.textContent = results.totalStockBars;
    utilizationElement.textContent = `${results.materialUtilization}%`;
    weldedPartsElement.textContent = results.weldedParts.length;
    
    // Clear previous results
    stockBarsContainer.innerHTML = '';
    firePiecesList.innerHTML = '';
    weldedPartsList.innerHTML = '';
    
    // Display stock bars
    results.stockBars.forEach((bar, index) => {
      const barElement = this.createStockBarVisualization(bar, index);
      stockBarsContainer.appendChild(barElement);
    });
    
    // Display fire pieces
    const firePieceElements = this.createFirePiecesVisualization(results.firePieces);
    if (firePieceElements.length > 0) {
      firePieceElements.forEach(element => {
        firePiecesList.appendChild(element);
      });
    } else {
      const noFireElement = document.createElement('p');
      noFireElement.textContent = 'Kullanılabilir fire parça yok';
      noFireElement.className = 'no-items-message';
      firePiecesList.appendChild(noFireElement);
    }
    
    // Display welded parts
    const weldedPartElements = this.createWeldedPartsVisualization(results.weldedParts);
    if (weldedPartElements.length > 0) {
      weldedPartElements.forEach(element => {
        weldedPartsList.appendChild(element);
      });
    } else {
      const noWeldedElement = document.createElement('p');
      noWeldedElement.textContent = 'Kaynaklı parça oluşturulmadı';
      noWeldedElement.className = 'no-items-message';
      weldedPartsList.appendChild(noWeldedElement);
    }
    
    // DXF Export butonu ekle
    this.addDXFExportButton(results);
  }
  
  /**
   * DXF Export butonu ekle
   */
  addDXFExportButton(results) {
    const resultsContent = document.getElementById('results-content');
    
    // Önceki butonu kaldır
    const existingButton = document.getElementById('dxf-export-btn');
    if (existingButton) {
      existingButton.remove();
    }
    
    // DXF Export butonu oluştur
    const exportButton = document.createElement('button');
    exportButton.id = 'dxf-export-btn';
    exportButton.className = 'btn-secondary';
    exportButton.style.marginTop = '20px';
    exportButton.innerHTML = '📄 DXF Olarak İndir';
    exportButton.title = 'Kesim planını DXF formatında indir';
    
    exportButton.addEventListener('click', () => {
      const stockLength = parseInt(document.getElementById('stock-length').value, 10) || 12000;
      const dxfExporter = new DXFExporter();
      dxfExporter.exportToDXF(results, stockLength);
    });
    
    // Butonu summary'nin altına ekle
    const summary = resultsContent.querySelector('.summary');
    if (summary) {
      summary.parentNode.insertBefore(exportButton, summary.nextSibling);
    } else {
      resultsContent.insertBefore(exportButton, resultsContent.firstChild);
    }
  }
}