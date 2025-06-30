// --- DATABASE (IndexedDB) SETUP ---
let db;
const DB_NAME = 'GestionProDB';
const NOVEDADES_STORE = 'novedades';
const CONSIGNAS_STORE = 'consignas';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(NOVEDADES_STORE)) {
                db.createObjectStore(NOVEDADES_STORE, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(CONSIGNAS_STORE)) {
                db.createObjectStore(CONSIGNAS_STORE, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database initialized successfully');
            resolve();
        };

        request.onerror = (event) => {
            console.error('Database error:', event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

function dbAction(storeName, mode, action) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error("DB not initialized");
            return reject(new Error("DB not initialized"));
        }
        
        try {
            const transaction = db.transaction(storeName, mode);
            
            transaction.onerror = (event) => {
                console.error(`Transaction error for ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
            
            transaction.onabort = (event) => {
                console.error(`Transaction aborted for ${storeName}:`, event.target.error);
                reject(new Error("Transaction aborted"));
            };
            
            const store = transaction.objectStore(storeName);
            action(store, resolve, reject, transaction);
        } catch (error) {
            console.error(`Error creating transaction for ${storeName}:`, error);
            reject(error);
        }
    });
}

const dbManager = {
    add: (storeName, item) => {
        console.log(`Adding item to ${storeName}:`, item);
        return dbAction(storeName, 'readwrite', (store, resolve, reject) => {
            const request = store.add(item);
            request.onsuccess = (event) => {
                console.log(`Item added successfully to ${storeName} with ID:`, event.target.result);
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                console.error(`Error adding item to ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        });
    },
    
    getAll: (storeName) => {
        console.log(`Getting all items from ${storeName}`);
        return dbAction(storeName, 'readonly', (store, resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = (event) => {
                const result = event.target.result;
                console.log(`Retrieved ${result.length} items from ${storeName}`);
                resolve(result);
            };
            request.onerror = (event) => {
                console.error(`Error getting items from ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        });
    },
    
    update: (storeName, item) => {
        console.log(`Updating item in ${storeName}:`, item);
        return dbAction(storeName, 'readwrite', (store, resolve, reject) => {
            const request = store.put(item);
            request.onsuccess = (event) => {
                console.log(`Item updated successfully in ${storeName}`);
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                console.error(`Error updating item in ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        });
    },
    
    delete: (storeName, id) => {
        console.log(`Deleting item with ID ${id} from ${storeName}`);
        return dbAction(storeName, 'readwrite', (store, resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = (event) => {
                console.log(`Item deleted successfully from ${storeName}`);
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                console.error(`Error deleting item from ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        });
    },
    
    // Nueva función para obtener un elemento específico
    get: (storeName, id) => {
        console.log(`Getting item with ID ${id} from ${storeName}`);
        return dbAction(storeName, 'readonly', (store, resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = (event) => {
                const result = event.target.result;
                console.log(`Retrieved item from ${storeName}:`, result);
                resolve(result);
            };
            request.onerror = (event) => {
                console.error(`Error getting item from ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        });
    }
};


// --- UI & APP LOGIC ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing application...');
        await initDB();
        console.log('Database initialized, loading data...');
        
        // Load initial data with filters
        await filterAndRenderNovedades();
        await filterAndRenderConsignas();

        // Setup event listeners
        setupEventListeners();

        // Notifications
        checkAndRequestNotificationPermission();
        setInterval(sendPendingTaskReminders, 60 * 60 * 1000); // Check for reminders every hour
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Error al inicializar la aplicación. Por favor, recarga la página.');
    }
});

function setupEventListeners() {
    // Form submissions
    document.getElementById('novedad-form').addEventListener('submit', handleNovedadSubmit);
    document.getElementById('consigna-form').addEventListener('submit', handleConsignaSubmit);

    // Modal closing
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });

    // Filter event listeners
    document.getElementById('novedad-search').addEventListener('input', filterAndRenderNovedades);
    document.getElementById('novedad-filter-prioridad').addEventListener('change', filterAndRenderNovedades);
    document.getElementById('novedad-filter-estado').addEventListener('change', filterAndRenderNovedades);
    
    document.getElementById('consigna-search').addEventListener('input', filterAndRenderConsignas);
    document.getElementById('consigna-filter-estado').addEventListener('change', filterAndRenderConsignas);

    // Export button
    document.getElementById('export-all-btn').addEventListener('click', exportAllDataToCSV);
}

// --- NOTIFICATIONS ---
function checkAndRequestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
        console.log("Notification permission already granted.");
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted.");
                new Notification("¡Notificaciones activadas!", {
                    body: "Recibirás recordatorios de tareas importantes.",
                    icon: "✅"
                });
            }
        });
    }
}

function sendNotification(title, options) {
    if (Notification.permission === "granted") {
        new Notification(title, options);
    }
}

async function sendPendingTaskReminders() {
    const novedades = await dbManager.getAll(NOVEDADES_STORE);
    const pendingHighPriority = novedades.filter(n => n.prioridad === 'Alta' && !n.completed);

    if (pendingHighPriority.length > 0) {
        sendNotification("Recordatorio de Tareas Pendientes", {
            body: `Tienes ${pendingHighPriority.length} novedad(es) de alta prioridad sin completar.`,
            icon: "📝"
        });
    }
}


// --- NOVEDADES ---
async function filterAndRenderNovedades() {
    try {
        console.log('Loading novedades...');
        const novedades = await dbManager.getAll(NOVEDADES_STORE);
        const container = document.getElementById('novedades-container');
        container.innerHTML = '';

        // Get filter values
        const searchTerm = document.getElementById('novedad-search').value.toLowerCase();
        const priorityFilter = document.getElementById('novedad-filter-prioridad').value;
        const statusFilter = document.getElementById('novedad-filter-estado').value;

        const filteredNovedades = novedades.filter(item => {
            const matchesSearch = item.descripcion.toLowerCase().includes(searchTerm) || item.responsable.toLowerCase().includes(searchTerm);
            const matchesPriority = !priorityFilter || item.prioridad === priorityFilter;
            const matchesStatus = statusFilter === "" || String(item.completed) === statusFilter;
            return matchesSearch && matchesPriority && matchesStatus;
        });

        if (filteredNovedades.length === 0) {
            container.innerHTML = '<p>No se encontraron novedades que coincidan con los filtros.</p>';
            return;
        }
        filteredNovedades.forEach(item => container.appendChild(createNovedadCard(item)));
        console.log(`Rendered ${filteredNovedades.length} novedades`);
    } catch (error) {
        console.error('Error loading novedades:', error);
        const container = document.getElementById('novedades-container');
        container.innerHTML = '<p>Error al cargar las novedades. Por favor, recarga la página.</p>';
    }
}

function createNovedadCard(novedad) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = novedad.id;
    card.dataset.completed = novedad.completed || false;
    const today = new Date().toLocaleDateString();
    const itemDate = new Date(novedad.date).toLocaleDateString();
    const completionDate = novedad.completed && novedad.completionDate ? new Date(novedad.completionDate).toLocaleString('es-ES') : '';

    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${novedad.descripcion}</h3>
            <span class="priority-badge priority-${novedad.prioridad}">${novedad.prioridad}</span>
        </div>
        <p class="card-description">${novedad.observaciones || ''}</p>
        <div class="card-meta">
            <span>👤 ${novedad.responsable}</span>
            <span>🕐 ${novedad.horaInicio}</span>
            <span>📅 Creación: ${today === itemDate ? 'Hoy' : itemDate}</span>
            ${completionDate ? `<span>✅ Finalización: ${completionDate}</span>` : ''}
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary btn-edit">✏️ Editar</button>
            <button class="btn btn-danger btn-delete">🗑️ Eliminar</button>
            <button class="btn btn-primary btn-complete">${novedad.completed ? '✓ Completada' : 'Marcar como completada'}</button>
        </div>
    `;

    card.querySelector('.btn-edit').addEventListener('click', () => openNovedadModal(novedad));
    card.querySelector('.btn-delete').addEventListener('click', () => confirmDelete(NOVEDADES_STORE, novedad.id, filterAndRenderNovedades));
    card.querySelector('.btn-complete').addEventListener('click', () => toggleNovedadComplete(novedad));

    return card;
}

function openNovedadModal(novedad = null) {
    const modal = document.getElementById('novedad-modal');
    const form = document.getElementById('novedad-form');
    form.reset();

    if (novedad) {
        document.getElementById('novedad-modal-title').textContent = 'Editar Novedad';
        document.getElementById('novedad-id').value = novedad.id;
        document.getElementById('novedad-descripcion').value = novedad.descripcion;
        document.getElementById('novedad-responsable').value = novedad.responsable;
        document.getElementById('novedad-hora-inicio').value = novedad.horaInicio;
        document.getElementById('novedad-prioridad').value = novedad.prioridad;
        document.getElementById('novedad-observaciones').value = novedad.observaciones;
    } else {
        document.getElementById('novedad-modal-title').textContent = 'Nueva Novedad';
        document.getElementById('novedad-id').value = '';
    }
    modal.classList.add('active');
}

async function handleNovedadSubmit(event) {
    event.preventDefault();
    
    try {
        const id = document.getElementById('novedad-id').value;
        const novedadData = {
            descripcion: document.getElementById('novedad-descripcion').value,
            responsable: document.getElementById('novedad-responsable').value,
            horaInicio: document.getElementById('novedad-hora-inicio').value,
            prioridad: document.getElementById('novedad-prioridad').value,
            observaciones: document.getElementById('novedad-observaciones').value,
            date: new Date().toISOString(),
            completed: false,
        };

        if (id) {
            // Actualizar novedad existente - obtener datos actuales primero
            const existingNovedad = await dbManager.get(NOVEDADES_STORE, parseInt(id, 10));
            if (existingNovedad) {
                novedadData.id = parseInt(id, 10);
                novedadData.completed = existingNovedad.completed; // Preservar estado de completed
                novedadData.date = existingNovedad.date; // Preservar fecha original
            }
            
            await dbManager.update(NOVEDADES_STORE, novedadData);
            showSuccessMessage('Novedad actualizada con éxito');
            console.log('Novedad updated:', novedadData);
        } else {
            // Crear nueva novedad
            const result = await dbManager.add(NOVEDADES_STORE, novedadData);
            showSuccessMessage('Novedad creada con éxito');
            console.log('Novedad created with ID:', result);
            
            // Send notification for new high-priority tasks
            if (novedadData.prioridad === 'Alta') {
                sendNotification('Nueva Tarea de Alta Prioridad', {
                    body: novedadData.descripcion,
                    icon: '📝'
                });
            }
        }
        
        closeModal('novedad-modal');
        await filterAndRenderNovedades();
    } catch (error) {
        console.error('Error saving novedad:', error);
        alert('Error al guardar la novedad. Por favor, inténtalo de nuevo.');
    }
}

async function toggleNovedadComplete(novedad) {
    try {
        novedad.completed = !novedad.completed;
        if (novedad.completed) {
            novedad.completionDate = new Date().toISOString();
        } else {
            novedad.completionDate = null;
        }
        await dbManager.update(NOVEDADES_STORE, novedad);
        console.log('Novedad completion toggled:', novedad.id, novedad.completed);
        await filterAndRenderNovedades();
    } catch (error) {
        console.error('Error toggling novedad completion:', error);
        alert('Error al actualizar el estado de la novedad.');
    }
}

// --- CONSIGNAS ---
async function filterAndRenderConsignas() {
    try {
        console.log('Loading consignas...');
        const consignas = await dbManager.getAll(CONSIGNAS_STORE);
        const container = document.getElementById('consignas-container');
        container.innerHTML = '';

        const searchTerm = document.getElementById('consigna-search').value.toLowerCase();
        const statusFilter = document.getElementById('consigna-filter-estado').value;

        const filteredConsignas = consignas.filter(item => {
            const matchesSearch = item.titulo.toLowerCase().includes(searchTerm) || item.asignado.toLowerCase().includes(searchTerm);
            const matchesStatus = statusFilter === "" || String(item.completed) === statusFilter;
            return matchesSearch && matchesStatus;
        });

        if (filteredConsignas.length === 0) {
            container.innerHTML = '<p>No se encontraron consignas que coincidan con los filtros.</p>';
            return;
        }
        filteredConsignas.forEach(item => container.appendChild(createConsignaCard(item)));
        console.log(`Rendered ${filteredConsignas.length} consignas`);
    } catch (error) {
        console.error('Error loading consignas:', error);
        const container = document.getElementById('consignas-container');
        container.innerHTML = '<p>Error al cargar las consignas. Por favor, recarga la página.</p>';
    }
}


function createConsignaCard(consigna) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = consigna.id;
    card.dataset.completed = consigna.completed || false;
    const completionDate = consigna.completed && consigna.completionDate ? new Date(consigna.completionDate).toLocaleString('es-ES') : '';
    
    card.innerHTML = `
        <div class="card-header">
            <div class="checkbox-wrapper">
                <input type="checkbox" class="checkbox" ${consigna.completed ? 'checked' : ''}>
                <h3 class="card-title" data-completed="${consigna.completed || false}">${consigna.titulo}</h3>
            </div>
        </div>
        <p class="card-description">${consigna.descripcion || ''}</p>
        <div class="card-meta">
            <span>👤 ${consigna.asignado}</span>
            ${completionDate ? `<span>✅ Finalización: ${completionDate}</span>` : ''}
        </div>
        <div class="card-actions">
            <button class="btn btn-secondary btn-edit">✏️ Editar</button>
            <button class="btn btn-danger btn-delete">🗑️ Eliminar</button>
        </div>
    `;
    
    card.querySelector('.btn-edit').addEventListener('click', () => openConsignaModal(consigna));
    card.querySelector('.btn-delete').addEventListener('click', () => confirmDelete(CONSIGNAS_STORE, consigna.id, filterAndRenderConsignas));
    card.querySelector('.checkbox').addEventListener('change', (e) => toggleConsignaComplete(consigna, e.target.checked));
    
    return card;
}

function openConsignaModal(consigna = null) {
    const modal = document.getElementById('consigna-modal');
    const form = document.getElementById('consigna-form');
    form.reset();

    if (consigna) {
        document.getElementById('consigna-modal-title').textContent = 'Editar Consigna';
        document.getElementById('consigna-id').value = consigna.id;
        document.getElementById('consigna-titulo').value = consigna.titulo;
        document.getElementById('consigna-asignado').value = consigna.asignado;
        document.getElementById('consigna-descripcion').value = consigna.descripcion;
    } else {
        document.getElementById('consigna-modal-title').textContent = 'Nueva Consigna';
        document.getElementById('consigna-id').value = '';
    }
    modal.classList.add('active');
}

async function handleConsignaSubmit(event) {
    event.preventDefault();
    
    try {
        const id = document.getElementById('consigna-id').value;
        const consignaData = {
            titulo: document.getElementById('consigna-titulo').value,
            asignado: document.getElementById('consigna-asignado').value,
            descripcion: document.getElementById('consigna-descripcion').value,
            completed: false
        };

        if (id) {
            // Actualizar consigna existente - obtener datos actuales primero
            const existingConsigna = await dbManager.get(CONSIGNAS_STORE, parseInt(id, 10));
            if (existingConsigna) {
                consignaData.id = parseInt(id, 10);
                consignaData.completed = existingConsigna.completed; // Preservar estado de completed
            }
            
            await dbManager.update(CONSIGNAS_STORE, consignaData);
            showSuccessMessage('Consigna actualizada con éxito');
            console.log('Consigna updated:', consignaData);
        } else {
            // Crear nueva consigna
            const result = await dbManager.add(CONSIGNAS_STORE, consignaData);
            showSuccessMessage('Consigna creada con éxito');
            console.log('Consigna created with ID:', result);
        }

        closeModal('consigna-modal');
        await filterAndRenderConsignas();
    } catch (error) {
        console.error('Error saving consigna:', error);
        alert('Error al guardar la consigna. Por favor, inténtalo de nuevo.');
    }
}

async function toggleConsignaComplete(consigna, isChecked) {
    try {
        consigna.completed = isChecked;
        if (consigna.completed) {
            consigna.completionDate = new Date().toISOString();
        } else {
            consigna.completionDate = null;
        }
        await dbManager.update(CONSIGNAS_STORE, consigna);
        console.log('Consigna completion toggled:', consigna.id, consigna.completed);
        await filterAndRenderConsignas();
    } catch (error) {
        console.error('Error toggling consigna completion:', error);
        alert('Error al actualizar el estado de la consigna.');
    }
}

// --- GENERAL & UTILS ---

async function exportAllDataToCSV() {
    try {
        console.log('Exporting all data to CSV...');
        
        const [novedades, consignas] = await Promise.all([
            dbManager.getAll(NOVEDADES_STORE),
            dbManager.getAll(CONSIGNAS_STORE)
        ]);

        if (novedades.length === 0 && consignas.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        const escapeCSV = (text) => `"${String(text || '').replace(/"/g, '""')}"`;
        
        const headers = [
            'Tipo', 'ID', 'Título/Descripción', 'Responsable/Asignado', 'Hora Inicio', 
            'Prioridad', 'Observaciones/Detalles', 'Fecha Creación', 'Fecha Finalización', 'Estado'
        ];

        const novedadesRows = novedades.map(n => [
            'Novedad',
            n.id,
            escapeCSV(n.descripcion),
            escapeCSV(n.responsable),
            n.horaInicio,
            n.prioridad,
            escapeCSV(n.observaciones),
            escapeCSV(new Date(n.date).toLocaleString('es-ES')),
            escapeCSV(n.completionDate ? new Date(n.completionDate).toLocaleString('es-ES') : ''),
            n.completed ? 'Completada' : 'Pendiente'
        ].join(','));

        const consignasRows = consignas.map(c => [
            'Consigna',
            c.id,
            escapeCSV(c.titulo),
            escapeCSV(c.asignado),
            '', // Hora Inicio (N/A)
            '', // Prioridad (N/A)
            escapeCSV(c.descripcion),
            '', // Fecha Creación (N/A)
            escapeCSV(c.completionDate ? new Date(c.completionDate).toLocaleString('es-ES') : ''),
            c.completed ? 'Completada' : 'Pendiente'
        ].join(','));

        const allRows = [...novedadesRows, ...consignasRows];
        const csvContent = [headers.join(','), ...allRows].join('\n');
        
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // BOM para compatibilidad con Excel
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        const dateStr = new Date().toISOString().slice(0, 10);
        link.setAttribute('download', `reporte_completo_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert('Ocurrió un error al exportar los datos.');
    }
}

function confirmDelete(storeName, id, renderCallback) {
    const confirmModal = document.getElementById('confirm-modal');
    confirmModal.classList.add('active');

    const confirmBtn = document.getElementById('confirm-delete-btn');
    const cancelBtn = document.getElementById('cancel-delete-btn');

    const confirmHandler = async () => {
        try {
            await dbManager.delete(storeName, id);
            showSuccessMessage('Elemento eliminado');
            console.log(`Item deleted from ${storeName} with ID:`, id);
            await renderCallback();
            closeModal('confirm-modal');
            cleanup();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Error al eliminar el elemento.');
            closeModal('confirm-modal');
            cleanup();
        }
    };

    const cancelHandler = () => {
        closeModal('confirm-modal');
        cleanup();
    };

    const cleanup = () => {
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
    };
    
    confirmBtn.addEventListener('click', confirmHandler, { once: true });
    cancelBtn.addEventListener('click', cancelHandler, { once: true });
}

function showSection(sectionId) {
    document.getElementById('novedades-section').style.display = 'none';
    document.getElementById('consignas-section').style.display = 'none';
    
    document.getElementById(`${sectionId}-section`).style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[onclick="showSection('${sectionId}')"]`).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showSuccessMessage(message) {
    const msgElement = document.getElementById('success-message');
    msgElement.textContent = `✓ ${message}`;
    msgElement.classList.add('show');
    setTimeout(() => {
        msgElement.classList.remove('show');
    }, 3000);
}

// Función de debugging para verificar el estado de la base de datos
async function checkDBStatus() {
    try {
        console.log('=== Database Status Check ===');
        const novedades = await dbManager.getAll(NOVEDADES_STORE);
        const consignas = await dbManager.getAll(CONSIGNAS_STORE);
        
        console.log(`Novedades in database: ${novedades.length}`);
        console.log('Novedades data:', novedades);
        console.log(`Consignas in database: ${consignas.length}`);
        console.log('Consignas data:', consignas);
        console.log('=== End Database Status ===');
        
        return { novedades, consignas };
    } catch (error) {
        console.error('Error checking database status:', error);
        return null;
    }
}

// Hacer la función disponible globalmente para debugging
window.checkDBStatus = checkDBStatus;