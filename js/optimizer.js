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
    
    // 1. AŞAMA: Normal kesimler yap
    const normalCuts = this.calculateNormalCuts(parts);
    console.log('✅ Normal kesimler tamamlandı');
    
    // 2. AŞAMA: Fire parçaları topla
    const fireManager = new FireManager();
    const fireParts = fireManager.collectFireParts(normalCuts);
    console.log('🔥 Fire parçalar toplandı:', fireParts);
    
    // 3. AŞAMA: Fire'lardan orijinal parçaları oluştur ve kesimleri iptal et
    const optimizedCuts = this.optimizeWithFireParts(normalCuts, fireParts, parts);
    console.log('⚡ Fire optimizasyonu tamamlandı');
    
    // 4. AŞAMA: Kalan fire'ları EK parçalar yap
    const remainingFires = fireManager.collectFireParts(optimizedCuts);
    const ekParts = fireManager.createEkParts(remainingFires);
    console.log('🔧 EK parçalar oluşturuldu:', ekParts);
    
    // Sonuçları hazırla
    const results = {
      stockBars: optimizedCuts.map(cut => ({
        id: cut.id,
        stockLength: cut.stockLength,
        cuts: cut.parts,
        remainingLength: cut.fireLength,
        efficiency: cut.efficiency,
        isOptimized: cut.isOptimized
      })),
      weldedParts: ekParts,
      totalStockBars: optimizedCuts.length,
      materialUtilization: (optimizedCuts.reduce((sum, cut) => sum + cut.efficiency, 0) / optimizedCuts.length).toFixed(1),
      firePieces: [],
      summary: this.calculateSummary(optimizedCuts, ekParts, parts)
    };
    
    console.log('🎯 OPTİMİZASYON TAMAMLANDI!');
    return results;
  }
  
  /**
   * Normal kesimler (fire optimizasyonu olmadan)
   */
  calculateNormalCuts(parts) {
    const cuts = [];
    let cutId = 1;
    
    parts.forEach(part => {
      const { position, length, quantity } = part;
      
      for (let i = 0; i < quantity; i++) {
        // Her parça için ayrı profil
        const cut = {
          id: cutId++,
          stockLength: this.stockLength,
          parts: [{
            position: position,
            length: length,
            startPos: 0,
            endPos: length
          }],
          fireLength: this.stockLength - length,
          efficiency: (length / this.stockLength) * 100,
          isOptimized: false
        };
        
        cuts.push(cut);
      }
    });
    
    return cuts;
  }
  
  /**
   * Fire parçalarla optimizasyon
   */
  optimizeWithFireParts(normalCuts, fireParts, originalParts) {
    console.log('🔄 FIRE OPTİMİZASYONU BAŞLIYOR...');
    
    const optimizedCuts = [...normalCuts];
    const weldedParts = [];
    
    // Her orijinal parça türü için fire'lardan oluşturma dene
    originalParts.forEach(originalPart => {
      const { position, length, quantity } = originalPart;
      
      console.log(`\n📋 ${position} (${length}mm) için fire optimizasyonu...`);
      
      // Bu parça için kaç adet fire'dan oluşturulabilir
      let createdCount = 0;
      const usedFires = [];
      
      // Strateji 1: Tek fire parçadan kes
      createdCount += this.createFromSingleFire(fireParts, length, position, usedFires, weldedParts);
      
      // Strateji 2: İki fire parça birleştir
      if (createdCount < quantity) {
        createdCount += this.createFromTwoFires(fireParts, length, position, usedFires, weldedParts);
      }
      
      // Strateji 3: Üç fire parça birleştir (büyük parçalar için)
      if (createdCount < quantity && length > 6000) {
        createdCount += this.createFromThreeFires(fireParts, length, position, usedFires, weldedParts);
      }
      
      // Başarılı olan kesimleri iptal et
      if (createdCount > 0) {
        console.log(`✅ ${position} için ${createdCount} adet fire'dan oluşturuldu`);
        this.cancelCuts(optimizedCuts, position, createdCount);
      }
      
      // Kullanılan fire'ları listeden çıkar
      this.removeUsedFires(fireParts, usedFires);
    });
    
    return optimizedCuts;
  }
  
  /**
   * Tek fire parçadan kesim
   */
  createFromSingleFire(fireParts, targetLength, position, usedFires, weldedParts) {
    let created = 0;
    const tolerance = this.calculateTolerance(targetLength);
    
    for (let i = 0; i < fireParts.length; i++) {
      const fire = fireParts[i];
      
      if (fire.length >= targetLength && fire.length <= targetLength + tolerance) {
        // Bu fire'dan kes
        weldedParts.push({
          position: `${position}-W${weldedParts.length + 1}`,
          targetLength: targetLength,
          actualLength: fire.length,
          tolerance: fire.length - targetLength,
          pieces: [{ name: fire.source, length: fire.length }]
        });
        
        usedFires.push(fire);
        created++;
        
        console.log(`  ✂️ Tek parça: ${fire.length}mm → ${position} (${fire.length - targetLength}mm tolerans)`);
      }
    }
    
    return created;
  }
  
  /**
   * İki fire parça birleştirme
   */
  createFromTwoFires(fireParts, targetLength, position, usedFires, weldedParts) {
    let created = 0;
    const tolerance = this.calculateTolerance(targetLength);
    
    for (let i = 0; i < fireParts.length; i++) {
      for (let j = i + 1; j < fireParts.length; j++) {
        const fire1 = fireParts[i];
        const fire2 = fireParts[j];
        
        if (usedFires.includes(fire1) || usedFires.includes(fire2)) continue;
        
        const totalLength = fire1.length + fire2.length - this.weldTolerance;
        
        if (Math.abs(totalLength - targetLength) <= tolerance) {
          weldedParts.push({
            position: `${position}-W${weldedParts.length + 1}`,
            targetLength: targetLength,
            actualLength: totalLength,
            tolerance: totalLength - targetLength,
            pieces: [
              { name: fire1.source, length: fire1.length },
              { name: fire2.source, length: fire2.length }
            ]
          });
          
          usedFires.push(fire1, fire2);
          created++;
          
          console.log(`  🔗 İki parça: ${fire1.length}mm + ${fire2.length}mm = ${totalLength}mm → ${position}`);
        }
      }
    }
    
    return created;
  }
  
  /**
   * Üç fire parça birleştirme
   */
  createFromThreeFires(fireParts, targetLength, position, usedFires, weldedParts) {
    let created = 0;
    const tolerance = this.calculateTolerance(targetLength);
    
    for (let i = 0; i < fireParts.length; i++) {
      for (let j = i + 1; j < fireParts.length; j++) {
        for (let k = j + 1; k < fireParts.length; k++) {
          const fire1 = fireParts[i];
          const fire2 = fireParts[j];
          const fire3 = fireParts[k];
          
          if (usedFires.includes(fire1) || usedFires.includes(fire2) || usedFires.includes(fire3)) continue;
          
          const totalLength = fire1.length + fire2.length + fire3.length - (this.weldTolerance * 2);
          
          if (Math.abs(totalLength - targetLength) <= tolerance) {
            weldedParts.push({
              position: `${position}-W${weldedParts.length + 1}`,
              targetLength: targetLength,
              actualLength: totalLength,
              tolerance: totalLength - targetLength,
              pieces: [
                { name: fire1.source, length: fire1.length },
                { name: fire2.source, length: fire2.length },
                { name: fire3.source, length: fire3.length }
              ]
            });
            
            usedFires.push(fire1, fire2, fire3);
            created++;
            
            console.log(`  🔗🔗 Üç parça: ${fire1.length}mm + ${fire2.length}mm + ${fire3.length}mm = ${totalLength}mm → ${position}`);
          }
        }
      }
    }
    
    return created;
  }
  
  /**
   * Tolerans hesapla
   */
  calculateTolerance(length) {
    if (length <= 500) return Math.max(length * 0.5, 100); // %50 veya 100mm
    if (length <= 2000) return Math.max(length * 0.1, 50); // %10 veya 50mm
    return Math.max(length * 0.02, 20); // %2 veya 20mm
  }
  
  /**
   * Başarılı kesimleri iptal et
   */
  cancelCuts(cuts, position, count) {
    let cancelled = 0;
    
    for (let i = cuts.length - 1; i >= 0 && cancelled < count; i--) {
      const cut = cuts[i];
      
      if (cut.parts.length === 1 && cut.parts[0].position === position) {
        cuts.splice(i, 1);
        cancelled++;
        console.log(`  ❌ ${position} kesimi iptal edildi (${cancelled}/${count})`);
      }
    }
  }
  
  /**
   * Kullanılan fire'ları listeden çıkar
   */
  removeUsedFires(fireParts, usedFires) {
    usedFires.forEach(usedFire => {
      const index = fireParts.findIndex(fire => 
        fire.cutId === usedFire.cutId && fire.length === usedFire.length
      );
      if (index !== -1) {
        fireParts.splice(index, 1);
      }
    });
  }
  
  /**
   * Özet hesapla
   */
  calculateSummary(cuts, weldedParts, originalParts) {
    const totalStockUsed = cuts.length;
    const totalFireLength = cuts.reduce((sum, cut) => sum + cut.fireLength, 0);
    const averageEfficiency = cuts.reduce((sum, cut) => sum + cut.efficiency, 0) / cuts.length;
    
    const originalStockNeeded = originalParts.reduce((sum, part) => sum + part.quantity, 0);
    const stockSaved = originalStockNeeded - totalStockUsed;
    
    return {
      totalStockUsed,
      originalStockNeeded,
      stockSaved,
      totalFireLength,
      averageEfficiency: averageEfficiency.toFixed(1),
      weldedPartsCount: weldedParts.length
    };
  }
}