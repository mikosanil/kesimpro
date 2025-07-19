/**
 * Fire parça yönetim sınıfı
 */
class FireManager {
  constructor() {
    this.minFireLength = 100; // Minimum fire uzunluğu
    this.weldTolerance = 10;   // Kaynak toleransı
  }
  
  /**
   * Kesimlerden fire parçaları topla
   */
  collectFireParts(stockBars) {
    const firePieces = [];
    
    stockBars.forEach((bar, index) => {
      if (bar.remainingLength >= this.minFireLength) {
        firePieces.push({
          name: `F${index + 1}`,
          length: bar.remainingLength,
          stockBarIndex: index,
          source: `Profil-${bar.id}`
        });
      }
    });
    
    // Fire parçaları uzunluğa göre sırala (büyükten küçüğe)
    firePieces.sort((a, b) => b.length - a.length);
    
    console.log(`🔥 ${firePieces.length} adet fire parça toplandı`);
    return firePieces;
  }
  
  /**
   * Fire parçalardan kaynaklı parçalar oluştur
   */
  createWeldedParts(firePieces, originalParts) {
    console.log('\n🔧 KAYNAKLI PARÇA OLUŞTURMA BAŞLIYOR...');
    
    if (firePieces.length === 0) {
      console.log('❌ Kaynaklı parça oluşturmak için yeterli fire yok');
      return [];
    }
    
    const weldedParts = [];
    const usedFires = [];
    
    // Benzersiz parça uzunluklarını al
    const uniqueLengths = [...new Set(originalParts.map(p => p.length))];
    uniqueLengths.sort((a, b) => b - a); // Büyükten küçüğe sırala
    
    // Her benzersiz uzunluk için kaynaklı parça oluşturmaya çalış
    uniqueLengths.forEach(targetLength => {
      this.createWeldedPartsForLength(firePieces, targetLength, weldedParts, usedFires);
    });
    
    // Genel amaçlı EK parçalar oluştur
    this.createGeneralEkParts(firePieces, weldedParts, usedFires);
    
    console.log(`✅ ${weldedParts.length} adet kaynaklı parça oluşturuldu`);
    return weldedParts;
  }
  
  /**
   * Belirli uzunluk için kaynaklı parçalar oluştur
   */
  createWeldedPartsForLength(firePieces, targetLength, weldedParts, usedFires) {
    const tolerance = this.calculateTolerance(targetLength);
    
    // İki parça kombinasyonu
    for (let i = 0; i < firePieces.length; i++) {
      for (let j = i + 1; j < firePieces.length; j++) {
        const fire1 = firePieces[i];
        const fire2 = firePieces[j];
        
        if (usedFires.includes(fire1) || usedFires.includes(fire2)) continue;
        
        const totalLength = fire1.length + fire2.length - this.weldTolerance;
        
        if (Math.abs(totalLength - targetLength) <= tolerance) {
          const weldedPart = {
            position: `${this.getPositionForLength(targetLength)}-W${weldedParts.length + 1}`,
            targetLength: targetLength,
            actualLength: totalLength,
            tolerance: Math.abs(totalLength - targetLength),
            pieces: [
              { name: fire1.name, length: fire1.length },
              { name: fire2.name, length: fire2.length }
            ]
          };
          
          weldedParts.push(weldedPart);
          usedFires.push(fire1, fire2);
          
          console.log(`  🔗 ${weldedPart.position}: ${fire1.length}mm + ${fire2.length}mm = ${totalLength}mm (hedef: ${targetLength}mm)`);
          return; // Bu uzunluk için bir tane yeter
        }
      }
    }
    
    // Üç parça kombinasyonu (büyük parçalar için)
    if (targetLength > 6000) {
      for (let i = 0; i < firePieces.length; i++) {
        for (let j = i + 1; j < firePieces.length; j++) {
          for (let k = j + 1; k < firePieces.length; k++) {
            const fire1 = firePieces[i];
            const fire2 = firePieces[j];
            const fire3 = firePieces[k];
            
            if (usedFires.includes(fire1) || usedFires.includes(fire2) || usedFires.includes(fire3)) continue;
            
            const totalLength = fire1.length + fire2.length + fire3.length - (this.weldTolerance * 2);
            
            if (Math.abs(totalLength - targetLength) <= tolerance) {
              const weldedPart = {
                position: `${this.getPositionForLength(targetLength)}-W${weldedParts.length + 1}`,
                targetLength: targetLength,
                actualLength: totalLength,
                tolerance: Math.abs(totalLength - targetLength),
                pieces: [
                  { name: fire1.name, length: fire1.length },
                  { name: fire2.name, length: fire2.length },
                  { name: fire3.name, length: fire3.length }
                ]
              };
              
              weldedParts.push(weldedPart);
              usedFires.push(fire1, fire2, fire3);
              
              console.log(`  🔗🔗 ${weldedPart.position}: ${fire1.length}mm + ${fire2.length}mm + ${fire3.length}mm = ${totalLength}mm (hedef: ${targetLength}mm)`);
              return; // Bu uzunluk için bir tane yeter
            }
          }
        }
      }
    }
  }
  
  /**
   * Genel amaçlı EK parçalar oluştur
   */
  createGeneralEkParts(firePieces, weldedParts, usedFires) {
    const standardLengths = [9000, 7500, 6000, 4500, 4000, 3500, 3000, 2500, 2000, 1500, 1000];
    
    standardLengths.forEach(targetLength => {
      const tolerance = this.calculateTolerance(targetLength);
      
      // İki parça kombinasyonu
      for (let i = 0; i < firePieces.length; i++) {
        for (let j = i + 1; j < firePieces.length; j++) {
          const fire1 = firePieces[i];
          const fire2 = firePieces[j];
          
          if (usedFires.includes(fire1) || usedFires.includes(fire2)) continue;
          
          const totalLength = fire1.length + fire2.length - this.weldTolerance;
          
          if (Math.abs(totalLength - targetLength) <= tolerance) {
            const ekPart = {
              position: `EK${weldedParts.length + 1}`,
              targetLength: targetLength,
              actualLength: totalLength,
              tolerance: Math.abs(totalLength - targetLength),
              pieces: [
                { name: fire1.name, length: fire1.length },
                { name: fire2.name, length: fire2.length }
              ]
            };
            
            weldedParts.push(ekPart);
            usedFires.push(fire1, fire2);
            
            console.log(`  🔗 ${ekPart.position}: ${fire1.length}mm + ${fire2.length}mm = ${totalLength}mm (hedef: ${targetLength}mm)`);
            return; // Bu uzunluk için bir tane yeter
          }
        }
      }
    });
  }
  
  /**
   * Uzunluğa göre pozisyon adı oluştur
   */
  getPositionForLength(length) {
    if (length >= 9000) return 'L';
    if (length >= 6000) return 'M';
    if (length >= 3000) return 'S';
    return 'XS';
  }
  
  /**
   * Tolerans hesapla
   */
  calculateTolerance(length) {
    if (length <= 1000) return 50;   // 50mm tolerans
    if (length <= 3000) return 100;  // 100mm tolerans
    if (length <= 6000) return 150;  // 150mm tolerans
    return 200; // 200mm tolerans
  }
}