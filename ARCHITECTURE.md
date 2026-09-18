# ARCHITECTURE.md

## 1. ¿Qué es este proyecto?
Este proyecto es un entorno de pruebas end-to-end (E2E) robusto basado en Playwright para validar el ecosistema de **Wanqara**, un sistema integral de Punto de Venta (POS) y administración (ERP ligero). Su propósito es automatizar los flujos de negocio tanto para la plataforma central (Dashboard Administrativo, POS de Retail y POS de Restaurante) como para los módulos operativos de los empleados (como aplicaciones para meseros). Las pruebas garantizan la calidad de los despliegues (mediante suites de *smoke* y *release*) y evitan regresiones.

## 2. Stack tecnológico
Las versiones principales detectadas en el `package.json` son:
- **Node.js**: `^26.6.1` (según los tipos `@types/node`)
- **Playwright Test**: `^1.49.0`
- **TypeScript**: `^6.0.3`
- **ESLint**: `^9.0.0`
- **Knip**: `^6.36.0` (Para encontrar dependencias/exports no usados)

## 3. Módulos principales
- **Wanqara**: Es el módulo principal (core). Contiene las pruebas para el entorno de administración centralizada (`Admin-Inventory`, flujos de finanzas, productos, usuarios) y los puntos de venta (`POS-Retail`, `POS-Restaurant`).
- **WanqaraChef**: Módulo enfocado a las operaciones de restaurantes desde el punto de vista del empleado (meseros). Se divide en perfiles de estación de trabajo compartida (`Workstation`) y perfiles de uso personal (`Personal`).
- **WanqaraKDS**: Directorio existente en `e2e/`. Presuntamente destinado para el "Kitchen Display System" (pantallas de cocina), aunque no posee proyectos configurados en `playwright.config.ts`.
- **WanqaraCentral**: Directorio existente en `e2e/`. Presuntamente para pruebas de administración global o franquicias multi-tenant, pero sin configuración activa explícita.

## 4. Estructura del harness global
El arnés global ubicado en `e2e/Wanqara/harness/` es el motor del framework:

- **`config/`**: Contiene la configuración estática de negocio (ej. `default-branches.json` mapea roles, y `timeouts.ts` centraliza los tiempos de espera explícitos del framework).
- **`types/`**: Dominio estricto de tipos TypeScript. Alberga las *Discriminated Unions* para escenarios (`scenarios.types.ts`), interfaces de negocio y UI, exportados mediante un barril puro (`index.ts`). Este directorio aísla los contratos de datos de la lógica de implementación.
- **`fixtures/`**: Provee el estado inicial para las pruebas mediante custom fixtures de Playwright. Por ejemplo, `admin.fixture.ts` inicializa la sesión, intercepta la carga de la página, inyecta `authType`, y espera explícitamente a que el menú de navegación sea visible antes de entregar el control al test.
- **`setups/`**: Contiene los proyectos de configuración global (ej. `common-setup.ts`, `actors.setup.ts`, `chef-auth.setup.ts`). Estos archivos se encargan de iniciar sesión una única vez, validar la configuración y persistir las *cookies* de sesión en disco.
- **`helpers/`**: Lógica compartida y utilidades:
  - `auth/`: Controla la persistencia de las sesiones (`session-cache.ts`) y la lógica de login específica (`auth.ts`, `chef-auth.ts`).
  - `crud/`: Flujos comunes de pantallas de datos (`crud-helpers.ts`), como `searchInList`, `deleteRecordFromList` y `saveFormAndVerify`.
  - `ui/`: Abstracciones puras sobre elementos de Vuetify (`ui-helpers.ts`), como seleccionar de un dropdown (`selectDropdownOption`), validar snackbars (`expectSnackbar`), y esperar a la red (`clickAndWaitForApi`).
  - `reporting/`: Helpers para inyectar metadatos y anotaciones a Playwright (reportes, integración con tickets de Jira/TestRail).
  - `workflows/`, `people/`, `factories/`, `verifications/`: Patrones reutilizables para construir tests complejos sin acoplar lógica a un archivo `.spec.ts` en particular.

## 5. Estructura de tests
Dentro de la carpeta principal (ej. `e2e/Wanqara/`):

- **`regression/`**: Tests de regresión agrupados por módulo (`inventory`, `finance`, `POS`). Sigue una arquitectura modular por funcionalidad:
  - `0-json-data/`: Datos de prueba en JSON, inyectados mediante Data-Driven Testing.
  - `docs/`: (Donde aplica) Documentación de las reglas de negocio evaluadas.
  - `harness/`: Helpers exclusivos para ese módulo (ej. `recipe-helpers.ts`).
  - `*.spec.ts`: Especificaciones finales sin datos *hardcodeados*.
- **`smoke/`**: Tests ultra-rápidos que verifican el camino feliz o disponibilidad básica (ejecutados vía `--project=Smoke --workers=2`).
- **`specific-cases/`**: Tests aislados para flujos muy específicos, validaciones puntuales de release (`SpecificCases-Release`) o casos que requieren una sesión 100% limpia sin caché.
- **`tools/`**: Utilidades auxiliares ejecutables (probablemente inyección de semillas o purgado de ambientes).

## 6. Sistema de autenticación
El sistema utiliza el almacenamiento de estado (`storageState`) de Playwright de forma sofisticada:
1. **Setups por dependencia**: En el `playwright.config.ts`, los proyectos de prueba dependen de los proyectos de setup (`dependencies: ['setup-actors']`).
2. **Sistema de Caché**: `common-setup.ts` llama a `isSessionFresh()` para validar si existe una caché local viva en `e2e/Wanqara/harness/.auth/`. Si es así, salta el login pesado, lo cual reduce el tiempo de ejecución drásticamente.
3. **Roles y Sucursales**: Dependiendo del `authType` solicitado (ej. administrador vs cajero), el sistema busca en `default-branches.json` la sucursal por defecto, ejecuta el login y cambia la vista de la aplicación a esa sucursal particular (`loginAndSelectSubsidiary`).
4. **Grupos Dinámicos**: En los tests (vía `test-generator.ts`), los escenarios se agrupan por `loginMode` (`cached` o `fresh`) y por rol para optimizar el reúso del `storageState`.

## 7. Patrones de diseño identificados
- **Data-Driven Testing (DDT)**: Totalmente centralizado en `generateDataDrivenTests` (`harness/helpers/test-generator.ts`). Permite que un solo bloque `test()` ejecute múltiples casos definidos en JSON puro.
- **Fixture Composition Pattern**: Fixtures extendidos (ej. `admin.fixture.ts`) envuelven la inicialización completa. El test solicita `({ adminApp })`, y Playwright le inyecta una página que *ya está* logueada y ubicada en `/admin/home`.
- **Workflow Helpers (No POM Estricto)**: En lugar del clásico Page Object Model (clases por cada vista), el proyecto emplea funciones exportadas compuestas enfocadas en "acciones" o "workflows" (ej. `deleteRecordFromList` en `crud-helpers.ts`). Es mucho más idiomático y fácil de componer.
- **Explicit API Waiters**: Patrón asíncrono para lidiar con el framework frontend (Vuetify). Ejemplificado en `clickAndWaitForApi` (`ui-helpers.ts`), garantiza la sincronización escuchando la red (`page.waitForResponse`) en lugar de depender de esperas artificiales (`waitForTimeout`).

## 8. Flujo de datos en los tests
El flujo de consumo de datos es puramente *Data-Driven*:
1. En un archivo como `recipe-decimals-validation.spec.ts`, se lee de forma estática (con `fs.readFileSync`) un archivo ubicado en `0-json-data/recipe-decimals.json`.
2. El array deserializado se pasa a `generateDataDrivenTests()`.
3. El generador orquesta bloques `test.describe`, agrupando escenarios y pasando `test.use(scenarioOptions)` (inyectando así configuraciones ambientales a nivel bloque).
4. Dentro del bloque `test()`, el código de la prueba accede de forma segura a `scenario.recipeData`, pasando esas variables directamente a las funciones helper (`navigateToProductAndVerifyRecipeDecimals`).

## 9. Convenciones de nomenclatura
- **Archivos de Código/Tests**: Utilizan formato `kebab-case` para ser amigables con URLs y sistemas de archivos POSIX (`common-setup.ts`, `crud-helpers.ts`, `recipe-decimals-validation.spec.ts`).
- **Directorios**: Utilizan `kebab-case` (`specific-cases`, `products-services`).
- **Archivos prioritarios**: Uso del prefijo `0-` en carpetas como `0-json-data` para asegurar que el IDE las ordene al inicio de la estructura del árbol.
- **Funciones y Variables en TS**: Utilizan formato estándar de TypeScript `camelCase` (`expectSnackbar`, `searchInList`, `loginMode`).
- **Metadatos en Títulos**: El generador añade prefijos a los nombres de los test `[WS-XXX - ID-XXX]` utilizando *metadata tags*, útil para vincular los fallos en CI directamente con tickets en Jira/Linear.

## 10. Problemas y deuda técnica detectados

- **Abuso de `any` y tipado débil en el Core**: El orquestador de pruebas dinámicas (`test-generator.ts`) rompe la seguridad de tipos repetidamente con variables como `stageSetupOptions: unknown`, y firma métodos con `any` (`generateDataDrivenTests<ScenarioData, any>`). Esto anula las ventajas de TypeScript a nivel de validación de *fixtures*.
- **Supresión Silenciosa de Errores (Anti-Pattern)**: En `harness/helpers/ui/ui-helpers.ts`, existen múltiples cadenas de promesas seguidas de `.catch(() => {})` (Líneas 68-69 y dentro de bucles try-catch en `crud-helpers.ts`). Ocultar fallos visuales o interacciones erróneas causa "falsos positivos" donde la prueba no falla explícitamente pero la UI no se comportó como se esperaba.
- **Acoplamiento de Fixtures a Estructura DOM**: El archivo `admin.fixture.ts` contiene una espera global (`waitFor({ state: "visible" })`) por los localizadores `.v-navigation-drawer, .v-app-bar`. Si una página no requiere esta barra de navegación (ej. un módulo limpio), todas las pruebas fallarán por *timeout*, limitando la flexibilidad del fixture.
- **Directorios Fantasma**: Carpetas principales como `WanqaraKDS` y `WanqaraCentral` no tienen proyectos configurados en el archivo `playwright.config.ts`, resultando en código inalcanzable o "muerto" a nivel E2E actual.
- **Dependencia implícita en importaciones inconsistentes**: Archivos como `common-setup.ts` contienen alias con rutas largas y relativas mixtas, y se observó un intento fallido de acceder a `pos-auth.ts`, evidenciando módulos renombrados o "refactors" dejados a medias.
- **Manejo Frágil del Entorno**: En `playwright.config.ts`, variables como `rawWanqaraUrl` asumen que siempre estarán disponibles o no fallan ruidosamente si `process.env` está vacío. Tampoco hay validación de esquema de variables (tipo *Zod*) en la carga del `.env`.

## 11. Sistema de tipos que debe usarse
Dada la naturaleza guiada por datos (JSON) del framework, el sistema actual con `any` y `unknown` representa un riesgo alto. Se debe migrar hacia una arquitectura de tipos estricta:

1. **Validación en Tiempo de Ejecución (Zod/Yup)**: Al cargar archivos `.json` mediante `JSON.parse()`, el motor de Node asume un tipo `any`. Se deben crear esquemas con *Zod* (ej. `ScenarioSchema.parse(scenarios)`) para validar que el JSON tenga exactamente las llaves requeridas antes de que inicie la ejecución de Playwright, evitando fallos a mitad de prueba por campos omitidos o mal escritos.
2. **Uniones Discriminadas (Discriminated Unions)**: En lugar de interfaces gigantes llenas de campos opcionales, el framework implementa uniones discriminadas (`ScenarioDefinition = PosScenario | AdminScenario | StageScenario`) exportadas desde `types/scenarios.types.ts`. Esto asegura que los *payloads* respeten el contexto de la prueba de forma estricta en el orquestador.
3. **Tipos Literales para el Estado (Literal Types)**: Las opciones de los *fixtures* y el JSON (como `authType`, `loginMode`) no deben ser un `string` abierto. Deben ser limitados mediante literales (`type AuthType = 'actor1' | 'actor2' | 'admin'`) para prevenir errores de tipeo que impidan inyectar la caché correcta.
4. **Eliminación del Anti-patrón \`any\` en Genéricos**: La firma del orquestador `generateDataDrivenTests` ha sido refactorizada para inferir `TestType<Fixtures, WorkerFixtures>` directamente de Playwright. Además, se aplican conversores estrictos en las inyecciones dinámicas (`Parameters<typeof test.use>[0]`), erradicando la evasión de chequeos de Playwright que existía con el uso de `any`.
5. **Organización de Archivos y Carpetas de Tipos (Separación de Concerns)**: Para escalar correctamente y evitar importaciones circulares, los dominios de tipos han sido extraídos a un directorio dedicado (`e2e/Wanqara/harness/types/`). Allí residen los contratos de autenticación (`auth.types.ts`), tipos de esquemas JSON y *Discriminated Unions* (`scenarios.types.ts`), y tipos compartidos de UI (`ui.types.ts`), manteniendo la lógica de ejecución limpia y centralizada a través del barril `index.ts`.
6. **Estandarización Estricta de Datos (Archivos JSON)**: Todos los archivos estáticos en los directorios `0-json-data/` han sido unificados para incluir explícitamente el tipo de fixture (`admin`, `pos`, `stage`) y evitar cadenas de texto mágicas o vacías (como `loginMode: "none"` en lugar de `""`). Esto previene fallos silenciosos y permite que el sistema de tipos enrute los escenarios correctamente.
7. **Remediación de Deuda Técnica (Linter)**: Se eliminaron los errores críticos de TypeScript y se removieron los timeouts estáticos en helpers clave para cumplir QA_RULES, pasando exitosamente el linter.
8. **Desacoplamiento de Fixtures (Inversión de Dependencias)**: Los fixtures globales (`pos.fixture.ts` y `stage.fixture.ts`) han sido desacoplados de módulos específicos. Ahora utilizan funciones inyectables (`cashRegisterSetup`, `createChefOrderHook`, etc.) configuradas explícitamente desde cada archivo de pruebas (specs) a través de `test.use()`. Adicionalmente, el `admin.fixture.ts` desacopló su validación de estado inicial, haciendo el `readinessSelector` configurable.

9. **Validación de Esquema JSON con Zod**: Se ha integrado Zod para validar estrictamente la estructura de los archivos JSON de datos antes de que Playwright inicie la ejecución. Los specs ahora utilizan parseScenarios asegurando que cualquier JSON malformado se detenga en tiempo de carga con un error claro.

10. **Patrón de Doble `test.use()` y `FlatScenario`**: Se ha estandarizado la restricción `T extends FlatScenario` en el orquestador (`test-generator.ts`). Para soportar retrocompatibilidad con archivos JSON heredados sin forzar el discriminador `fixture`, el orquestador emplea un patrón de doble `test.use()`: uno a nivel de grupo (heredado) y otro en caliente dentro del bloque `test.describe` por cada escenario iterado, eliminando la necesidad del `any` y previniendo el error TS2769 de Playwright.

## 12. Locators Intocables (Política de Modificación)

**REGLA DE ORO:** Está estrictamente prohibido modificar los selectores de DOM listados en esta sección sin revisión arquitectónica previa y explícita. El motor del framework depende de su estabilidad. 

**Enforcer / Regla:** Cualquier Pull Request que modifique estos archivos debe ser marcado con advertencia de revisión estricta por los reviewers. Todos los locators están protegidos como "solo-lectura" para los scripts de mantenimiento diarios.

### Locators Protegidos por Archivo:

**`harness/helpers/auth/auth.ts`**
- `input[type="email"]`, `input[type="password"]`
- `.tw-text-sm.tw-font-semibold`
- `div.tw-space-y-3.tw-mb-8.tw-max-h-64.tw-overflow-y-auto` y sus hijos `.v-card`
- `header` y sus hijos (`button` con texto Wanqara)
- `.v-overlay__content`
- `.v-select`
- `.v-snackbar`
- Selectores por rol: `button` (Iniciar, Continuar, Cerrar Sesión)

**`harness/helpers/crud/crud-helpers.ts`**
- Selectores de tabla: `.v-data-table__tr`, `td`
- Selectores de menú de acciones: `.speed-dial-container`, `.mdi-dots-vertical`, `.mdi-dots-horizontal`
- Localizadores de Vuetify globales: `.v-overlay-container .v-overlay--active`, `.v-overlay__content`
- Botones de acción genéricos: `button.v-btn`, `.mdi-delete`, `.mdi-trash-can`, `.mdi-pencil`, `.mdi-eye`, `.mdi-details`
- Selectores por rol: `textbox` (Busca lo que necesites...), `button` (Guardar, Confirmar)
- Textos explícitos: `"No hay datos disponibles"`

**`harness/helpers/ui/ui-helpers.ts`**
- Interfaz global de Vuetify: `.v-overlay-container .v-overlay--active`, `[role="option"]`
- Alertas y Snackbars: `.v-snackbar`, `.v-btn.v-btn--flat.v-btn--icon.v-btn--slim` (Botón de cierre del snackbar)

**`harness/fixtures/stage.fixture.ts`**
- Selectores por texto/rol: `/Cliente:/i`, `button` (Abrir Caja)



