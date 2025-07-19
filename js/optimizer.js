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
    
    // Akıllı optimizasyon: fire'ları kullanarak ihtiyaç duyulan parçaları oluştur
    const optimizationResult = this.smartOptimization(flatParts);
    const stockBars = optimizationResult.stockBars;
    const weldedParts = optimizationResult.weldedParts;
    
    console.log('Hesaplanan kesimler:', stockBars);
    
    // Fire parçaları topla
    const fireManager = new FireManager();
    const firePieces = fireManager.collectFireParts(stockBars);
    console.log('Fire parçalar:', firePieces);
    
    // Ek kaynaklı parçalar oluştur (kalan fire'lardan)
    const additionalWeldedParts = fireManager.createWeldedParts(firePieces, flatParts);
    const allWeldedParts = [...weldedParts, ...additionalWeldedParts];
    console.log('Tüm kaynaklı parçalar:', allWeldedParts);
    
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
      weldedParts: allWeldedParts,
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
   * Akıllı optimizasyon: Fire'ları kullanarak ihtiyaç duyulan parçaları oluştur
   */
  smartOptimization(flatParts) {
    console.log('\n🧠 AKILLI OPTİMİZASYON BAŞLIYOR...');
    
    const stockBars = [];
    const weldedParts = [];
    const remainingParts = [...flatParts];
    let barId = 1;
    
    // İlk geçiş: Normal kesimler
    while (remainingParts.length > 0) {
      const stockBar = {
        id: barId++,
        cuts: [],
        remainingLength: this.stockLength,
        efficiency: 0
      };
      
      // Bu profilde mümkün olduğunca çok parça yerleştir
      let placed = true;
      while (placed) {
        placed = false;
        
        for (let i = 0; i < remainingParts.length; i++) {
          const part = remainingParts[i];
          
          if (part.length <= stockBar.remainingLength) {
            stockBar.cuts.push({
              position: part.position,
              length: part.length
            });
            
            stockBar.remainingLength -= part.length;
            remainingParts.splice(i, 1);
            placed = true;
            break;
          }
        }
      }
      
      // Verimliliği hesapla
      const usedLength = this.stockLength - stockBar.remainingLength;
      stockBar.efficiency = Math.round((usedLength / this.stockLength) * 100);
      
      stockBars.push(stockBar);
      console.log(`Profil #${stockBar.id}: ${stockBar.cuts.length} parça, ${stockBar.efficiency}% verimlilik, Fire: ${stockBar.remainingLength}mm`);
    }
    
    // İkinci geçiş: Fire'ları kullanarak kaynaklı parçalar oluştur
    this.createWeldedPartsFromFires(stockBars, flatParts, weldedParts);
    
    return { stockBars, weldedParts };
  }
  
  /**
   * Fire parçalarından kaynaklı parçalar oluştur
   */
  createWeldedPartsFromFires(stockBars, originalParts, weldedParts) {
    console.log('\n🔧 FIRE\'LARDAN KAYNAKLI PARÇA OLUŞTURMA...');
    
    // Fire parçaları topla
    const fires = [];
    stockBars.forEach((bar, index) => {
      if (bar.remainingLength >= this.minFireLength) {
        fires.push({
          name: `F${index + 1}`,
          length: bar.remainingLength,
          stockBarIndex: index,
          used: false
        });
      }
    });
    
    if (fires.length === 0) {
      console.log('❌ Yeterli fire parça yok');
      return;
    }
    
    console.log(`🔥 ${fires.length} adet fire parça bulundu:`, fires.map(f => `${f.name}:${f.length}mm`));
    
    // Benzersiz parça uzunluklarını al
    const uniqueLengths = [...new Set(originalParts.map(p => p.length))];
    uniqueLengths.sort((a, b) => b - a); // Büyükten küçüğe
    
    // Her uzunluk için fire kombinasyonları dene
    uniqueLengths.forEach(targetLength => {
      this.tryCreateWeldedPart(fires, targetLength, weldedParts);
    });
    
    // Standart uzunluklar için de dene
    const standardLengths = [9000, 7500, 6000, 4500, 4000, 3500, 3000];
    standardLengths.forEach(targetLength => {
      if (!uniqueLengths.includes(targetLength)) {
        this.tryCreateWeldedPart(fires, targetLength, weldedParts);
      }
    });
  }
  
  /**
   * Belirli uzunluk için kaynaklı parça oluşturmaya çalış
   */
  tryCreateWeldedPart(fires, targetLength, weldedParts) {
    const tolerance = this.calculateWeldTolerance(targetLength);
    
    // İki parça kombinasyonu
    for (let i = 0; i < fires.length; i++) {
      for (let j = i + 1; j < fires.length; j++) {
        const fire1 = fires[i];
        const fire2 = fires[j];
        
        if (fire1.used || fire2.used) continue;
        
        const totalLength = fire1.length + fire2.length - this.weldTolerance;
        const difference = Math.abs(totalLength - targetLength);
        
        if (difference <= tolerance) {
          const weldedPart = {
            position: `W${weldedParts.length + 1}-${targetLength}`,
            targetLength: targetLength,
            actualLength: totalLength,
            tolerance: difference,
            pieces: [
              { name: fire1.name, length: fire1.length },
              { name: fire2.name, length: fire2.length }
            ]
          };
          
          weldedParts.push(weldedPart);
          fire1.used = true;
          fire2.used = true;
          
          console.log(`  ✅ ${weldedPart.position}: ${fire1.name}(${fire1.length}mm) + ${fire2.name}(${fire2.length}mm) = ${totalLength}mm (hedef: ${targetLength}mm, fark: ${difference}mm)`);
          return true;
        }
      }
    }
    
    // Üç parça kombinasyonu (büyük parçalar için)
    if (targetLength > 6000) {
      for (let i = 0; i < fires.length; i++) {
        for (let j = i + 1; j < fires.length; j++) {
          for (let k = j + 1; k < fires.length; k++) {
            const fire1 = fires[i];
            const fire2 = fires[j];
            const fire3 = fires[k];
            
            if (fire1.used || fire2.used || fire3.used) continue;
            
            const totalLength = fire1.length + fire2.length + fire3.length - (this.weldTolerance * 2);
            const difference = Math.abs(totalLength - targetLength);
            
            if (difference <= tolerance) {
              const weldedPart = {
                position: `W${weldedParts.length + 1}-${targetLength}`,
                targetLength: targetLength,
                actualLength: totalLength,
                tolerance: difference,
                pieces: [
                  { name: fire1.name, length: fire1.length },
                  { name: fire2.name, length: fire2.length },
                  { name: fire3.name, length: fire3.length }
                ]
              };
              
              weldedParts.push(weldedPart);
              fire1.used = true;
              fire2.used = true;
              fire3.used = true;
              
              console.log(`  ✅ ${weldedPart.position}: ${fire1.name}(${fire1.length}mm) + ${fire2.name}(${fire2.length}mm) + ${fire3.name}(${fire3.length}mm) = ${totalLength}mm (hedef: ${targetLength}mm, fark: ${difference}mm)`);
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Kaynak toleransı hesapla
   */
  calculateWeldTolerance(targetLength) {
    if (targetLength <= 1000) return 50;
    if (targetLength <= 3000) return 100;
    if (targetLength <= 6000) return 150;
    return 200;
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