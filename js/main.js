/**
 * Ana uygulama mantığı
 */
document.addEventListener('DOMContentLoaded', function() {
  // Sınıfları başlat
  const stockLength = parseInt(document.getElementById('stock-length').value, 10) || 12000;
  const weldTolerance = parseInt(document.getElementById('weld-tolerance').value, 10) || 10;
  const minFireLength = parseInt(document.getElementById('min-fire').value, 10) || 100;
  
  const optimizer = new CuttingOptimizer(stockLength, weldTolerance, minFireLength);
  const visualizer = new Visualizer(stockLength);
  
  // DOM elementleri
  const posInput = document.getElementById('pos-input');
  const lengthInput = document.getElementById('length-input');
  const quantityInput = document.getElementById('quantity-input');
  const addPartBtn = document.getElementById('add-part-btn');
  const partsList = document.getElementById('parts-list');
  const clearPartsBtn = document.getElementById('clear-parts-btn');
  const calculateBtn = document.getElementById('calculate-btn');
  const stockLengthInput = document.getElementById('stock-length');
  const weldToleranceInput = document.getElementById('weld-tolerance');
  const minFireInput = document.getElementById('min-fire');
  
  // Bulk input elements
  const singleModeBtn = document.getElementById('single-mode-btn');
  const bulkModeBtn = document.getElementById('bulk-mode-btn');
  const singleInputMode = document.getElementById('single-input-mode');
  const bulkInputMode = document.getElementById('bulk-input-mode');
  const bulkInputTextarea = document.getElementById('bulk-input-textarea');
  const parseBulkBtn = document.getElementById('parse-bulk-btn');
  const clearBulkBtn = document.getElementById('clear-bulk-btn');
  
  // Mevcut parça listesi
  let currentParts = [];
  
  /**
   * Input mode değiştir
   */
  function switchInputMode(mode) {
    if (mode === 'single') {
      singleModeBtn.classList.add('active');
      bulkModeBtn.classList.remove('active');
      singleInputMode.classList.remove('hidden');
      bulkInputMode.classList.add('hidden');
    } else {
      singleModeBtn.classList.remove('active');
      bulkModeBtn.classList.add('active');
      singleInputMode.classList.add('hidden');
      bulkInputMode.classList.remove('hidden');
    }
  }
  
  /**
   * Toplu veri girişini parse et
   */
  function parseBulkInput() {
    const input = bulkInputTextarea.value.trim();
    if (!input) {
      alert('Lütfen parça bilgilerini girin');
      return;
    }
    
    const lines = input.split('\n').filter(line => line.trim());
    const newParts = [];
    const errors = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Format: PozNo Uzunluk Adet
      const parts = trimmedLine.split(/\s+/);
      
      if (parts.length < 2 || parts.length > 3) {
        errors.push(`Satır ${index + 1}: Geçersiz format "${trimmedLine}"`);
        return;
      }
      
      const position = parts[0];
      const length = parseInt(parts[1], 10);
      const quantity = parts.length === 3 ? parseInt(parts[2], 10) : 1;
      
      // Validasyon
      if (!position || position.length === 0) {
        errors.push(`Satır ${index + 1}: Geçersiz poz no "${position}"`);
        return;
      }
      
      if (isNaN(length) || length <= 0) {
        errors.push(`Satır ${index + 1}: Geçersiz uzunluk "${parts[1]}"`);
        return;
      }
      
      if (isNaN(quantity) || quantity <= 0) {
        errors.push(`Satır ${index + 1}: Geçersiz adet "${parts[2] || '1'}"`);
        return;
      }
      
      // Aynı poz kontrolü (mevcut listede)
      if (currentParts.some(p => p.position === position)) {
        errors.push(`Satır ${index + 1}: "${position}" poz numarası zaten mevcut`);
        return;
      }
      
      // Aynı poz kontrolü (yeni parçalarda)
      if (newParts.some(p => p.position === position)) {
        errors.push(`Satır ${index + 1}: "${position}" poz numarası tekrar ediyor`);
        return;
      }
      
      newParts.push({
        position,
        length,
        quantity
      });
    });
    
    // Hataları göster
    if (errors.length > 0) {
      alert('Aşağıdaki hatalar bulundu:\n\n' + errors.join('\n'));
      return;
    }
    
    if (newParts.length === 0) {
      alert('Geçerli parça bulunamadı');
      return;
    }
    
    // Parçaları ekle
    currentParts.push(...newParts);
    
    // Parçaları poz numarasına göre sırala
    currentParts.sort((a, b) => {
      // Numerik kısmı çıkar ve karşılaştır
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
    
    // Arayüzü güncelle
    updatePartsList();
    
    // Textarea'yı temizle
    bulkInputTextarea.value = '';
    
    // Başarı mesajı
    alert(`${newParts.length} parça başarıyla eklendi!`);
    
    // Tekli girişe geç
    switchInputMode('single');
  }
  
  /**
   * Listeye parça ekle (tekli)
   */
  function addPart() {
    const pos = posInput.value.trim();
    const length = parseInt(lengthInput.value, 10);
    const quantity = parseInt(quantityInput.value, 10) || 1;
    
    if (!pos || !length || length <= 0) {
      alert('Lütfen geçerli poz no ve uzunluk değerleri girin');
      return;
    }
    
    // Aynı poz numarası kontrolü
    if (currentParts.some(p => p.position === pos)) {
      alert('Bu poz numarası zaten mevcut');
      return;
    }
    
    currentParts.push({
      position: pos,
      length: length,
      quantity: quantity
    });
    
    // Parçaları poz numarasına göre sırala
    currentParts.sort((a, b) => {
      // Numerik kısmı çıkar ve karşılaştır
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
    
    // Arayüzü güncelle
    updatePartsList();
    
    // Girdileri temizle
    posInput.value = '';
    lengthInput.value = '';
    quantityInput.value = '1';
    posInput.focus();
  }
  
  /**
   * Parça listesi arayüzünü güncelle
   */
  function updatePartsList() {
    partsList.innerHTML = '';
    
    if (currentParts.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.textContent = 'Henüz parça eklenmedi';
      emptyItem.className = 'empty-list';
      partsList.appendChild(emptyItem);
      return;
    }
    
    currentParts.forEach((part, index) => {
      const listItem = document.createElement('li');
      listItem.className = 'part-item';
      
      const posSpan = document.createElement('span');
      posSpan.textContent = part.position;
      
      const lengthSpan = document.createElement('span');
      lengthSpan.textContent = formatLength(part.length);
      
      const quantitySpan = document.createElement('span');
      quantitySpan.textContent = part.quantity;
      
      const actions = document.createElement('span');
      actions.className = 'part-actions';
      
      const editBtn = document.createElement('button');
      editBtn.innerHTML = '✏️';
      editBtn.title = 'Düzenle';
      editBtn.onclick = () => editPart(index);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '❌';
      deleteBtn.title = 'Sil';
      deleteBtn.onclick = () => removePart(index);
      
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      
      listItem.appendChild(posSpan);
      listItem.appendChild(lengthSpan);
      listItem.appendChild(quantitySpan);
      listItem.appendChild(actions);
      
      partsList.appendChild(listItem);
    });
  }
  
  /**
   * Parça düzenle
   */
  function editPart(index) {
    const part = currentParts[index];
    
    // Tekli girişe geç
    switchInputMode('single');
    
    posInput.value = part.position;
    lengthInput.value = part.length;
    quantityInput.value = part.quantity;
    removePart(index);
  }
  
  /**
   * Parçayı listeden kaldır
   */
  function removePart(index) {
    currentParts.splice(index, 1);
    updatePartsList();
  }
  
  /**
   * Tüm parçaları temizle
   */
  function clearParts() {
    currentParts = [];
    updatePartsList();
  }
  
  /**
   * Optimum kesim düzenini hesapla
   */
  function calculateOptimalCuts() {
    if (currentParts.length === 0) {
      alert('Lütfen önce parça ekleyin');
      return;
    }
    
    // Mevcut ayarları al
    const stockLength = parseInt(stockLengthInput.value, 10);
    const weldTolerance = parseInt(weldToleranceInput.value, 10);
    const minFireLength = parseInt(minFireInput.value, 10);
    
    // Optimizer ve visualizer'ı güncel ayarlarla güncelle
    optimizer.setStockLength(stockLength);
    optimizer.setWeldTolerance(weldTolerance);
    optimizer.setMinFireLength(minFireLength);
    visualizer.setStockLength(stockLength);
    
    // Optimizasyonu çalıştır
    const results = optimizer.optimize(currentParts);
    
    // Sonuçları göster
    visualizer.displayResults(results);
    
    // Sonuçlara kaydır
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
  }
  
  // Mode toggle event listeners
  singleModeBtn.addEventListener('click', () => switchInputMode('single'));
  bulkModeBtn.addEventListener('click', () => switchInputMode('bulk'));
  
  // Bulk input event listeners
  parseBulkBtn.addEventListener('click', parseBulkInput);
  clearBulkBtn.addEventListener('click', () => {
    bulkInputTextarea.value = '';
  });
  
  // Bulk textarea enter key handling
  bulkInputTextarea.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      parseBulkInput();
    }
  });
  
  // Hızlı uzunluk butonları
  document.querySelectorAll('.quick-buttons button').forEach(button => {
    button.addEventListener('click', () => {
      lengthInput.value = button.dataset.length;
    });
  });
  
  // Olay dinleyicileri
  addPartBtn.addEventListener('click', addPart);
  
  [posInput, lengthInput, quantityInput].forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addPart();
      }
    });
  });
  
  clearPartsBtn.addEventListener('click', clearParts);
  calculateBtn.addEventListener('click', calculateOptimalCuts);
  
  // Ayar doğrulamaları
  stockLengthInput.addEventListener('change', function() {
    const value = parseInt(this.value, 10);
    if (value < 1000) {
      alert('Stok profil uzunluğu en az 1000mm olmalıdır');
      this.value = 12000;
    }
  });
  
  weldToleranceInput.addEventListener('change', function() {
    const value = parseInt(this.value, 10);
    if (value < 0) {
      alert('Kaynak toleransı negatif olamaz');
      this.value = 10;
    }
  });
  
  minFireInput.addEventListener('change', function() {
    const value = parseInt(this.value, 10);
    if (value < 50) {
      alert('Minimum fire uzunluğu en az 50mm olmalıdır');
      this.value = 100;
    }
  });
  
  // Parça listesini başlat
  updatePartsList();
});