# Transformador de Reportes GPS Excel (Satel)

Aplicación web desarrollada en **Next.js (App Router)** y **TypeScript** con **Tailwind CSS** para procesar y transformar reportes de dispositivos GPS de plataformas como Traccar al formato estandarizado requerido por el equipo de Soporte Técnico Satel.

---

## 📦 Módulo 100% Independiente y Extraíble

Todo el módulo está encapsulado y desacoplado dentro de:
👉 **[`src/modules/satel-gps-backup`](file:///c:/Users/Fernando/OneDrive/Desktop/PROYECTO%20APP%20SOPORTE%20TEC/excel-transform-app/src/modules/satel-gps-backup)**

Para llevar este módulo a **cualquier otro sistema o proyecto**, simplemente copia esa carpeta. Contiene sus propios componentes, servicios de procesamiento, tipos y endpoints de API listos para montar.

### Guía rápida de uso en otro sistema:
```bash
# 1. Copia la carpeta:
src/modules/satel-gps-backup -> (a tu nuevo proyecto)

# 2. Instala dependencias en el proyecto destino:
npm install xlsx lucide-react canvas-confetti
npm install -D @types/canvas-confetti
```

```tsx
// 3. Úsalo en cualquier vista o modal:
import { SatelGpsBackup } from '@/modules/satel-gps-backup';

export default function MiModulo() {
  return <SatelGpsBackup />;
}
```

```ts
// 4. Conecta el guardado en disco en tu API (ej: src/app/api/save-local/route.ts):
export { GET, POST } from '@/modules/satel-gps-backup/server/api-handlers';
```

---

## 🚀 Funcionalidades del Módulo

1. **Carga rápida de archivos:**
   - Soporte para arrastrar y soltar (Drag & Drop) o selector de archivos (`.xlsx`, `.xls`, `.csv`).
2. **Detección inteligente de encabezados:**
   - Detecta automáticamente en qué fila se encuentran los encabezados sin importar las filas o columnas vacías iniciales.
3. **Mapeo y transformación estandarizada:**
   - `# ITEM`: Generación secuencial numérica (`1, 2, 3...`).
   - `NOMBRE`: Extraído de la columna `Nombre` / `Placa`.
   - `IMEI`: Conservado como texto puro (sin truncar ceros a la izquierda).
   - `ACTIVO`: Estandarizado con valor `0` por defecto.
   - `VENCE`: Extraído de `Expira el` / `Vencimiento`.
   - `EQUIPO GPS`: Extraído de `Equipo GPS` / `Modelo`.
   - `# NUMERO CHIP`: Extraído de `# de Telefono SIM` (conservando signo `+`, formato y ceros).
   - `ULTIMA FECHA` y `ULTIMA HORA`: Separación inteligente y precisa de la columna de última conexión en dos columnas independientes, compatible con fechas ISO, formato latino `DD/MM/YYYY`, seriales numéricos de Excel y objetos Date.
   - `ESTADO`: Extraído de `Estado`.
   - `USUARIOS`: Extraído de `Cuenta de Usuario`, visualizado con etiquetas legibles.
4. **Depuración automática:**
   - Elimina columnas no requeridas (`Protocolo`, `Net. protocol`, `Puerto`) y descarta filas vacías sin datos de GPS.
5. **Búsqueda y filtrado en tiempo real:**
   - Filtro instantáneo por nombre/placa, IMEI, chip SIM, equipo, usuario, fecha u hora.
6. **Copia rápida a portapapeles:**
   - Exporta con un clic el conjunto de datos tabulado (`TSV`), listo para pegar directamente en Microsoft Excel o Google Sheets.
7. **Guardado directo en el Escritorio (`BACKUPS SATELCOM`):**
   - Guarda el archivo generado automáticamente en la carpeta `BACKUPS SATELCOM` del escritorio del usuario (`C:\Users\<Usuario>\Desktop\BACKUPS SATELCOM` o OneDrive Desktop).
   - Manejo de concurrencia y bloqueo de archivos (si el archivo está abierto en Excel, genera automáticamente nombres como `backup_YYYY-MM-DD_(1).xlsx` sin error).
   - Configuración visual para consultar o ajustar la carpeta destino.
8. **Descarga directa en navegador:**
   - Descarga directa en archivo `.xlsx` estandarizado con animación visual.

---

## 🛠️ Cómo ejecutar el proyecto

Desde la carpeta `excel-transform-app`:

```bash
# Servidor de desarrollo:
npm run dev

# Compilar para producción:
npm run build
npm run start
```

La aplicación estará disponible en: [http://localhost:3000](http://localhost:3000)
# help_backup_module
