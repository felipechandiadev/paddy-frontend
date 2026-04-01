# 📚 Shared UI Components - Documentación Completa

Sistema de componentes UI reutilizables para aplicaciones React/Next.js construidos con TypeScript y Tailwind CSS.

## 📋 Índice

1. [Controles de Formulario](#-controles-de-formulario)
   - [TextField](#textfield)
   - [AutoComplete](#autocomplete)
   - [Select](#select)
   - [NumberStepper](#numberstepper)
   - [Switch](#switch)
   - [RangeSlider](#rangeslider)
   - [LocationPicker](#locationpicker)
2. [Composiciones de Formulario](#-composiciones-de-formulario)
   - [CreateBaseForm](#createbaseform)
   - [UpdateBaseForm](#updatebaseform)
   - [DeleteBaseForm](#deletebaseform)
3. [Botones y Acciones](#-botones-y-acciones)
   - [Button](#button)
   - [ButtonPill](#buttonpill)
   - [IconButton](#iconbutton)
4. [Navegación](#-navegación)
   - [TopBar](#topbar)
   - [SideBar](#sidebar)
   - [Tabs](#tabs)
5. [Overlay y Diálogos](#-overlay-y-diálogos)
   - [Dialog](#dialog)
6. [Visualización de Datos](#-visualización-de-datos)
   - [DataGrid](#datagrid)
   - [Badge](#badge)
   - [Alert](#alert)
7. [Feedback y Progreso](#-feedback-y-progreso)
   - [DotProgress](#dotprogress)
  - [SplashScreen](#splashscreen)
8. [Gestión de Archivos](#-gestión-de-archivos)
   - [MultimediaUploader](#multimediauploader)
   - [MultimediaUpdater](#multimediaupdater)
9. [Utilidades Internas](#-utilidades-internas)
   - [DropdownList](#dropdownlist)

---

## 🎨 Controles de Formulario

### TextField

Campo de entrada versátil con múltiples tipos y validaciones integradas.

#### Props

```typescript
interface TextFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: 
    | "text" 
    | "textarea" 
    | "number" 
    | "email" 
    | "password" 
    | "date" 
    | "tel" 
    | "dni" 
    | "currency";
  name?: string;
  placeholder?: string;
  startIcon?: string; // Material Symbols icon name
  startAdornment?: React.ReactNode;
  endIcon?: string; // Material Symbols icon name
  className?: string;
  variante?: "normal" | "contrast" | "autocomplete";
  rows?: number; // Para textarea
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url";
  pattern?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  placeholderColor?: string;
  currencySymbol?: string; // Default: "$"
  allowDecimalComma?: boolean; // Permitir coma como separador decimal
  phonePrefix?: string; // Ej: "+56" para Chile
  allowLetters?: boolean; // Permitir letras en teléfono
  passwordVisibilityToggle?: boolean; // Default: true
  autoComplete?: string;
  "data-test-id"?: string;
}
```

#### Características Especiales

**Tipo DNI (RUT Chileno):**
- Formato automático: `12.345.678-9`
- Validación de dígito verificador
- Solo acepta números y letra K

**Tipo Currency (Moneda):**
- Formato automático con separadores de miles: `$1.234.567`
- Símbolo personalizable
- Soporte para coma decimal opcional

**Tipo Tel (Teléfono):**
- Prefijo personalizable (ej: `+56`)
- Filtrado de letras opcional
- Formato internacional

**Tipo Password:**
- Toggle de visibilidad integrado (icono de ojo)
- Configurable con `passwordVisibilityToggle`

#### Ejemplo de Uso

```tsx
import { TextField } from '@/shared/components/ui/TextField/TextField';

// Campo de texto básico
<TextField
  label="Nombre"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
  startIcon="person"
/>

// RUT chileno
<TextField
  label="RUT"
  type="dni"
  value={rut}
  onChange={(e) => setRut(e.target.value)}
  required
/>

// Moneda
<TextField
  label="Precio"
  type="currency"
  value={price}
  onChange={(e) => setPrice(e.target.value)}
  currencySymbol="$"
/>

// Teléfono con prefijo
<TextField
  label="Teléfono"
  type="tel"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  phonePrefix="+56"
/>

// Textarea
<TextField
  label="Descripción"
  type="textarea"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={4}
/>
```

---

### AutoComplete

Campo de autocompletado con búsqueda y navegación por teclado.

#### Props

```typescript
interface AutoCompleteProps<T = Option> {
  options: T[];
  label?: string;
  placeholder?: string;
  value?: T | null;
  onChange?: (option: T | null) => void;
  onInputChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  getOptionLabel?: (option: T) => string;
  getOptionValue?: (option: T) => any;
  filterOption?: (option: T, inputValue: string) => boolean;
  "data-test-id"?: string;
  disabled?: boolean;
}

export interface Option {
  id: string | number;
  label: string;
}
```

#### Características

- ✅ Navegación por teclado (↑, ↓, Enter, Esc)
- ✅ Highlight automático del item seleccionado
- ✅ Scroll automático al elemento destacado
- ✅ Filtrado customizable
- ✅ Compatible con objetos genéricos
- ✅ Z-index: `z-20`

#### Ejemplo de Uso

```tsx
import AutoComplete, { Option } from '@/shared/components/ui/AutoComplete/AutoComplete';

const customers: Option[] = [
  { id: 1, label: 'Juan Pérez' },
  { id: 2, label: 'María García' },
  { id: 3, label: 'Pedro López' },
];

<AutoComplete
  label="Cliente"
  options={customers}
  value={selectedCustomer}
  onChange={(option) => setSelectedCustomer(option)}
  placeholder="Buscar cliente..."
  required
/>

// Con objetos customizados
interface CustomUser {
  userId: string;
  fullName: string;
  email: string;
}

<AutoComplete<CustomUser>
  options={users}
  getOptionLabel={(user) => user.fullName}
  getOptionValue={(user) => user.userId}
  filterOption={(user, input) => 
    user.fullName.toLowerCase().includes(input.toLowerCase()) ||
    user.email.toLowerCase().includes(input.toLowerCase())
  }
  onChange={(user) => setSelectedUser(user)}
/>
```

---

### Select

Dropdown de selección simple con variantes visuales.

#### Props

```typescript
interface SelectProps {
  label?: string;
  options: Option[];
  placeholder?: string;
  value?: string | number | null;
  onChange?: (id: string | number | null) => void;
  required?: boolean;
  name?: string;
  variant?: 'default' | 'minimal';
  "data-test-id"?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface Option {
  id: string | number;
  label: string;
}
```

#### Características

- ✅ Navegación por teclado (↑, ↓, Enter, Esc)
- ✅ Variante `minimal` sin borde
- ✅ Botón de limpieza opcional (`allowClear`)
- ✅ Validación de formulario integrada
- ✅ Z-index: `z-20` (dropdown), `-z-10` (minimal variant)

#### Ejemplo de Uso

```tsx
import Select, { Option } from '@/shared/components/ui/Select/Select';

const countries: Option[] = [
  { id: 'cl', label: 'Chile' },
  { id: 'ar', label: 'Argentina' },
  { id: 'pe', label: 'Perú' },
];

// Select por defecto
<Select
  label="País"
  options={countries}
  value={selectedCountry}
  onChange={(id) => setSelectedCountry(id)}
  required
/>

// Variante minimal (sin borde)
<Select
  options={statusOptions}
  value={status}
  onChange={(id) => setStatus(id)}
  variant="minimal"
  allowClear
/>
```

---

### NumberStepper

Input numérico con botones de incremento/decremento y label dinámico.

#### Props

```typescript
interface NumberStepperProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number; // Default: 1
  label?: string; // Label pequeño sobre el input
  icon?: string; // Material Symbols icon
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowFloat?: boolean; // Permitir decimales
  "data-test-id"?: string;
}
```

#### Características

- ✅ Botones de incremento/decremento integrados
- ✅ Validación de min/max
- ✅ Soporte para decimales
- ✅ Label o icono dinámico
- ✅ Estilos CSS para ocultar spinners nativos

#### Ejemplo de Uso

```tsx
import NumberStepper from '@/shared/components/ui/NumberStepper/NumberStepper';

// Cantidad de producto
<NumberStepper
  value={quantity}
  onChange={(val) => setQuantity(val)}
  min={1}
  max={100}
  step={1}
  label="Cantidad"
/>

// Precio con decimales
<NumberStepper
  value={price}
  onChange={(val) => setPrice(val)}
  min={0}
  step={0.01}
  allowFloat
  icon="attach_money"
  placeholder="0.00"
/>
```

---

### Switch

Toggle switch para valores booleanos con label personalizable.

#### Props

```typescript
interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  labelPosition?: 'left' | 'right'; // Default: 'left'
  disabled?: boolean;
  "data-test-id"?: string;
}
```

#### Características

- ✅ Accesibilidad completa (role="switch", aria-checked)
- ✅ Navegación por teclado (Enter, Space)
- ✅ Label posicionable a izquierda o derecha
- ✅ Animación suave de transición

#### Ejemplo de Uso

```tsx
import Switch from '@/shared/components/ui/Switch/Switch';

// Switch básico
<Switch
  checked={isActive}
  onChange={(checked) => setIsActive(checked)}
  label="Activo"
/>

// Label a la derecha
<Switch
  checked={notifications}
  onChange={(checked) => setNotifications(checked)}
  label="Notificaciones"
  labelPosition="right"
/>

// Deshabilitado
<Switch
  checked={false}
  disabled
  label="Opción deshabilitada"
/>
```

---

### RangeSlider

Slider de doble thumb para selección de rangos numéricos.

#### Props

```typescript
interface RangeSliderProps {
  min?: number; // Default: 0
  max?: number; // Default: 100
  value?: [number, number];
  onChange?: (values: [number, number]) => void;
}
```

#### Características

- ✅ Doble thumb para rango
- ✅ Visualización de barra de progreso entre valores
- ✅ Drag and drop con mouse
- ✅ Prevención de solapamiento (min <= max)

#### Ejemplo de Uso

```tsx
import RangeSlider from '@/shared/components/ui/RangeSlider/RangeSlider';

// Rango de precios
<RangeSlider
  min={0}
  max={1000000}
  value={priceRange}
  onChange={(range) => setPriceRange(range)}
/>
```

---

### LocationPicker

Selector de ubicación geográfica con mapa interactivo (Leaflet).

#### Componentes

- `LocationPicker.tsx` - Componente principal del mapa
- `LocationPickerWrapper.tsx` - Wrapper para manejo de estado y modos

#### Props (LocationPickerWrapper)

```typescript
interface LocationPickerWrapperProps {
  mode: 'edit' | 'update' | 'view';
  initialLat?: number;
  initialLng?: number;
  externalPosition?: { lat: number; lng: number } | null;
  onChange?: (coords: { lat: number; lng: number }) => void;
}
```

#### Modos de Operación

1. **`edit`**: Seleccionar nueva ubicación
2. **`update`**: Actualizar ubicación existente con botón "Cambiar"
3. **`view`**: Solo visualización (sin edición)

#### Ejemplo de Uso

```tsx
import LocationPickerWrapper from '@/shared/components/ui/LocationPicker/LocationPickerWrapper';

// Modo edición (nueva ubicación)
<LocationPickerWrapper
  mode="edit"
  initialLat={-33.4489}
  initialLng={-70.6693}
  onChange={(coords) => setLocation(coords)}
/>

// Modo actualización (ubicación existente)
<LocationPickerWrapper
  mode="update"
  externalPosition={currentLocation}
  onChange={(coords) => setLocation(coords)}
/>

// Modo vista (solo lectura)
<LocationPickerWrapper
  mode="view"
  externalPosition={savedLocation}
/>
```

---

## 📋 Composiciones de Formulario

### CreateBaseForm

Generador de formularios dinámicos para creación de registros.

#### Props

```typescript
interface CreateBaseFormProps {
  fields: BaseFormField[] | BaseFormFieldGroup[];
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  title?: string;
  subtitle?: string;
  errors?: string[];
  "data-test-id"?: string;
  columns?: number; // Grid columns (default: 1)
  cancelButton?: boolean;
  cancelButtonText?: string;
  onCancel?: () => void;
  validate?: (values: Record<string, any>) => string[];
}

interface BaseFormField {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "autocomplete"
    | "number"
    | "numberStepper"
    | "email"
    | "password"
    | "date"
    | "switch"
    | "select"
    | "range"
    | "location"
    | "dni"
    | "currency"
    | "image"
    | "video"
    | "avatar";
  required?: boolean;
  autoFocus?: boolean;
  options?: Option[]; // Para autocomplete y select
  multiline?: boolean;
  rows?: number;
  formatFn?: (input: string) => string;
  startIcon?: string;
  endIcon?: string;
  min?: number;
  max?: number;
  step?: number;
  labelPosition?: 'left' | 'right'; // Para switch
  passwordVisibilityToggle?: boolean;
  // Props multimedia
  acceptedTypes?: string[];
  maxSize?: number;
  uploadPath?: string;
  buttonText?: string;
}

interface BaseFormFieldGroup {
  id?: string;
  title?: string;
  subtitle?: string;
  columns?: number;
  gap?: number;
  fields: BaseFormField[];
}
```

#### Tipos de Campo Soportados

| Tipo | Descripción | Componente |
|------|-------------|------------|
| `text` | Texto simple | TextField |
| `textarea` | Texto multilínea | TextField (multiline) |
| `autocomplete` | Búsqueda con autocompletado | AutoComplete |
| `number` | Número básico | TextField (type="number") |
| `numberStepper` | Número con botones +/- | NumberStepper |
| `email` | Email | TextField (type="email") |
| `password` | Contraseña | TextField (type="password") |
| `date` | Fecha | TextField (type="date") |
| `switch` | Toggle booleano | Switch |
| `select` | Dropdown | Select |
| `range` | Rango numérico | RangeSlider |
| `location` | Ubicación en mapa | LocationPicker |
| `dni` | RUT chileno | TextField (type="dni") |
| `currency` | Moneda formateada | TextField (type="currency") |
| `image` | Subida de imagen | MultimediaUploader |
| `video` | Subida de video | MultimediaUploader |
| `avatar` | Imagen de perfil (círculo) | MultimediaUploader |
| `banner` | Imagen rectangular 16:9 con borde secundario | MultimediaUploader |

#### Ejemplo de Uso

```tsx
import CreateBaseForm, { BaseFormField } from '@/shared/components/ui/BaseForm/CreateBaseForm';

const fields: BaseFormField[] = [
  {
    name: 'name',
    label: 'Nombre',
    type: 'text',
    required: true,
    autoFocus: true,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
  },
  {
    name: 'rut',
    label: 'RUT',
    type: 'dni',
    required: true,
  },
  {
    name: 'price',
    label: 'Precio',
    type: 'currency',
    required: true,
  },
  {
    name: 'category',
    label: 'Categoría',
    type: 'autocomplete',
    options: categories,
    required: true,
  },
  {
    name: 'quantity',
    label: 'Cantidad',
    type: 'numberStepper',
    min: 1,
    max: 100,
    step: 1,
  },
  {
    name: 'active',
    label: 'Activo',
    type: 'switch',
    labelPosition: 'right',
  },
  {
    name: 'image',
    label: 'Imagen de producto',
    type: 'image',
    uploadPath: '/uploads/products',
    maxSize: 5,
  },
];

<CreateBaseForm
  fields={fields}
  values={formValues}
  onChange={(field, value) => setFormValues({ ...formValues, [field]: value })}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  submitLabel="Crear Producto"
  title="Nuevo Producto"
  errors={errors}
  columns={2} // Grid de 2 columnas
/>
```

#### Ejemplo con Grupos de Campos

```tsx
const fieldGroups: BaseFormFieldGroup[] = [
  {
    title: 'Información Personal',
    subtitle: 'Datos básicos del usuario',
    columns: 2,
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'rut', label: 'RUT', type: 'dni', required: true },
      { name: 'phone', label: 'Teléfono', type: 'text' },
    ],
  },
  {
    title: 'Ubicación',
    columns: 1,
    fields: [
      { name: 'location', label: 'Ubicación en mapa', type: 'location' },
    ],
  },
];

<CreateBaseForm
  fields={fieldGroups}
  values={formValues}
  onChange={handleChange}
  onSubmit={handleSubmit}
/>
```

---

### UpdateBaseForm

Formulario de edición con valores precargados. Idéntico a `CreateBaseForm` pero optimizado para actualización.

#### Props

```typescript
// Mismas props que CreateBaseForm
interface UpdateBaseFormProps extends CreateBaseFormProps {}
```

#### Ejemplo de Uso

```tsx
import UpdateBaseForm from '@/shared/components/ui/BaseForm/UpdateBaseForm';

<UpdateBaseForm
  fields={fields}
  values={existingData} // Valores precargados del registro
  onChange={(field, value) => setFormValues({ ...formValues, [field]: value })}
  onSubmit={handleUpdate}
  isSubmitting={isSubmitting}
  submitLabel="Actualizar"
  title="Editar Producto"
/>
```

---

### DeleteBaseForm

Diálogo de confirmación de eliminación con diseño visual distintivo.

#### Props

```typescript
interface DeleteBaseFormProps {
  message: string;
  onSubmit: () => void;
  isSubmitting?: boolean;
  title?: string; // Default: "Confirmar eliminación"
  subtitle?: string;
  submitLabel?: string;
  errors?: string[];
  "data-test-id"?: string;
  cancelButton?: boolean;
  cancelButtonText?: string;
  onCancel?: () => void;
}
```

#### Características

- ✅ Diseño visual distintivo (rojo) para acciones destructivas
- ✅ Icono de papelera (Lucide `Trash2`)
- ✅ Confirmación explícita requerida
- ✅ Botón de cancelación opcional

#### Ejemplo de Uso

```tsx
import DeleteBaseForm from '@/shared/components/ui/BaseForm/DeleteBaseForm';
import Dialog from '@/shared/components/ui/Dialog/Dialog';

const [openDelete, setOpenDelete] = useState(false);

<Dialog open={openDelete} onClose={() => setOpenDelete(false)} size="sm">
  <DeleteBaseForm
    title="Eliminar Producto"
    message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
    onSubmit={handleDelete}
    isSubmitting={isDeleting}
    submitLabel="Eliminar"
    cancelButton
    onCancel={() => setOpenDelete(false)}
    errors={errors}
  />
</Dialog>
```

---

## 🖱️ Botones y Acciones

### Button

Botón principal con múltiples variantes y estado de carga.

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

type ButtonVariant = "primary" | "secondary" | "outlined" | "outlinedSecondary" | "text";
type ButtonSize = "sm" | "md" | "lg";
```

#### Variantes

| Variante | Descripción | CSS Class |
|----------|-------------|-----------|
| `primary` | Botón primario (contenido) | `btn-contained-primary` |
| `secondary` | Botón secundario (contenido) | `btn-contained-secondary` |
| `outlined` | Botón con borde primario | `btn-outlined` |
| `outlinedSecondary` | Botón con borde secundario | `btn-outlined-secondary` |
| `text` | Botón de texto (sin fondo) | `btn-text` |

#### Tamaños

| Tamaño | Clases CSS |
|--------|-----------|
| `sm` | `px-3 py-1.5 text-sm` |
| `md` | `px-4 py-2` |
| `lg` | `px-6 py-3 text-lg` |

#### Ejemplo de Uso

```tsx
import { Button } from '@/shared/components/ui/Button/Button';

// Botón primario
<Button variant="primary" size="md" onClick={handleSave}>
  Guardar
</Button>

// Botón con loading
<Button variant="primary" loading={isSubmitting}>
  Procesando...
</Button>

// Botón outlined
<Button variant="outlined" size="sm">
  Cancelar
</Button>

// Botón de texto
<Button variant="text">
  Ver más
</Button>

// Botón deshabilitado
<Button disabled>
  No disponible
</Button>
```

---

### ButtonPill

Botón con forma de píldora (bordes completamente redondeados).

#### Props

```typescript
interface ButtonPillProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outlined";
  className?: string;
  disabled?: boolean;
  [key: string]: any; // Otros props HTML
}
```

#### Ejemplo de Uso

```tsx
import { ButtonPill } from '@/shared/components/ui/Button/ButtonPill';

<ButtonPill variant="primary">
  Nuevo
</ButtonPill>

<ButtonPill variant="outlined">
  Filtrar
</ButtonPill>
```

---

### IconButton

Botón circular con icono Material Symbols.

#### Props

```typescript
interface IconButtonProps {
  icon: string; // Nombre del icono Material Symbols
  variant?: 
    | "containedPrimary"
    | "containedSecondary"
    | "text"
    | "basic"
    | "basicSecondary"
    | "outlined"
    | "ghost";
  size?: IconButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
  [key: string]: any;
}

type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
```

#### Tamaños

| Tamaño | Width x Height |
|--------|---------------|
| `xs` | `20px x 20px` |
| `sm` | `28px x 28px` |
| `md` | `40px x 40px` |
| `lg` | `48px x 48px` |
| `xl` | `56px x 56px` |
| `number` | Custom (ej: `60`) |

#### Variantes

| Variante | CSS Class | Descripción |
|----------|-----------|-------------|
| `containedPrimary` | `icon-button-contained-primary` | Fondo primario |
| `containedSecondary` | `icon-button-contained-secondary` | Fondo secundario |
| `text` | `icon-button-text` | Sin fondo |
| `basic` | `icon-button-basic` | Básico |
| `basicSecondary` | `icon-button-basic-secondary` | Básico secundario |
| `outlined` | `icon-button-outlined` | Con borde |
| `ghost` | `icon-button-ghost` | Transparente |

#### Ejemplo de Uso

```tsx
import IconButton from '@/shared/components/ui/IconButton/IconButton';

// Botón de editar
<IconButton
  icon="edit"
  variant="containedPrimary"
  size="md"
  onClick={handleEdit}
  ariaLabel="Editar"
/>

// Botón de eliminar
<IconButton
  icon="delete"
  variant="text"
  size="sm"
  onClick={handleDelete}
/>

// Con loading
<IconButton
  icon="save"
  variant="containedPrimary"
  isLoading={isSaving}
/>

// Tamaño custom
<IconButton
  icon="add"
  size={64}
  variant="outlined"
/>
```

---

## 🧭 Navegación

### TopBar

Barra de navegación superior con logo, título y menú lateral integrado.

#### Props

```typescript
interface TopBarProps {
  title?: string;
  logoSrc?: string;
  className?: string;
  onMenuClick?: () => void;
  SideBarComponent?: React.ComponentType<{ onClose: () => void }>;
  menuItems?: SideBarMenuItem[]; // TopBar renderiza SideBar internamente
  showUserButton?: boolean;
  userName?: string;
}
```

#### Características

- ✅ Logo responsive con Next.js Image
- ✅ Integración con SideBar
- ✅ Botón de menú hamburguesa
- ✅ Dropdown de perfil de usuario opcional
- ✅ Contexto de control de SideBar (`useSideBar()`)
- ✅ Z-index: `z-30` (header), `z-40` (overlay)

#### Ejemplo de Uso

```tsx
import TopBar from '@/shared/components/ui/TopBar/TopBar';
import { SideBarMenuItem } from '@/shared/components/ui/TopBar/SideBar';

const menuItems: SideBarMenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'dashboard',
  },
  {
    label: 'Productos',
    icon: 'inventory_2',
    children: [
      { label: 'Lista', href: '/products' },
      { label: 'Crear', href: '/products/create' },
    ],
  },
  {
    label: 'Clientes',
    href: '/customers',
    icon: 'people',
  },
];

<TopBar
  title="Sales AYG"
  logoSrc="/logo.png"
  menuItems={menuItems}
  showUserButton
  userName="Juan Pérez"
/>
```

#### Hook de Control

```tsx
import { useSideBar } from '@/shared/components/ui/TopBar/TopBar';

function MyComponent() {
  const { open, close, isOpen } = useSideBar();
  
  return (
    <button onClick={open}>Abrir menú</button>
  );
}
```

---

### SideBar

Menú lateral con items anidados y efecto glassmorphism.

#### Props

```typescript
interface SideBarProps {
  items: SideBarMenuItem[];
  onClose: () => void;
}

interface SideBarMenuItem {
  label: string;
  href?: string;
  icon?: string; // Material Symbols icon
  children?: SideBarMenuItem[];
  action?: () => void;
}
```

#### Características

- ✅ Items anidados con expansión/colapso
- ✅ Navegación con Next.js Link
- ✅ Efecto glassmorphism
- ✅ Overlay con cierre automático
- ✅ Z-index: `z-50`

#### Ejemplo de Uso

```tsx
import SideBar, { SideBarMenuItem } from '@/shared/components/ui/TopBar/SideBar';

const menuItems: SideBarMenuItem[] = [
  {
    label: 'Inicio',
    href: '/',
    icon: 'home',
  },
  {
    label: 'Ventas',
    icon: 'shopping_cart',
    children: [
      { label: 'Nueva Venta', href: '/sales/create' },
      { label: 'Historial', href: '/sales/history' },
    ],
  },
  {
    label: 'Configuración',
    icon: 'settings',
    action: () => alert('Abrir configuración'),
  },
];

<SideBar items={menuItems} onClose={() => setSidebarOpen(false)} />
```

---

### Tabs

Sistema de pestañas para navegación secundaria con Next.js.

#### Props

```typescript
interface TabsProps {
  items: TabItem[];
  basePath?: string;
  className?: string;
}

export interface TabItem {
  href: string;
  label: string;
  exact?: boolean; // Match exacto de ruta
}
```

#### Características

- ✅ Integración con Next.js Router
- ✅ Highlight automático de pestaña activa
- ✅ Match exacto o parcial de rutas
- ✅ Prefetch automático

#### Ejemplo de Uso

```tsx
import Tabs, { TabItem } from '@/shared/components/ui/Tabs/Tabs';

const tabs: TabItem[] = [
  { href: '/products', label: 'Todos', exact: true },
  { href: '/products/active', label: 'Activos' },
  { href: '/products/inactive', label: 'Inactivos' },
  { href: '/products/archived', label: 'Archivados' },
];

<Tabs items={tabs} basePath="/products" />
```

---

## 💬 Overlay y Diálogos

### Dialog

Modal/Dialog altamente configurable con múltiples tamaños y comportamientos.

#### Props

```typescript
interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'custom';
  customSize?: Partial<Record<BreakpointKey, number>>;
  maxWidth?: number | string; // Si size === 'custom'
  fullWidth?: boolean;
  minWidth?: number | string;
  scroll?: 'body' | 'paper'; // Default: 'body'
  height?: number | string;
  maxHeight?: number | string;
  minHeight?: number | string;
  animationDuration?: number; // Default: 300ms
  overflowBehavior?: 'visible' | 'hidden' | 'auto';
  zIndex?: number; // Default: 50
  disableBackdropClick?: boolean;
  persistent?: boolean; // Bloquea ESC y backdrop
  className?: string;
  contentStyle?: React.CSSProperties;
  actions?: React.ReactNode; // Footer con acciones
  hideActions?: boolean;
  showCloseButton?: boolean;
  closeButtonText?: string;
  onCloseButtonClick?: () => void;
  'data-test-id'?: string;
}

type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
```

#### Tamaños Predefinidos

| Size | XS | SM | MD | LG | XL |
|------|----|----|----|----|-----|
| `xs` | 280px | 320px | 420px | 420px | 420px |
| `sm` | 320px | 420px | 520px | 640px | 640px |
| `md` | 360px | 520px | 640px | 800px | 800px |
| `lg` | 400px | 640px | 800px | 900px | 900px |
| `xl` | 450px | 800px | 900px | 1000px | 1024px |
| `xxl` | 585px | 1040px | 1170px | 1300px | 1331px |

#### Scroll Behavior

- **`body`**: Página mantiene scroll, dialog fijo en viewport
- **`paper`**: Dialog tiene scroll interno

#### Ejemplo de Uso

```tsx
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { Button } from '@/shared/components/ui/Button/Button';

const [open, setOpen] = useState(false);

// Dialog básico
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Confirmar acción"
  size="sm"
>
  <p>¿Estás seguro de continuar?</p>
</Dialog>

// Con acciones personalizadas
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Editar Producto"
  size="md"
  actions={
    <>
      <Button variant="text" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleSave}>
        Guardar
      </Button>
    </>
  }
>
  <CreateBaseForm fields={fields} values={values} onChange={handleChange} />
</Dialog>

// Dialog persistente (no cierra con backdrop o ESC)
<Dialog
  open={open}
  onClose={() => {}}
  title="Proceso en curso"
  persistent
  disableBackdropClick
>
  <DotProgress />
  <p>Por favor espera...</p>
</Dialog>

// Tamaño custom por breakpoint
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  size="custom"
  customSize={{
    xs: 300,
    sm: 500,
    md: 700,
    lg: 900,
    xl: 1100,
  }}
>
  <DataGrid columns={columns} rows={rows} />
</Dialog>

// Con scroll interno
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  scroll="paper"
  maxHeight="80vh"
>
  <div style={{ height: '2000px' }}>
    Contenido largo con scroll interno
  </div>
</Dialog>
```

---

## 📊 Visualización de Datos

### DataGrid

Tabla avanzada con filtrado, ordenamiento, paginación y acciones por fila.

#### Props

```typescript
interface DataGridProps {
  columns: DataGridColumn[];
  title?: string;
  rows?: any[];
  sort?: 'asc' | 'desc';
  sortField?: string;
  search?: string;
  filters?: string;
  height?: number | string;
  totalRows?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
  onSearchChange?: (search: string) => void;
  onFiltersChange?: (filters: string) => void;
  onRowClick?: (row: any) => void;
  loading?: boolean;
  enableSearch?: boolean;
  enableColumnFilters?: boolean;
  enablePagination?: boolean;
  paginationMode?: 'client' | 'server'; // Default: 'client'
}

export interface DataGridColumn {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  type?: DataGridColumnType;
  sortable?: boolean;
  editable?: boolean;
  filterable?: boolean;
  renderCell?: (params: any) => React.ReactNode;
  renderType?: 'currency' | 'badge' | 'dateString';
  valueGetter?: (params: any) => any;
  align?: 'left' | 'right' | 'center';
  headerAlign?: 'left' | 'right' | 'center';
  hide?: boolean;
  actionComponent?: React.ComponentType<{ row: any; column: DataGridColumn }>;
}

type DataGridColumnType = 
  | 'string'
  | 'number'
  | 'date'
  | 'dateTime'
  | 'boolean'
  | 'id';
```

#### Características

- ✅ Ordenamiento por columna
- ✅ Filtrado por columna (texto)
- ✅ Búsqueda global
- ✅ Paginación (cliente o servidor)
- ✅ Acciones por fila
- ✅ Renderizado custom de celdas
- ✅ Responsive con scroll horizontal
- ✅ Integración con URL search params (Next.js)

#### Componentes Internos

- `Header`: Barra de búsqueda y acciones
- `ColHeader`: Headers de columna con ordenamiento
- `Body`: Filas de datos
- `Footer`: Info de paginación y controles
- `Pagination`: Controles de página

#### Ejemplo de Uso

```tsx
import DataGrid, { DataGridColumn } from '@/shared/components/ui/DataGrid';
import IconButton from '@/shared/components/ui/IconButton/IconButton';

const columns: DataGridColumn[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    type: 'id',
  },
  {
    field: 'name',
    headerName: 'Nombre',
    flex: 1,
    minWidth: 200,
    sortable: true,
    filterable: true,
  },
  {
    field: 'price',
    headerName: 'Precio',
    width: 120,
    type: 'number',
    sortable: true,
    renderType: 'currency',
    align: 'right',
  },
  {
    field: 'status',
    headerName: 'Estado',
    width: 120,
    renderType: 'badge',
  },
  {
    field: 'createdAt',
    headerName: 'Fecha',
    width: 150,
    type: 'date',
    sortable: true,
    renderType: 'dateString',
  },
  {
    field: 'actions',
    headerName: 'Acciones',
    width: 120,
    actionComponent: ({ row }) => (
      <div className="flex gap-2">
        <IconButton
          icon="edit"
          size="sm"
          onClick={() => handleEdit(row.id)}
        />
        <IconButton
          icon="delete"
          size="sm"
          variant="text"
          onClick={() => handleDelete(row.id)}
        />
      </div>
    ),
  },
];

// Paginación del lado del cliente
<DataGrid
  title="Productos"
  columns={columns}
  rows={products}
  height={600}
  enableSearch
  enableColumnFilters
  enablePagination
  paginationMode="client"
/>

// Paginación del lado del servidor
<DataGrid
  columns={columns}
  rows={products}
  totalRows={totalCount}
  page={currentPage}
  pageSize={pageSize}
  onPageChange={(page) => setCurrentPage(page)}
  onPageSizeChange={(size) => setPageSize(size)}
  onSortChange={(field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  }}
  paginationMode="server"
/>

// Con renderizado custom
<DataGrid
  columns={[
    {
      field: 'avatar',
      headerName: 'Avatar',
      width: 80,
      renderCell: (params) => (
        <img 
          src={params.row.avatarUrl} 
          className="w-10 h-10 rounded-full"
          alt={params.row.name}
        />
      ),
    },
    ...otherColumns,
  ]}
  rows={users}
/>
```

---

### Badge

Insignia colorida para mostrar estados, categorías o etiquetas.

#### Props

```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

type BadgeVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info'
  | 'primary-outlined'
  | 'secondary-outlined'
  | 'success-outlined'
  | 'error-outlined'
  | 'warning-outlined'
  | 'info-outlined';
```

#### Variantes

| Variante | Color | Uso |
|----------|-------|-----|
| `primary` | Primario | Destacar |
| `secondary` | Secundario | Secundario |
| `success` | Verde | Éxito, activo |
| `error` | Rojo | Error, bloqueado |
| `warning` | Amarillo | Advertencia, pendiente |
| `info` | Azul | Información |
| `*-outlined` | Con borde | Variante outlined |

#### Ejemplo de Uso

```tsx
import Badge from '@/shared/components/ui/Badge/Badge';

// Estado de producto
<Badge variant="success">Activo</Badge>
<Badge variant="error">Inactivo</Badge>
<Badge variant="warning">Pendiente</Badge>

// Categoría
<Badge variant="primary-outlined">Arroz</Badge>
<Badge variant="secondary-outlined">Legumbres</Badge>

// En DataGrid
{
  field: 'status',
  headerName: 'Estado',
  renderCell: (params) => {
    const variant = params.value === 'active' ? 'success' : 'error';
    const label = params.value === 'active' ? 'Activo' : 'Inactivo';
    return <Badge variant={variant}>{label}</Badge>;
  },
}
```

---

### Alert

Mensaje de alerta con variantes de severidad.

#### Props

```typescript
interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
  "data-test-id"?: string;
}

type AlertVariant = "success" | "info" | "warning" | "error";
```

#### Variantes

| Variante | Color | Uso |
|----------|-------|-----|
| `success` | Verde | Operación exitosa |
| `info` | Azul | Información general |
| `warning` | Amarillo | Advertencia |
| `error` | Rojo | Error, fallo |

#### Características

- ✅ Overlay blanco translúcido para destacar
- ✅ CSS classes configurables por variante: `alert-success`, `alert-info`, etc.

#### Ejemplo de Uso

```tsx
import Alert from '@/shared/components/ui/Alert/Alert';

// Success
<Alert variant="success">
  Producto creado exitosamente
</Alert>

// Error
<Alert variant="error">
  No se pudo guardar el registro
</Alert>

// Warning
<Alert variant="warning">
  El stock está bajo
</Alert>

// Info
<Alert variant="info">
  Los cambios se guardarán automáticamente
</Alert>

// En formulario con errores
{errors.length > 0 && errors.map((error, index) => (
  <Alert key={index} variant="error">
    {error}
  </Alert>
))}
```

---

## ⏳ Feedback y Progreso

### DotProgress

Indicador de progreso animado con dots.

#### Props

```typescript
interface DotProgressProps {
  size?: number; // Tamaño de cada dot (default: 16px)
  gap?: number; // Espaciado entre dots (default: 8px)
  colorPrimary?: string; // Color activo (default: var(--color-primary))
  colorNeutral?: string; // Color inactivo (default: var(--color-neutral))
  className?: string;
  interval?: number; // Intervalo de animación (default: 350ms)
  totalSteps?: number; // Total de dots (default: 5)
  activeStep?: number; // Paso activo (si se proporciona, no anima)
}
```

#### Modos de Uso

1. **Animación automática**: Omitir `activeStep`
2. **Control manual**: Proporcionar `activeStep` para control estático

#### Ejemplo de Uso

```tsx
import DotProgress from '@/shared/components/ui/DotProgress/DotProgress';

// Animación automática
<DotProgress />

// Animación con configuración custom
<DotProgress
  size={20}
  gap={12}
  totalSteps={3}
  interval={500}
/>

// Control manual (sin animación)
<DotProgress
  totalSteps={5}
  activeStep={currentStep}
/>

// En dialog de carga
<Dialog open={isLoading} persistent>
  <div className="flex flex-col items-center gap-4 p-8">
    <DotProgress />
    <p>Cargando datos...</p>
  </div>
</Dialog>
```

### SplashScreen

Pantalla de carga inicial con branding y progreso visual.

#### Props

`SplashScreen` no recibe props en la implementación actual.

#### Ejemplo de Uso

```tsx
import SplashScreen from '@/shared/components/ui/SplashScreen/SplashScreen';

export default function LoadingScreen() {
  return <SplashScreen />;
}
```

#### Notas

- Es un componente cliente (`'use client'`).
- Renderiza el logo `/logo.svg` y reutiliza `DotProgress`.

---

## 📁 Gestión de Archivos

### MultimediaUploader

Componente para subir múltiples archivos (imágenes/videos) con preview.

#### Props

```typescript
interface MultimediaUploaderProps {
  uploadPath: string; // Ruta del endpoint de subida
  onChange?: (files: File[]) => void;
  label?: string;
  accept?: string; // Default: 'image/*,video/*'
  maxFiles?: number; // Default: 5
  maxSize?: number; // MB - Default: 9MB
  aspectRatio?: string; // Default: '16:9'
  buttonType?: 'icon' | 'button';
  variant?: 'default' | 'avatar' | 'banner'; // 'avatar' = circular, 'banner' = 16:9 rectangle
  previewSize?: 'xs' | 'sm' | 'normal' | 'lg' | 'xl'; // Default: 'normal'
}
```

#### Características

- ✅ Preview de imágenes y videos
- ✅ Validación de tamaño
- ✅ Validación de tipo MIME
- ✅ Límite de cantidad de archivos
- ✅ Eliminación individual de archivos
- ✅ Aspect ratio configurable
- ✅ Notificaciones de error integradas

#### Límites por Tipo

- **Imágenes**: 10MB por archivo
- **Videos**: 70MB por archivo

#### Ejemplo de Uso

```tsx
import MultimediaUploader from '@/shared/components/ui/FileUploader/MultimediaUploader';

// Subir imágenes de producto
<MultimediaUploader
  uploadPath="/api/upload/products"
  onChange={(files) => setProductImages(files)}
  label="Imágenes de producto"
  accept="image/*"
  maxFiles={5}
  maxSize={10}
  aspectRatio="1:1"
  buttonType="button"
/>

// Subir videos
<MultimediaUploader
  uploadPath="/api/upload/videos"
  onChange={(files) => setVideos(files)}
  accept="video/*"
  maxFiles={1}
  maxSize={70}
  aspectRatio="16:9"
/>

// Avatar (imagen pequeña)
<MultimediaUploader
  uploadPath="/api/upload/avatars"
  onChange={(files) => setAvatar(files[0])}
  accept="image/*"
  maxFiles={1}
  variant="avatar"
/>

// Banner rectangular 16:9
<MultimediaUploader
  uploadPath="/api/upload/banners"
  onChange={(files) => setBanner(files[0])}
  accept="image/*"
  maxFiles={1}
  variant="banner"
  aspectRatio="16:9"
  previewSize="lg"
/>  maxSize={2}
  aspectRatio="1:1"
  previewSize="sm"
  buttonType="icon"
  variant="minimal"
/>
```

---

### MultimediaUpdater

Componente para actualizar/reemplazar archivos existentes.

#### Props

```typescript
interface MultimediaUpdaterProps {
  uploadPath: string;
  currentFileUrl?: string;
  onRemove?: () => void;
  onChange?: (file: File) => void;
  label?: string;
  accept?: string; // Default: 'image/*'
  maxSize?: number; // MB - Default: 2MB
  aspectRatio?: string;
  buttonType?: 'icon' | 'button';
  variant?: 'default' | 'minimal';
  previewSize?: 'xs' | 'sm' | 'normal' | 'lg' | 'xl';
}
```

#### Características

- ✅ Preview del archivo actual
- ✅ Botón de cambio de archivo
- ✅ Botón de eliminación
- ✅ Validaciones idénticas a MultimediaUploader

#### Ejemplo de Uso

```tsx
import MultimediaUpdater from '@/shared/components/ui/FileUploader/MultimediaUpdater';

// Actualizar avatar de usuario
<MultimediaUpdater
  uploadPath="/api/upload/avatars"
  currentFileUrl={user.avatarUrl}
  onChange={(file) => setNewAvatar(file)}
  onRemove={() => setRemoveAvatar(true)}
  label="Foto de perfil"
  accept="image/*"
  maxSize={2}
  aspectRatio="1:1"
  previewSize="sm"
  buttonType="icon"
/>

// Actualizar imagen de producto
<MultimediaUpdater
  uploadPath="/api/upload/products"
  currentFileUrl={product.imageUrl}
  onChange={(file) => setProductImage(file)}
  onRemove={() => setProductImage(null)}
  maxSize={10}
  aspectRatio="16:9"
/>
```

---

## 🛠️ Utilidades Internas

### DropdownList

Componente interno usado por `AutoComplete` y `Select` para renderizar listas desplegables.

#### Props

```typescript
interface DropdownListProps {
  items: React.ReactNode[];
  open: boolean;
  maxHeight?: string; // Default: '300px'
  className?: string;
  zIndex?: string; // Default: 'z-20'
}
```

#### Uso

No se recomienda usar directamente. Es un componente interno.

```tsx
// Usado internamente por AutoComplete y Select
<DropdownList
  items={filteredOptions.map((opt, idx) => (
    <li key={opt.id} className={dropdownOptionClass}>
      {opt.label}
    </li>
  ))}
  open={isOpen}
  maxHeight="300px"
  zIndex="z-20"
/>
```

---

## 📐 Sistema de Z-Index

Jerarquía de capas para evitar conflictos de superposición:

| Capa | Z-Index | Componentes |
|------|---------|-------------|
| Base | `z-0` | TextField, Button, Badge |
| Elevado | `z-10` | Cards, contenido principal |
| Dropdown | `z-20` | AutoComplete, Select |
| TopBar Header | `z-30` | TopBar |
| TopBar Overlay | `z-40` | TopBar overlay |
| SideBar | `z-50` | SideBar, Dialog |

**Recomendaciones:**
- Mantener consistencia con la jerarquía
- Usar clases de Tailwind CSS para z-index
- Evitar valores arbitrarios de z-index

---

## 🎯 Mejores Prácticas

### Formularios

1. **Usar `CreateBaseForm` para generación dinámica:**
   ```tsx
   const fields: BaseFormField[] = [...];
   <CreateBaseForm fields={fields} values={values} onChange={handleChange} />
   ```

2. **Validación centralizada:**
   ```tsx
   const validate = (values: Record<string, any>) => {
     const errors: string[] = [];
     if (!values.name) errors.push('Nombre es requerido');
     if (values.price < 0) errors.push('Precio debe ser positivo');
     return errors;
   };
   
   <CreateBaseForm fields={fields} validate={validate} />
   ```

3. **Manejo de errores consistente:**
   ```tsx
   {errors.map((error, idx) => (
     <Alert key={idx} variant="error">{error}</Alert>
   ))}
   ```

### Navegación

1. **TopBar + SideBar para estructura principal:**
   ```tsx
   <TopBar title="App" menuItems={menuItems} />
   ```

2. **Tabs para navegación secundaria:**
   ```tsx
   <Tabs items={tabs} basePath="/products" />
   ```

### DataGrid

1. **Paginación del servidor para grandes datasets:**
   ```tsx
   <DataGrid
     paginationMode="server"
     totalRows={totalCount}
     onPageChange={fetchPage}
   />
   ```

2. **Acciones en línea con IconButton:**
   ```tsx
   {
     field: 'actions',
     actionComponent: ({ row }) => (
       <>
         <IconButton icon="edit" onClick={() => edit(row.id)} />
         <IconButton icon="delete" onClick={() => remove(row.id)} />
       </>
     ),
   }
   ```

### Diálogos

1. **Confirmar acciones destructivas con DeleteBaseForm:**
   ```tsx
   <Dialog open={openDelete} onClose={close}>
     <DeleteBaseForm message="¿Eliminar?" onSubmit={handleDelete} />
   </Dialog>
   ```

2. **Usar tamaños apropiados:**
   - `xs`, `sm`: Confirmaciones, alertas
   - `md`: Formularios simples
   - `lg`, `xl`: Formularios complejos, DataGrid

---

## 🔧 Configuración del Proyecto

### Requisitos

- **React**: 18+
- **Next.js**: 13+ (App Router)
- **TypeScript**: 5+
- **Tailwind CSS**: 3+
- **Material Symbols**: Iconos (CDN o npm)

### Instalación de Dependencias

```bash
npm install react react-dom next
npm install -D typescript @types/react @types/node tailwindcss
npm install leaflet react-leaflet # Para LocationPicker
npm install lucide-react # Para iconos adicionales
```

### Variables CSS Requeridas

```css
/* globals.css */
:root {
  --color-primary: #1976d2;
  --color-secondary: #dc004e;
  --color-background: #ffffff;
  --color-border: #e0e0e0;
  --color-neutral: #9e9e9e;
}
```

### Clases de Tailwind Personalizadas

```css
/* globals.css */
@layer components {
  .btn-contained-primary {
    @apply bg-primary text-white hover:bg-primary/90;
  }
  
  .btn-outlined {
    @apply border border-primary text-primary hover:bg-primary/10;
  }
  
  .alert-success {
    @apply bg-green-50 border-green-500 text-green-800;
  }
  
  .alert-error {
    @apply bg-red-50 border-red-500 text-red-800;
  }
  
  /* ... más clases */
}
```

---

## 📦 Estructura de Carpetas Recomendada

```
src/
  shared/
    components/
      ui/
        Alert/
          Alert.tsx
        AutoComplete/
          AutoComplete.tsx
        Badge/
          Badge.tsx
        BaseForm/
          CreateBaseForm.tsx
          UpdateBaseForm.tsx
          DeleteBaseForm.tsx
        Button/
          Button.tsx
          ButtonPill.tsx
        DataGrid/
          DataGrid.tsx
          DataGridWrapper.tsx
          index.ts
          components/
            Header.tsx
            Toolbar.tsx
            ColHeader.tsx
            Body.tsx
            RowActions.tsx
            Footer.tsx
            Pagination.tsx
          utils/
            columnStyles.ts
        Dialog/
          Dialog.tsx
          DialogToPrint.tsx
          ChangePasswordDialog.tsx
        DotProgress/
          DotProgress.tsx
        DropdownList/
          DropdownList.tsx
        FileUploader/
          MultimediaUploader.tsx
          MultimediaUpdater.tsx
        IconButton/
          IconButton.tsx
        LocationPicker/
          LocationPicker.tsx
          LocationPickerWrapper.tsx
        NumberStepper/
          NumberStepper.tsx
        RangeSlider/
          RangeSlider.tsx
        Select/
          Select.tsx
        SplashScreen/
          SplashScreen.tsx
        Switch/
          Switch.tsx
        Tabs/
          Tabs.tsx
        TextField/
          TextField.tsx
        TopBar/
          TopBar.tsx
          SideBar.tsx
```

---

## 🚀 Próximos Pasos

1. **Implementar tests unitarios** para cada componente
2. **Agregar Storybook** para documentación visual
3. **Crear ejemplos interactivos** en CodeSandbox
4. **Añadir modo oscuro** (dark mode)
5. **Internacionalización** (i18n)
6. **Mejoras de accesibilidad** (ARIA, keyboard navigation)

---

## 📝 Notas de Migración

### Desde versión anterior

Si migraste desde una versión anterior sin `BaseForm`, actualiza tus formularios:

**Antes:**
```tsx
<form onSubmit={handleSubmit}>
  <TextField label="Nombre" value={name} onChange={setName} />
  <TextField label="Email" value={email} onChange={setEmail} />
  <Button type="submit">Guardar</Button>
</form>
```

**Después:**
```tsx
<CreateBaseForm
  fields={[
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ]}
  values={{ name, email }}
  onChange={(field, value) => {
    if (field === 'name') setName(value);
    if (field === 'email') setEmail(value);
  }}
  onSubmit={handleSubmit}
/>
```

---

## 🤝 Contribuciones

Para contribuir:

1. Seguir la estructura de carpetas establecida
2. Añadir TypeScript types completos
3. Documentar props con JSDoc
4. Incluir ejemplos de uso
5. Mantener consistencia con el sistema de diseño

---

## 📄 Licencia

Este es un proyecto interno. No distribuir sin autorización.

---

**Documentación generada**: Febrero 2026  
**Versión**: 2.0
