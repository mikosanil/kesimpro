/**
 * Fire parça yönetim sınıfı
 */
class FireManager {
  constructor() {
    this.minFireLength = 100; // Minimum fire uzunluğu
  }
  
  /**
   * Kesimlerden fire parçaları topla
   */
  collectFireParts(cuts) {
    const fireParts = [];
    
    cuts.forEach(cut => {
      if (cut.fireLength >= this.minFireLength) {
        fireParts.push({
          cutId: cut.id,
          length: cut.fireLength,
          source: `Profil-${cut.id}`,
          originalCut: cut
        });
      }
    });
    
    // Fire parçaları uzunluğa göre sırala (büyükten küçüğe)
    fireParts.sort((a, b) => b.length - a.length);
    
    console.log(`🔥 ${fireParts.length} adet fire parça toplandı`);
    return fireParts;
  }
  
  /**
   * Fire parçalardan EK parçalar oluştur
   */
  createEkParts(fireParts) {
    console.log('\n🔧 EK PARÇA OLUŞTURMA BAŞLIYOR...');
    
    if (fireParts.length === 0) {
      console.log('❌ EK parça oluşturmak için yeterli fire yok');
      return [];
    }
    
    const ekParts = [];
    const usedFires = [];
    const targetLengths = [9000, 7500, 6000, 4500, 4000, 3500, 3000, 2500, 2000, 1500, 1000];
    
    // Her hedef uzunluk için kombinasyonları dene
    targetLengths.forEach(targetLength => {
      this.createEkPartsForLength(fireParts, targetLength, ekParts, usedFires);
    });
    
    // Kullanılan fire'ları listeden çıkar
    this.removeUsedFires(fireParts, usedFires);
    
    console.log(`✅ ${ekParts.length} adet EK parça oluşturuldu`);
    this.logEkPartsSummary(ekParts);
    
    return ekParts;
  }
  
  /**
   * Belirli uzunluk için EK parçalar oluştur
   */
  createEkPartsForLength(fireParts, targetLength, ekParts, usedFires) {
    const tolerance = Math.max(targetLength * 0.05, 50); // %5 tolerans
    const weldTolerance = 10;
    
    // İki parça kombinasyonu
    for (let i = 0; i < fireParts.length; i++) {
      for (let j = i + 1; j < fireParts.length; j++) {
        const fire1 = fireParts[i];
        const fire2 = fireParts[j];
        
        if (usedFires.includes(fire1) || usedFires.includes(fire2)) continue;
        
        const totalLength = fire1.length + fire2.length - weldTolerance;
        
        if (Math.abs(totalLength - targetLength) <= tolerance) {
          const ekPart = {
            position: `EK${ekParts.length + 1}`,
            targetLength: targetLength,
            actualLength: totalLength,
            tolerance: totalLength - targetLength,
            parts: [fire1, fire2],
            method: 'double'
          };
          
          ekParts.push(ekPart);
          usedFires.push(fire1, fire2);
          
          console.log(`  🔗 EK${ekParts.length}: ${fire1.length}mm + ${fire2.length}mm = ${totalLength}mm (hedef: ${targetLength}mm)`);
          return; // Bu uzunluk için bir tane yeter
        }
      }
    }
    
    // Üç parça kombinasyonu
    for (let i = 0; i < fireParts.length; i++) {
      for (let j = i + 1; j < fireParts.length; j++) {
        for (let k = j + 1; k < fireParts.length; k++) {
          const fire1 = fireParts[i];
          const fire2 = fireParts[j];
          const fire3 = fireParts[k];
          
          if (usedFires.includes(fire1) || usedFires.includes(fire2) || usedFires.includes(fire3)) continue;
          
          const totalLength = fire1.length + fire2.length + fire3.length - (weldTolerance * 2);
          
          if (Math.abs(totalLength - targetLength) <= tolerance) {
            const ekPart = {
              position: `EK${ekParts.length + 1}`,
              targetLength: targetLength,
              actualLength: totalLength,
              tolerance: totalLength - targetLength,
              parts: [fire1, fire2, fire3],
              method: 'triple'
            };
            
            ekParts.push(ekPart);
            usedFires.push(fire1, fire2, fire3);
            
            console.log(`  🔗🔗 EK${ekParts.length}: ${fire1.length}mm + ${fire2.length}mm + ${fire3.length}mm = ${totalLength}mm (hedef: ${targetLength}mm)`);
            return; // Bu uzunluk için bir tane yeter
          }
        }
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
   * EK parçalar özetini logla
   */
  logEkPartsSummary(ekParts) {
    if (ekParts.length === 0) return;
    
    console.log('\n📊 EK PARÇA ÖZETİ:');
    ekParts.forEach(ek => {
      const partsStr = ek.parts.map(p => `${p.length}mm`).join(' + ');
      console.log(`  ${ek.position}: ${partsStr} = ${ek.actualLength}mm (${ek.method})`);
    });
  }
}