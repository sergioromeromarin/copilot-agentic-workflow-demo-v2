# DragonballClient

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.


## Paginación de Personajes

La consulta de personajes soporta paginación. El frontend solicita los datos usando los parámetros `page` y `pageSize`, y muestra controles de navegación para avanzar, retroceder, ir a la primera y última página.

**Ejemplo de uso:**
```js
characterManager.loadCharacters(2); // Carga la página 2
```

**Respuesta esperada del backend:**
```json
{
	"items": [ ... ],
	"meta": {
		"totalItems": 58,
		"itemCount": 12,
		"itemsPerPage": 12,
		"totalPages": 5,
		"currentPage": 2
	},
	"links": {
		"first": "...",
		"previous": "...",
		"next": "...",
		"last": "..."
	}
}
```

**Controles de paginación:**
- Los botones de navegación usan los enlaces proporcionados por el backend.
- El usuario puede cambiar de página y el frontend actualizará la vista automáticamente.
- Se han añadido botones para navegar a la primera y última página.

**Notas:**
- El tamaño de página por defecto es 12.
- Si la consulta falla, se muestra un mensaje de error.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
