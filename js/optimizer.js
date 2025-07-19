/**
 * Kesim optimizasyon sınıfı
 */
class CuttingOptimizer {
  constructor(stockLength = 12000, weldTolerance = 10, minFireLength = 100) {
    this.stockLength = stockLength;
    this.weldTolerance = weldTolerance;
    this.minFireLength = minFireLength;
  }
  
  setStockLength(length) {
    this.stockLength = length;
  }
  
  setWeldTolerance(tolerance) {
    this.weldTolerance = tolerance;
  }
  
  setMinFireLength(length) {
    this.minFireLength = length;
  }
  
  /**
   * Ana optimizasyon fonksiyonu
   */
  optimize(parts) {
    console.log('🚀 KESIM OPTİMİZASYONU BAŞLIYOR...');
    console.log('Parçalar:', parts);
    
    if (!parts || parts.length === 0) {
      return this.createEmptyResults();
    }
    
    // Parçaları düzleştir (quantity'ye göre çoğalt)
    const flatParts = this.flattenParts(parts);
    console.log('Düzleştirilmiş parçalar:', flatParts);
    
    // Optimum kesim düzenini hesapla
    const stockBars = this.calculateOptimalCuts(flatParts);
    console.log('Hesaplanan kesimler:', stockBars);
    
    // Fire parçaları topla
    const fireManager = new FireManager();
    const firePieces = fireManager.collectFireParts(stockBars);
    console.log('Fire parçalar:', firePieces);
    
    // Kaynaklı parçalar oluştur
    const weldedParts = fireManager.createWeldedParts(firePieces, flatParts);
    console.log('Kaynaklı parçalar:', weldedParts);
    
    // Sonuçları hazırla
    const results = {
      stockBars: stockBars.map(bar => ({
        id: bar.id,
        cuts: bar.cuts,
        remainingLength: bar.remainingLength,
        efficiency: bar.efficiency
      })),
      firePieces: firePieces.map(fire => ({
        name: fire.name,
        length: fire.length,
        stockBarIndex: fire.stockBarIndex
      })),
      weldedParts: weldedParts,
      totalStockBars: stockBars.length,
      materialUtilization: this.calculateMaterialUtilization(stockBars)
    };
    
    console.log('🎯 OPTİMİZASYON TAMAMLANDI!');
    console.log('Sonuçlar:', results);
    
    return results;
  }
  
  /**
   * Parçaları düzleştir (quantity'ye göre çoğalt)
   */
  flattenParts(parts) {
    const flatParts = [];
    
    parts.forEach(part => {
      for (let i = 0; i < part.quantity; i++) {
        flatParts.push({
          position: `${part.position}`,
          length: part.length,
          originalPosition: part.position
        });
      }
    });
    
    // Uzunluğa göre sırala (büyükten küçüğe)
    flatParts.sort((a, b) => b.length - a.length);
    
    return flatParts;
  }
  
  /**
   * Optimum kesim düzenini hesapla
   */
  calculateOptimalCuts(flatParts) {
    const stockBars = [];
    const remainingParts = [...flatParts];
    let barId = 1;
    
    while (remainingParts.length > 0) {
      const stockBar = {
        id: barId++,
        cuts: [],
        remainingLength: this.stockLength,
        efficiency: 0
      };
      
      // Bu profilde mümkün olduğunca çok parça yerleştir
      let i = 0;
      while (i < remainingParts.length) {
        const part = remainingParts[i];
        
        if (part.length <= stockBar.remainingLength) {
          // Parçayı ekle
          stockBar.cuts.push({
            position: part.position,
            length: part.length
          });
          
          stockBar.remainingLength -= part.length;
          remainingParts.splice(i, 1);
          
          // Baştan başla (daha iyi kombinasyon bulabilmek için)
          i = 0;
        } else {
          i++;
        }
      }
      
      // Verimliliği hesapla
      const usedLength = this.stockLength - stockBar.remainingLength;
      stockBar.efficiency = Math.round((usedLength / this.stockLength) * 100);
      
      stockBars.push(stockBar);
      
      console.log(`Profil #${stockBar.id}: ${stockBar.cuts.length} parça, ${stockBar.efficiency}% verimlilik`);
    }
    
    return stockBars;
  }
  
  /**
   * Malzeme kullanım oranını hesapla
   */
  calculateMaterialUtilization(stockBars) {
    if (stockBars.length === 0) return 0;
    
    const totalEfficiency = stockBars.reduce((sum, bar) => sum + bar.efficiency, 0);
    return Math.round(totalEfficiency / stockBars.length);
  }
  
  /**
   * Boş sonuç oluştur
   */
  createEmptyResults() {
    return {
      stockBars: [],
      firePieces: [],
      weldedParts: [],
      totalStockBars: 0,
      materialUtilization: 0
    };
  }
}