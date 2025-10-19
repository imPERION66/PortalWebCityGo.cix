/* ====== Funcionalidad avanzada para Contacto / Reportes (foto + geolocalización + validación por ZONAS de Chiclayo) ====== */
(function(){
  // === Normalizadores y helpers internos ===
  function normalizeText(s){ return (s||'').toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function capitalize(s){ if(!s) return s; s = s.toString(); return s.charAt(0).toUpperCase()+s.slice(1); }

  // === CONFIGURACIÓN DE CONTACTO ===
  const WHATSAPP_NUMBER = "974748536"; // Número de City Go
  const INITIAL_MESSAGE = "Hola City Go, necesito:\n\n1. Enviar una sugerencia o idea\n2. Realizar una consulta general\n3. Otro motivo";
  
  function makeWhatsappLink(text){
      return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  // === Variables para la navegación (sidebar) ===
  const sidebar = document.getElementById('sidebar');
  const openSidebarBtn = document.getElementById('openSidebar');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const sidebarNavLinks = document.querySelectorAll('#sidebar .sidebar-nav a');

  // === Variables de contacto ===
  const whatsappTop = document.getElementById("whatsappTop");
  const whatsappSidebar = document.getElementById("whatsappSidebar");
  const floatingWhatsappBtn = document.getElementById("floatingWhatsappBtn");

  // === Inicializar Enlaces de WhatsApp ===
  if (whatsappTop) whatsappTop.href = makeWhatsappLink(INITIAL_MESSAGE);
  if (whatsappSidebar) whatsappSidebar.href = makeWhatsappLink(INITIAL_MESSAGE);
  // <<< AÑADE ESTA LÍNEA >>>
  if (floatingWhatsappBtn) floatingWhatsappBtn.href = makeWhatsappLink(INITIAL_MESSAGE);

  // === Estructura de ZONAS de Chiclayo (normalizada) ===
  const ZONAS_CHICLAYO = {
    "cercado": [
      "urb santa elena","rsd jose balta","urb los precursores","urb salaverry","urb los libertadores","pj jose olaya","lotizacion patazca",
      "pj jose olaya","urb felipe salaverry","pj 9 de octubre","pj elias aguirre (parte ii)","upis senor de los milagros","upis las americas",
      "pj el molino","pj jesus nazareno","urb ana de los angeles","urb santa angela","aahh la punta","urb polifap i","urb carmen angelica",
      "urb san felipe","urb villa el salvador","pj san nicolas","pastor boggiano","urb san borja","urb los bancarios","pj ricardo palma",
      "pj tupac amaru","urb la primavera i","urb cuneo salazar","urb patazca","pj el porvenir","pj la primavera ii","urb los rosales",
      "urb san luis","pj el porvenir","upis cois","exasilo","mercado modelo","cercado","urb san juan","pj san martin","pj san francisco",
      "pj buenos aires","pj chino","pj zamora","urb los parques","urb chiclayo"
    ].map(normalizeText),

    "este": [
      "pj jose balta","urb san martin","urb campodonico","pj suazo","pj lopez albujar","pj nuevo campodonico","pj san antonio",
      "upis cesar vallejo","pj vina del mar","hab pro viv nuevo mundo","urb prog sagrado corazon de jesus","urb progresiva uchofen",
      "urb santo toribio","urb pop el obrero","amp san antonio","pj puente blanco","pj san guillermo","pj jorge chavez",
      "pj fanny abanto calle","upis santa elena","pj ramiro priale","aa.hh san geroniom","aa.hh san francisco","aeropuerto adp fap",
      "pj villa el progreso","pj miraflores","pj las vegas","urb california","anexo saman","pj muro","pj diego ferre","upis ciro alegria",
      "urb san eduardo","urb federico villarreal","urb santa victoria","urb arturo cabrejos falla"
    ].map(normalizeText),

    "oeste": [
      "upis 19 de setiembre","upis adriano baca burga","pj san jose obrero","upis cruz del perdon","pj mariategui","pj elias aguirre i",
      "urb derrama magisterial","urb la parada","urb santa ana","urb el carmen","urb el ingeniero ii","urb cruz de chalpon","urb san lorenzo",
      "urb santa maria","pj luis heysen","pj santa rosa","pj primavera (parte i)","ch augusto b leguia","urb san isidro","urb miraflores i y ii",
      "urb primavera ii - v","pj tupac amaru (amp.)","urb la florida","urb el amauta","urb los pinos de la plata","urb los jazmines",
      "urb la florida i","urb la florida ii","urb los robles","urb alcides carrion","urb cafe peru","urb las delicias","urb corazon de jesus",
      "upis hipolito unanue","urb los jardines de santa rosa","urb villa del norte","urb la purisima","urb las palmas","urb el santuario",
      "urb san julio","aa.hh virgen de la paz","urb san miguel","aa.hh 9 de octubre","amp cruz del perdon","upis los olivos","urb el paraiso",
      "urb las brisas","urb santa alejandrina","urb 3 de octubre","upis fernando belaunde","urb los mochicas","urb el ingeniero","urb santa lila",
      "jorge basadre","jose quinones","urb remigio silva","pj vista alegre","pj simon bolivar","pj nueva esperanza","upis cruz de la esperanza",
      "las lomas","cerro el molino","aa.hh luis a sanchez","aa.hh 4 de noviembre","upis santo t de mogrovejo","rosa nelida castillo","urb ciudad del chofer"
    ].map(normalizeText)
  };

  // === DOM elements (asumimos que existen en tu HTML) ===
  const form = document.getElementById('reportForm');
  const nameEl = document.getElementById('name');
  const locationEl = document.getElementById('location');
  const descriptionEl = document.getElementById('description');
  const photoInput = document.getElementById('photoInput');
  const useCameraBtn = document.getElementById('useCameraBtn');
  const cameraPreview = document.getElementById('cameraPreview');
  const videoPreview = document.getElementById('videoPreview');
  const takePhotoBtn = document.getElementById('takePhotoBtn');
  const closeCameraBtn = document.getElementById('closeCameraBtn');
  const photoPreviewWrap = document.getElementById('photoPreviewWrap');
  const photoPreview = document.getElementById('photoPreview');
  const geoInfo = document.getElementById('geoInfo');
  const prepareBtn = document.getElementById('prepareBtn');
  const confirmSendBtn = document.getElementById('confirmSendBtn');
  const savedListEl = document.getElementById('savedList');

  // Modal elements (optional, si agregas el HTML del modal)
  const modal = document.getElementById('confirmModal');
  const modalSummary = document.getElementById('confirmModalSummary');
  const modalConfirmBtn = document.getElementById('confirmModalYes');
  const modalCancelBtn = document.getElementById('confirmModalNo');

  // Estado
  let currentPhotoDataUrl = null;
  let currentCoords = null;
  let currentAddress = null;
  let mediaStream = null;

  // === reverseGeocode (Nominatim) ===
  async function reverseGeocode(lat, lon){
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=es`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'CixGo-App/1.0 (contacto@cixgo.local)' }});
      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      return data;
    } catch(err){
      console.error('reverseGeocode error', err);
      return null;
    }
  }

  // === Detectar zona desde objeto address devuelto por Nominatim ===
  function detectZonaFromAddress(addrObj){
    if (!addrObj || !addrObj.raw) return null;
    const raw = addrObj.raw;
    const candidates = [
      raw.suburb, raw.neighbourhood, raw.road, raw.city, raw.county, raw.village, raw.hamlet, raw.municipality
    ].filter(Boolean).map(normalizeText);

    const displayTokens = (addrObj.display || '').split(',').map(t => normalizeText(t));
    const allCandidates = [...new Set([...candidates, ...displayTokens])];

    for (const zonaName of Object.keys(ZONAS_CHICLAYO)){
      const list = ZONAS_CHICLAYO[zonaName];
      for (const token of allCandidates){
        if (!token) continue;
        for (const item of list){
          if (token === item) return zonaName;
          if (token.includes(item) || item.includes(token)) return zonaName;
        }
      }
    }
    return null;
  }

  // === Intento de obtener ubicación y dirección (usado tras captura de foto) ===
  async function tryGetLocationAndAddress(){
    geoInfo.textContent = 'Obteniendo ubicación... (activa GPS)';
    currentCoords = null;
    currentAddress = null;

    if (!navigator.geolocation) {
      geoInfo.textContent = 'Geolocalización no soportada en este navegador.';
      return;
    }

    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy:true, timeout:10000, maximumAge:0 });
    }).catch(err => {
      console.warn('geo error', err);
      geoInfo.textContent = 'No se pudo obtener ubicación. Activa GPS y permite permisos.';
      return null;
    });

    if (!pos) return;

    currentCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy };
    const geo = await reverseGeocode(currentCoords.lat, currentCoords.lon);
    if (!geo || !geo.address) {
      geoInfo.textContent = `Coordenadas: ${currentCoords.lat.toFixed(6)}, ${currentCoords.lon.toFixed(6)} (no se obtuvo dirección)`;
      return;
    }

    const addr = geo.address;
    currentAddress = { display: geo.display_name || '', raw: addr };

    const detectedZone = detectZonaFromAddress(currentAddress);
    if (detectedZone) {
      currentAddress.detectedZona = detectedZone;
      geoInfo.textContent = `Zona detectada: ${capitalize(detectedZone)} — válida (Provincia de Chiclayo). Coordenadas: ${currentCoords.lat.toFixed(6)}, ${currentCoords.lon.toFixed(6)}`;
    } else {
      currentAddress.detectedZona = null;
      geoInfo.textContent = `Ubicación detectada fuera de las zonas listadas de Chiclayo. Dirección: ${currentAddress.display}`;
    }

    return currentAddress;
  }

  // === Manejo selección de archivo (input) ===
  if (photoInput) {
    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async function(evt){
        currentPhotoDataUrl = evt.target.result;
        if (photoPreview) photoPreview.src = currentPhotoDataUrl;
        if (photoPreviewWrap) photoPreviewWrap.style.display = 'block';
        await tryGetLocationAndAddress();
        updateConfirmState();
      };
      reader.readAsDataURL(file);
    });
  }

  // === getUserMedia preview buttons ===
  if (useCameraBtn) {
    useCameraBtn.addEventListener('click', async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta la cámara en vivo. Usa el botón para seleccionar foto.');
        return;
      }
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio:false });
        if (videoPreview) videoPreview.srcObject = mediaStream;
        if (cameraPreview) cameraPreview.style.display = 'block';
      } catch(err){
        console.error(err);
        alert('No se pudo acceder a la cámara. Verifica permisos.');
      }
    });
  }

  if (closeCameraBtn) {
    closeCameraBtn.addEventListener('click', () => {
      stopCamera();
      if (cameraPreview) cameraPreview.style.display = 'none';
    });
  }

  function stopCamera(){
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
      if (videoPreview) videoPreview.srcObject = null;
    }
  }

  if (takePhotoBtn) {
    takePhotoBtn.addEventListener('click', async () => {
      if (!mediaStream) return alert('La cámara no está activa.');
      const video = videoPreview;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      currentPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      if (photoPreview) photoPreview.src = currentPhotoDataUrl;
      if (photoPreviewWrap) photoPreviewWrap.style.display = 'block';
      stopCamera();
      if (cameraPreview) cameraPreview.style.display = 'none';
      await tryGetLocationAndAddress();
      updateConfirmState();
    });
  }

  // === Prepare / Confirm flow (abre modal bonito si existe; fallback confirm()) ===
  if (prepareBtn) {
    prepareBtn.addEventListener('click', async () => {
      if (!descriptionEl || !descriptionEl.value.trim()) { alert('La descripción es obligatoria.'); return; }
      if (!currentPhotoDataUrl) { alert('Debes tomar o seleccionar una foto antes de preparar el reporte.'); return; }

      if (!currentCoords || !currentAddress) {
        await tryGetLocationAndAddress();
        if (!currentCoords || !currentAddress) {
          alert('No se pudo obtener ubicación válida. Activa GPS y vuelve a intentar (asegúrate de permitir permisos).');
          return;
        }
      }

      if (!currentAddress.detectedZona) {
        alert('La foto no fue tomada dentro de una zona reconocida de Chiclayo. El reporte no será aceptado.');
        return;
      }

      // Preparar resumen
      const summary = `Nombre: ${nameEl && nameEl.value.trim() ? nameEl.value.trim() : 'Anónimo'}\nZona: ${capitalize(currentAddress.detectedZona)}\nCoordenadas: ${currentCoords.lat.toFixed(6)}, ${currentCoords.lon.toFixed(6)}\nDescripción: ${descriptionEl.value.trim()}`;

      // Si tienes modal en HTML lo mostramos, si no fallback a confirm()
      if (modal && modalSummary && modalConfirmBtn && modalCancelBtn) {
        modalSummary.textContent = summary;
        modal.classList.add('open');
      } else {
        // fallback
        if (!confirm(`Confirmar reporte:\n\n${summary}\n\n¿Deseas enviar y registrar este reporte?`)) return;
        await finalizeAndSend();
      }
    });
  }

  // Si modal existe, manejar botones del modal
  if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', async () => {
    await finalizeAndSend();
    if (modal) modal.classList.remove('open');
  });
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => {
    if (modal) modal.classList.remove('open');
  });

  // confirmSendBtn (botón extra) emula prepareBtn
  if (confirmSendBtn) confirmSendBtn.addEventListener('click', () => {
    if (prepareBtn) prepareBtn.click();
  });

  // === Función para finalizar: guardar reporte, abrir WhatsApp, agradecer, limpiar ===
  async function finalizeAndSend(){
    // construir texto de WhatsApp
    const text = `Reporte CixGo:\nZona: ${capitalize(currentAddress.detectedZona)}\nDirección (estimada): ${currentAddress.display}\nCoordenadas: ${currentCoords.lat.toFixed(6)}, ${currentCoords.lon.toFixed(6)}\nDescripción: ${descriptionEl.value.trim()}\nEnviado desde: CixGo PortalWeb`;

    // Guardar reporte completado (usa función existente si la hay, si no guarda en localStorage)
    const report = {
      id: Date.now(),
      name: nameEl && nameEl.value.trim() ? nameEl.value.trim() : '',
      locationText: locationEl && locationEl.value.trim() ? locationEl.value.trim() : '',
      description: descriptionEl.value.trim(),
      photo: currentPhotoDataUrl,
      coords: currentCoords,
      address: currentAddress,
      createdAt: new Date().toISOString()
    };

    try {
      if (typeof saveCompletedReport === 'function') {
        saveCompletedReport(report);
      } else {
        // fallback simple
        const arr = JSON.parse(localStorage.getItem('cixgo_reports') || '[]');
        arr.unshift(report);
        localStorage.setItem('cixgo_reports', JSON.stringify(arr));
      }
    } catch(e){
      console.error('save error', e);
    }

    // refresh lista
    if (typeof renderSaved === 'function') renderSaved();
    else renderSavedFallback();

    // abrir WhatsApp
    const wa = makeWhatsappLink ? makeWhatsappLink(text) : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, '_blank');

    // agradecer al usuario (si tienes modal de gracias puedes usarlo; aquí uso alert como refuerzo)
    if (typeof flash === 'function') flash('Gracias por contribuir — CixGo a su servicio.');
    else alert('Gracias por contribuir — cuidar nuestra ciudad es tarea de todos. CixGo a su servicio.');

    // reset form
    if (typeof resetReportForm === 'function') resetReportForm();
    else resetFormFallback();
  }

  // === util: renderSaved fallback (si no tienes renderSaved existente) ===
  function renderSavedFallback(){
    const arr = JSON.parse(localStorage.getItem('cixgo_reports') || '[]');
    if (!savedListEl) return;
    if (!arr.length) { savedListEl.innerHTML = `<p class="muted">No hay reportes completados.</p>`; return; }
    savedListEl.innerHTML = arr.map(r => {
      return `<div class="saved-item">
        <div>
          <strong>${escapeHtml(r.address && r.address.detectedZona ? capitalize(r.address.detectedZona) : escapeHtml(r.locationText || 'Sin zona'))}</strong>
          <div class="meta">${new Date(r.createdAt).toLocaleString()} · ${escapeHtml(r.name || "Anónimo")}</div>
          <p>${escapeHtml(r.description)}</p>
          <div style="margin-top:8px;"><img src="${r.photo}" alt="foto reporte" style="max-width:220px;border-radius:8px"></div>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
          <button onclick="window.openWhatsAppWithReport(${r.id})" class="btn outline" style="white-space:nowrap">Reenviar</button>
          <button onclick="confirmDelete(${r.id})" class="btn" style="background:#e05b4f;color:#fff">Eliminar</button>
        </div>
      </div>`;
    }).join('');
  }

  // === util: reset fallback ===
  function resetFormFallback(){
    if (nameEl) nameEl.value = '';
    if (locationEl) locationEl.value = '';
    if (descriptionEl) descriptionEl.value = '';
    if (photoInput) photoInput.value = '';
    currentPhotoDataUrl = null;
    currentCoords = null;
    currentAddress = null;
    if (photoPreviewWrap) photoPreviewWrap.style.display = 'none';
    if (geoInfo) geoInfo.textContent = '';
    updateConfirmState();
  }

  // === updateConfirmState ===
  function updateConfirmState(){
    if (confirmSendBtn) {
      confirmSendBtn.disabled = !(currentPhotoDataUrl && currentCoords && currentAddress && currentAddress.detectedZona);
    }
  }

  // expose confirmDelete global (si no está)
  window.confirmDelete = window.confirmDelete || function(id){
    if (!confirm('¿Eliminar este reporte guardado? Esta acción no se puede deshacer.')) return;
    let arr = JSON.parse(localStorage.getItem('cixgo_reports') || '[]');
    arr = arr.filter(x => x.id !== id);
    localStorage.setItem('cixgo_reports', JSON.stringify(arr));
    if (typeof renderSaved === 'function') renderSaved();
    else renderSavedFallback();
    if (typeof flash === 'function') flash('Reporte eliminado');
    else alert('Reporte eliminado');
  };

  // === Funcionalidad del Sidebar (Mobile/Tablet) ===
  if (openSidebarBtn && sidebar) {
    openSidebarBtn.addEventListener('click', () => {
      sidebar.classList.add('show');
      document.body.style.overflow = 'hidden'; // Evita el scroll del cuerpo detrás del overlay
    });
  }

  if (closeSidebarBtn && sidebar) {
    closeSidebarBtn.addEventListener('click', () => {
      sidebar.classList.remove('show');
      document.body.style.overflow = ''; // Restaura el scroll del cuerpo
    });
  }

  // Cerrar sidebar al hacer clic en un enlace de navegación
  if (sidebarNavLinks) {
    sidebarNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('show');
        document.body.style.overflow = '';
      });
    });
  }

  // initial render
  if (typeof renderSaved === 'function') renderSaved();
  else renderSavedFallback();

})();





