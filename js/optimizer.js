/**
 * Kesim optimizasyon sınıfı - Gerçek fire optimizasyonu ile
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
    console.log('🚀 GERÇEK FIRE OPTİMİZASYONU BAŞLIYOR...');
    console.log('Gelen parçalar:', parts);
    
    if (!parts || parts.length === 0) {
      return this.createEmptyResults();
    }
    
    // Parçaları düzleştir (quantity'ye göre çoğalt)
    const flatParts = this.flattenParts(parts);
    console.log('Düzleştirilmiş parçalar:', flatParts);
    
    // YENİ YAKLAŞIM: Önce fire potansiyelini analiz et
    const optimizationResult = this.fireAwareOptimization(flatParts);
    
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
   * Fire-aware optimizasyon - Önce fire potansiyelini analiz et
   */
  fireAwareOptimization(flatParts) {
    console.log('\n🧠 FIRE-AWARE OPTİMİZASYON BAŞLIYOR...');
    
    const stockBars = [];
    const weldedParts = [];
    const remainingParts = [...flatParts];
    let barId = 1;
    
    // AŞAMA 1: İlk kesim planını yap (ama henüz kesin değil)
    console.log('\n📋 AŞAMA 1: İlk kesim planı...');
    const initialPlan = this.createInitialCuttingPlan(remainingParts);
    
    // AŞAMA 2: Fire potansiyelini analiz et
    console.log('\n🔥 AŞAMA 2: Fire potansiyeli analizi...');
    const fireAnalysis = this.analyzeFirePotential(initialPlan);
    
    // AŞAMA 3: Fire kombinasyonlarını kontrol et
    console.log('\n🔧 AŞAMA 3: Fire kombinasyon kontrolü...');
    const optimizedPlan = this.optimizeWithFireCombinations(initialPlan, fireAnalysis, remainingParts);
    
    // AŞAMA 4: Final kesimi yap
    console.log('\n✂️ AŞAMA 4: Final kesim...');
    const finalResult = this.executeFinalCutting(optimizedPlan, weldedParts);
    
    return finalResult;
  }
  
  /**
   * İlk kesim planını oluştur
   */
  createInitialCuttingPlan(parts) {
    const plan = [];
    const tempParts = [...parts];
    let barId = 1;
    
    while (tempParts.length > 0) {
      const bar = {
        id: barId++,
        cuts: [],
        remainingLength: this.stockLength
      };
      
      // Bu profilde mümkün olduğunca çok parça yerleştir
      let placed = true;
      while (placed) {
        placed = false;
        
        for (let i = 0; i < tempParts.length; i++) {
          const part = tempParts[i];
          
          if (part.length <= bar.remainingLength) {
            bar.cuts.push({
              position: part.position,
              length: part.length
            });
            
            bar.remainingLength -= part.length;
            tempParts.splice(i, 1);
            placed = true;
            break;
          }
        }
      }
      
      plan.push(bar);
    }
    
    console.log(`📊 İlk plan: ${plan.length} profil gerekiyor`);
    plan.forEach(bar => {
      console.log(`  Profil #${bar.id}: ${bar.cuts.length} parça, Fire: ${bar.remainingLength}mm`);
    });
    
    return plan;
  }
  
  /**
   * Fire potansiyelini analiz et
   */
  analyzeFirePotential(plan) {
    const fires = [];
    
    plan.forEach((bar, index) => {
      if (bar.remainingLength >= this.minFireLength) {
        fires.push({
          name: `F${index + 1}`,
          length: bar.remainingLength,
          barIndex: index
        });
      }
    });
    
    console.log(`🔥 ${fires.length} adet fire bulundu:`, fires.map(f => `${f.name}:${f.length}mm`));
    
    // Fire kombinasyonlarını analiz et
    const combinations = this.findFireCombinations(fires);
    
    return {
      fires: fires,
      combinations: combinations
    };
  }
  
  /**
   * Fire kombinasyonlarını bul
   */
  findFireCombinations(fires) {
    const combinations = [];
    
    // İki parça kombinasyonları
    for (let i = 0; i < fires.length; i++) {
      for (let j = i + 1; j < fires.length; j++) {
        const fire1 = fires[i];
        const fire2 = fires[j];
        const totalLength = fire1.length + fire2.length - this.weldTolerance;
        
        combinations.push({
          fires: [fire1, fire2],
          totalLength: totalLength,
          type: 'double'
        });
      }
    }
    
    // Üç parça kombinasyonları
    for (let i = 0; i < fires.length; i++) {
      for (let j = i + 1; j < fires.length; j++) {
        for (let k = j + 1; k < fires.length; k++) {
          const fire1 = fires[i];
          const fire2 = fires[j];
          const fire3 = fires[k];
          const totalLength = fire1.length + fire2.length + fire3.length - (this.weldTolerance * 2);
          
          combinations.push({
            fires: [fire1, fire2, fire3],
            totalLength: totalLength,
            type: 'triple'
          });
        }
      }
    }
    
    console.log(`🔗 ${combinations.length} adet fire kombinasyonu bulundu`);
    return combinations;
  }
  
  /**
   * Fire kombinasyonları ile optimizasyon yap
   */
  optimizeWithFireCombinations(initialPlan, fireAnalysis, remainingParts) {
    console.log('\n💡 Fire kombinasyonları ile optimizasyon...');
    
    // Hangi uzunluklar gerekiyor?
    const neededLengths = [...new Set(remainingParts.map(p => p.length))];
    console.log('🎯 Gerekli uzunluklar:', neededLengths);
    
    const optimizedPlan = [...initialPlan];
    const usedCombinations = [];
    const satisfiedParts = []; // Karşılanan parçaları takip et
    
    // Her gerekli uzunluk için fire kombinasyonu ara
    neededLengths.forEach(targetLength => {
      const bestCombination = this.findBestFireCombination(fireAnalysis.combinations, targetLength, usedCombinations);
      
      if (bestCombination) {
        console.log(`✅ ${targetLength}mm için fire kombinasyonu bulundu!`);
        console.log(`   ${bestCombination.fires.map(f => `${f.name}(${f.length}mm)`).join(' + ')} = ${bestCombination.totalLength}mm`);
        
        // Bu kombinasyonu kullan
        usedCombinations.push(bestCombination);
        
        // İlgili profilleri güncelle (fire'ları sıfırla)
        bestCombination.fires.forEach(fire => {
          const bar = optimizedPlan[fire.barIndex];
          if (bar) {
            bar.remainingLength = 0; // Fire kullanıldı
            bar.fireUsed = true;
          }
        });
        
        // Bu uzunluktaki parçaları "karşılandı" olarak işaretle
        const partsToSatisfy = remainingParts.filter(p => p.length === targetLength);
        if (partsToSatisfy.length > 0) {
          // Sadece bir tanesini karşıla
          const satisfiedPart = partsToSatisfy[0];
          satisfiedParts.push(satisfiedPart);
          console.log(`   ✅ ${satisfiedPart.position} (${targetLength}mm) fire kombinasyonu ile karşılandı`);
        }
      }
    });
    
    console.log(`🎯 ${usedCombinations.length} adet fire kombinasyonu kullanıldı`);
    
    // Karşılanan parçaları remainingParts'tan çıkar
    satisfiedParts.forEach(satisfiedPart => {
      const index = remainingParts.findIndex(p => p.position === satisfiedPart.position);
      if (index !== -1) {
        remainingParts.splice(index, 1);
      }
    });
    
    console.log(`📋 ${remainingParts.length} adet parça kaldı`);
    
    return {
      plan: optimizedPlan,
      usedCombinations: usedCombinations,
      remainingParts: remainingParts,
      satisfiedParts: satisfiedParts
    };
  }
  
  /**
   * En iyi fire kombinasyonunu bul
   */
  findBestFireCombination(combinations, targetLength, usedCombinations) {
    let bestCombination = null;
    let bestDifference = Infinity;
    
    combinations.forEach(combination => {
      // Bu kombinasyon zaten kullanıldı mı?
      const alreadyUsed = usedCombinations.some(used => 
        used.fires.every(fire => combination.fires.some(f => f.name === fire.name))
      );
      
      if (alreadyUsed) return;
      
      const difference = Math.abs(combination.totalLength - targetLength);
      const tolerance = this.calculateWeldTolerance(targetLength);
      
      if (difference <= tolerance && difference < bestDifference) {
        bestCombination = combination;
        bestDifference = difference;
      }
    });
    
    return bestCombination;
  }
  
  /**
   * Final kesimi gerçekleştir
   */
  executeFinalCutting(optimizedResult, weldedParts) {
    console.log('\n🏁 FINAL KESİM GERÇEKLEŞTİRİLİYOR...');
    
    const { plan, usedCombinations, remainingParts, satisfiedParts } = optimizedResult;
    const stockBars = [];
    
    console.log(`🔥 ${satisfiedParts ? satisfiedParts.length : 0} parça fire kombinasyonu ile karşılandı`);
    console.log(`📋 ${remainingParts.length} parça için normal kesim gerekiyor`);
    
    // Kalan parçalar için yeni profiller ekle
    if (remainingParts.length > 0) {
      console.log(`📋 ${remainingParts.length} adet kalan parça için ek profiller...`);
      
      let barId = plan.length + 1;
      const tempParts = [...remainingParts];
      
      while (tempParts.length > 0) {
        const bar = {
          id: barId++,
          cuts: [],
          remainingLength: this.stockLength
        };
        
        let placed = true;
        while (placed) {
          placed = false;
          
          for (let i = 0; i < tempParts.length; i++) {
            const part = tempParts[i];
            
            if (part.length <= bar.remainingLength) {
              bar.cuts.push({
                position: part.position,
                length: part.length
              });
              
              bar.remainingLength -= part.length;
              tempParts.splice(i, 1);
              placed = true;
              break;
            }
          }
        }
        
        plan.push(bar);
      }
    }
    
    // Plan'ı stockBars'a çevir
    plan.forEach(bar => {
      if (!bar.isWelded) {
        const usedLength = this.stockLength - bar.remainingLength;
        const efficiency = Math.round((usedLength / this.stockLength) * 100);
        
        stockBars.push({
          id: bar.id,
          cuts: bar.cuts,
          remainingLength: bar.remainingLength,
          efficiency: efficiency
        });
      }
    });
    
    // Kaynaklı parçaları oluştur
    usedCombinations.forEach((combination, index) => {
      // Hangi parça için oluşturuldu bul
      const targetPart = satisfiedParts && satisfiedParts.length > index ? satisfiedParts[index] : null;
      const position = targetPart ? targetPart.position : `W${index + 1}`;
      
      weldedParts.push({
        position: position,
        targetLength: combination.totalLength,
        actualLength: combination.totalLength,
        tolerance: this.weldTolerance,
        pieces: combination.fires.map(fire => ({
          name: fire.name,
          length: fire.length
        }))
      });
    });
    
    // Fire parçaları topla (son durum)
    const finalFires = [];
    stockBars.forEach((bar, index) => {
      if (bar.remainingLength >= this.minFireLength) {
        finalFires.push({
          name: `F${index + 1}`,
          length: bar.remainingLength,
          stockBarIndex: index
        });
      }
    });
    
    console.log(`🎯 SONUÇ: ${stockBars.length} profil, ${weldedParts.length} kaynaklı parça`);
    
    return {
      stockBars: stockBars,
      firePieces: finalFires,
      weldedParts: weldedParts,
      totalStockBars: stockBars.length,
      materialUtilization: this.calculateMaterialUtilization(stockBars)
    };
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