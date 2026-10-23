# Módulo Independiente: Satel GPS Backup

Este módulo está diseñado como un paquete **autocontenido e independiente**. Puedes copiar toda esta carpeta (`satel-gps-backup`) y pegarla directamente en cualquier otro proyecto basado en **Next.js** o **React**.

---

## 📦 Estructura del Módulo

```
satel-gps-backup/
├── components/           # Componentes UI desacoplados
│   ├── SatelGpsBackup.tsx  # Componente principal autocontenido
│   ├── UploadDropzone.tsx  # Zona drag-and-drop de archivos
│   ├── ControlToolbar.tsx  # Barra de herramientas y acciones
│   └── DeviceTable.tsx     # Tabla de dispositivos con sticky header
├── services/             # Lógica de negocio y procesamiento
│   ├── excel-processor.ts  # Detección de headers, parseo y generación Excel
│   └── backup-service.ts   # Guardado en Escritorio (BACKUPS SATELCOM) y gestión de bloqueos
├── server/               # Handlers de API backend listos para exportar
│   └── api-handlers.ts     # Manejadores GET y POST para Next.js / Node
├── types/                # Interfaces y tipos TypeScript
│   └── index.ts
├── index.ts              # Exportación pública centralizada
└── README.md             # Guía de extracción e integración
```

---

## 🚀 Pasos para Extraerlo a Otro Sistema

### 1. Copiar la Carpeta
Copia la carpeta `satel-gps-backup` a la carpeta de componentes o módulos de tu nuevo proyecto (ejemplo: `src/modules/satel-gps-backup` o `components/satel-gps-backup`).

### 2. Instalar Dependencias
En el proyecto destino, asegúrate de tener instaladas las siguientes librerías:

```bash
npm install xlsx lucide-react canvas-confetti
npm install -D @types/canvas-confetti
```

---

## 💻 Uso en tu Nuevo Sistema

### Paso A: Usar la Interfaz (Frontend)

En cualquier página, vista o modal de tu aplicación:

```tsx
import { SatelGpsBackup } from '@/modules/satel-gps-backup';

export default function PaginaGps() {
  return (
    <div className="w-full h-screen">
      <SatelGpsBackup />
    </div>
  );
}
```

#### Props Opcionales de Configuración:

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `apiEndpoint` | `string` | `'/api/save-local'` | URL del endpoint que guarda en el disco del equipo |
| `defaultFolder` | `string` | `''` (Detecta `Desktop/BACKUPS SATELCOM`) | Ruta fija personalizada para guardar los respaldos |
| `onSaveSuccess` | `(res) => void` | `undefined` | Callback disparado al guardar exitosamente en disco |
| `onDownloadSuccess`| `(fileName, total) => void` | `undefined` | Callback disparado al descargar vía navegador |
| `className` | `string` | `''` | Clases CSS adicionales para el contenedor principal |

---

### Paso B: Conectar la API de Guardado en Disco (Backend)

Crea una ruta en tu App Router de Next.js (por ejemplo en `src/app/api/save-local/route.ts`):

```ts
export { GET, POST } from '@/modules/satel-gps-backup/server/api-handlers';
```

¡Listo! Con esa sola línea, tu nuevo sistema tendrá:
- Detección automática del Escritorio (`BACKUPS SATELCOM`).
- Creación automática de la carpeta si no existe.
- Resiliencia si el archivo está abierto en Microsoft Excel (generación de `backup_(1).xlsx`).

---

## ⚙️ Uso como Servicio sin Interfaz (Headless)

Si en otro sistema solo necesitas la función de transformar y guardar programáticamente sin la interfaz visual:

```ts
import { 
  parseExcelFile, 
  generateProcessedExcel, 
  writeBackupToDisk 
} from '@/modules/satel-gps-backup';

// 1. Parsear buffer
const result = parseExcelFile(arrayBuffer, 'reporte.xlsx');

// 2. Guardar en disco directamente
const guardado = writeBackupToDisk(result.processedRows);
console.log(guardado.savedPath);
```
