# GestiónPro - Sistema de Gestión de Novedades y Consignas

Una aplicación web moderna para la gestión diaria de novedades y consignas con interfaz intuitiva y funciones avanzadas.

## Características

### 🏢 Gestión de Novedades
- Crear y editar novedades diarias
- Clasificación por prioridad (Alta, Media, Baja)
- Seguimiento de responsables y horarios
- Estado de completado con fecha de finalización
- Campos de observaciones para detalles adicionales

### ✅ Gestión de Consignas
- Crear consignas generales para departamentos o personas
- Marcar como completadas con sistema de checkbox
- Seguimiento de asignaciones
- Descripciones detalladas

### 🔍 Sistema de Filtros
- Búsqueda por texto en descripciones y responsables
- Filtros por prioridad y estado
- Interfaz responsive con vista en tarjetas

### 📊 Exportación de Datos
- Exportar todos los datos a formato CSV
- Compatible con Excel
- Incluye fechas de creación y finalización

### 🔔 Notificaciones
- Notificaciones del navegador para tareas importantes
- Recordatorios automáticos de tareas pendientes de alta prioridad
- Avisos para nuevas tareas críticas

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Base de Datos**: IndexedDB (almacenamiento local del navegador)
- **Interfaz**: Diseño moderno con CSS Grid y Flexbox
- **Compatibilidad**: Funciona completamente offline

## Instalación

1. Descargar o clonar el repositorio
2. Abrir `app.html` en cualquier navegador web moderno
3. No requiere servidor web ni instalación adicional

## Uso

### Navegación
- **Novedades**: Gestión de eventos diarios con prioridades
- **Consignas**: Tareas generales y permanentes

### Funcionalidades Principales

#### Crear Nueva Novedad
1. Hacer clic en "Nueva Novedad"
2. Completar descripción, responsable y hora de inicio
3. Seleccionar prioridad y agregar observaciones
4. Guardar

#### Gestionar Estados
- **Novedades**: Botón "Marcar como completada"
- **Consignas**: Checkbox para marcar/desmarcar

#### Filtrar y Buscar
- Usar la barra de filtros en cada sección
- Combinar múltiples filtros para búsquedas específicas

#### Exportar Datos
- Hacer clic en "Exportar Todo (CSV)"
- El archivo incluye todas las novedades y consignas con timestamps

## Estructura de Datos

### Novedades
```javascript
{
  id: number,
  descripcion: string,
  responsable: string,
  horaInicio: string,
  prioridad: "Alta" | "Media" | "Baja",
  observaciones: string,
  date: ISO string,
  completed: boolean,
  completionDate: ISO string | null
}
```

### Consignas
```javascript
{
  id: number,
  titulo: string,
  asignado: string,
  descripcion: string,
  completed: boolean,
  completionDate: ISO string | null
}
```

## Características Técnicas

- **Persistencia**: Los datos se almacenan localmente usando IndexedDB
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Offline**: Funciona completamente sin conexión a internet
- **Performance**: Carga rápida y operaciones eficientes
- **Accesibilidad**: Interfaz clara y navegable

## Soporte de Navegadores

- Chrome 58+
- Firefox 55+
- Safari 11+
- Edge 79+

## Contribuir

Este es un proyecto de código abierto. Para contribuir:

1. Fork el repositorio
2. Crear una rama para la feature
3. Commit los cambios
4. Push a la rama
5. Crear un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.