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
    console.log('🚀 AKILLI KESIM OPTİMİZASYONU BAŞLIYOR...');
    console.log('Gelen parçalar:', parts);
    
    if (!parts || parts.length === 0) {
      return this.createEmptyResults();
    }
    
    // Parçaları düzleştir (quantity'ye göre çoğalt)
    const flatParts = this.flattenParts(parts);
    console.log('Düzleştirilmiş parçalar:', flatParts);
    
    // Akıllı optimizasyon: Fire'ları kullanarak minimum profil sayısı
    const optimizationResult = this.smartFireOptimization(flatParts);
    
    console.log('🎯 OPTİMİZASYON TAMAMLANDI!');
    console.log('Sonuçlar:', optimizationResult);
    
    return optimizationResult;
  }
  
  /**
   * Parçaları düzleştir (quantity'ye göre çoğalt)
   */
  flattenParts(parts) {
    const flatParts = [];
    
    parts.forEach(part => {
      for (let i = 0; i < part.quantity; i++) {
        flatParts.push({
          position: `${part.position}-${i + 1}`,
          length: part.length,
          originalPosition: part.position,
          needed: true
        });
      }
    });
    
    // Uzunluğa göre sırala (büyükten küçüğe)
    flatParts.sort((a, b) => b.length - a.length);
    
    return flatParts;
  }
  
  /**
   * Akıllı fire optimizasyonu
   */
  smartFireOptimization(flatParts) {
    console.log('\n🧠 AKILLI FIRE OPTİMİZASYONU BAŞLIYOR...');
    
    const stockBars = [];
    const weldedParts = [];
    const remainingParts = [...flatParts];
    let barId = 1;
    
    // İlk geçiş: Normal kesimler yap
    console.log('\n📏 İLK GEÇİŞ: Normal kesimler...');
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
            console.log(`  ✂️ ${part.position} (${part.length}mm) kesildi`);
            break;
          }
        }
      }
      
      // Verimliliği hesapla
      const usedLength = this.stockLength - stockBar.remainingLength;
      stockBar.efficiency = Math.round((usedLength / this.stockLength) * 100);
      
      stockBars.push(stockBar);
      console.log(`📊 Profil #${stockBar.id}: ${stockBar.cuts.length} parça, ${stockBar.efficiency}% verimlilik, Fire: ${stockBar.remainingLength}mm`);
    }
    
    // İkinci geçiş: Fire'ları analiz et ve kaynaklı parçalar oluştur
    console.log('\n🔥 İKİNCİ GEÇİŞ: Fire analizi...');
    const fires = this.collectFires(stockBars);
    
    if (fires.length >= 2) {
      console.log('\n🔧 ÜÇÜNCÜ GEÇİŞ: Fire kaynak optimizasyonu...');
      this.optimizeWithFireWelding(flatParts, fires, stockBars, weldedParts);
    }
    
    // Fire parçaları topla (son durum)
    const finalFires = this.collectFires(stockBars);
    
    // Sonuçları hazırla
    return {
      stockBars: stockBars.map(bar => ({
        id: bar.id,
        cuts: bar.cuts,
        remainingLength: bar.remainingLength,
        efficiency: bar.efficiency
      })),
      firePieces: finalFires.map(fire => ({
        name: fire.name,
        length: fire.length,
        stockBarIndex: fire.stockBarIndex
      })),
      weldedParts: weldedParts,
      totalStockBars: stockBars.length,
      materialUtilization: this.calculateMaterialUtilization(stockBars)
    };
  }
  
  /**
   * Fire parçaları topla
   */
  collectFires(stockBars) {
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
    
    console.log(`🔥 ${fires.length} adet fire parça bulundu:`, fires.map(f => `${f.name}:${f.length}mm`));
    return fires;
  }
  
  /**
   * Fire kaynak optimizasyonu
   */
  optimizeWithFireWelding(originalParts, fires, stockBars, weldedParts) {
    // Benzersiz uzunlukları al
    const uniqueLengths = [...new Set(originalParts.map(p => p.length))];
    uniqueLengths.sort((a, b) => b - a);
    
    console.log('🎯 Hedef uzunluklar:', uniqueLengths);
    
    // Her uzunluk için fire kombinasyonları dene
    uniqueLengths.forEach(targetLength => {
      const canCreate = this.canCreateFromFires(fires, targetLength);
      
      if (canCreate.possible) {
        console.log(`\n💡 ${targetLength}mm için fire kombinasyonu bulundu!`);
        
        // Yeni bir profil oluştur veya mevcut profili optimize et
        const optimized = this.tryOptimizeWithWelding(originalParts, targetLength, canCreate, stockBars, weldedParts);
        
        if (optimized) {
          // Fire'ları kullanıldı olarak işaretle
          canCreate.fires.forEach(fire => fire.used = true);
        }
      }
    });
  }
  
  /**
   * Fire'lardan belirli uzunluk oluşturulabilir mi kontrol et
   */
  canCreateFromFires(fires, targetLength) {
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
          return {
            possible: true,
            fires: [fire1, fire2],
            actualLength: totalLength,
            difference: difference
          };
        }
      }
    }
    
    // Üç parça kombinasyonu
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
            return {
              possible: true,
              fires: [fire1, fire2, fire3],
              actualLength: totalLength,
              difference: difference
            };
          }
        }
      }
    }
    
    return { possible: false };
  }
  
  /**
   * Kaynak ile optimizasyon dene
   */
  tryOptimizeWithWelding(originalParts, targetLength, weldInfo, stockBars, weldedParts) {
    // Bu uzunlukta kaç parça gerekiyor?
    const neededCount = originalParts.filter(p => p.length === targetLength).length;
    const currentWeldedCount = weldedParts.filter(w => w.targetLength === targetLength).length;
    
    if (currentWeldedCount >= neededCount) {
      console.log(`  ⏭️ ${targetLength}mm için yeterli kaynaklı parça var`);
      return false;
    }
    
    // Kaynaklı parça oluştur
    const weldedPart = {
      position: `W${weldedParts.length + 1}-${targetLength}`,
      targetLength: targetLength,
      actualLength: weldInfo.actualLength,
      tolerance: weldInfo.difference,
      pieces: weldInfo.fires.map(fire => ({
        name: fire.name,
        length: fire.length
      }))
    };
    
    weldedParts.push(weldedPart);
    
    const fireNames = weldInfo.fires.map(f => `${f.name}(${f.length}mm)`).join(' + ');
    console.log(`  ✅ ${weldedPart.position}: ${fireNames} = ${weldInfo.actualLength}mm (hedef: ${targetLength}mm)`);
    
    // Fire'ları kullanıldı olarak işaretle (stockBars'da)
    weldInfo.fires.forEach(fire => {
      const stockBar = stockBars[fire.stockBarIndex];
      if (stockBar) {
        stockBar.remainingLength = 0; // Fire kullanıldı
      }
    });
    
    return true;
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