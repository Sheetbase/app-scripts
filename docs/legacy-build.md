# Legacy build

Command: `sheetbase-app-scripts-legacy build`

## How?

### Build a module

Script: `sheetbase-app-scripts-legacy build [--bundle]`

Sample module: https://github.com/sheetbase/module-utils-server

Build the module for distribution to GAS and NPM.

- Get export name, for example: **Foo**.
- Generate description comment block from info provided by package.json **(0)**.
- Read src/index.ts (if exists) **(1)**.
- Read src/example.ts (if exists) **(2)**.
- Read src/global.ts (if exists) **(3)**.
- Read all file in src/ excepts *types/*, *index.ts*, *example.ts*, *global.ts* **(4)**.
- Concat all **(4)** content to form main code **(5)**.
- Build module code **(6)**.

	```ts
	export function FooModule(/** params if exist */) { 
		// (5)
		// (1)
		return moduleExports || {};
	}
	```
- Build NPM output (deploy to NPM) **(7)**.

	```ts
	// (0)
	// (6)

	// if omit --no-init, then:
	// add 'Foo' to the global namespace
	((process) => {
		process['Foo'] = FooModule(/** params if exist */);
	})(this);

	// (3)
	```
- Build GAS output (deploy as a library) **(8)**.

	```ts
	// (6)

	// if omit --no-init, then:
	// add exports to the global namespace
	((process) => {
		const Foo = FooModule(/** params if exist */);
		for (const prop of Object.keys({... Foo, ... Object.getPrototypeOf(Foo)})) {
			process[prop] = Foo[prop];
		}
	})(this);

	// (3)
	```

- Compile **(7)** and save to *sheetbase.module.js*.
- Compile **(8)** and save to *dist/<export_name>.js*.
- Compile **(0)** + **(2)** and save to *dist/@index.js*.
- Copy .clasp.json and appsscript.json to *dist/*.
- Copy dependencies to *dist/@modules/* or bundled to *dist/@modules.js*.

### Build a module (vendor)

Script: `sheetbase-app-scripts-legacy build --vendor [--bundle]`

Sample module: https://github.com/sheetbase/module-md5-server

Like build a module, but:

- Vendor code lives in .js file. And included in output as is.
- Usually build README with the *--no-docs* flag.

### Build an app

Script: `sheetbase-app-scripts-legacy build --app [--bundle --no-polyfill]`

Like build a module, but:

- Without wrapped code inside `...Module()` function.
- Without saving sheetbase.module.js file.
- May add *polyfill* module.

### Build README file

Script: `sheetbase-app-scripts-legacy readme [--no-docs]`

Generate the README.md file.

- Get export name.
- Read blocks (see [blocks](#blocks)).
- Read *name*, *description*, *git url* (*docs url*), *homepage*, *license* from package.json.
- Read *scriptId* from .clasp.json.
- Read Google scopes *oauthScopes* from appsscript.json.
- Read examples from src/example.ts.
- Get API overview from src/types/.

#### Blocks

##### Header

Will be included after description section.

- Started with: `<!-- block:header -->`

- Ended with: `<!-- /block:header -->`

##### Center

Will be included after install section.

- Started with: `<!-- block:center -->`

- Ended with: `<!-- /block:center -->`

##### Footer

Will be included at the bottom.

- Started with: `<!-- block:footer -->`

- Ended with: `<!-- /block:footer -->`

### Push to GAS

Script: `sheetbase-app-scripts-legacy push`

Push content inside *dist/* folder using [@google/clasp](https://github.com/google/clasp).

### Build docs

Sample script: `typedoc ./src --out ./docs --mode file --target ES6 --excludeExternals --excludeNotExported --ignoreCompilerErrors`

Generate docs/ folder using [Typedoc](https://github.com/TypeStrong/typedoc).

## Project structure

### **dist/**

Generated using app-scripts.

Distribution folder to be deployed to Google Apps Script. Always run '*clasp push*' in this folder.

### **docs/** (optional)

Manualy documentation or generated using [Typedoc](https://github.com/TypeStrong/typedoc).

### **src/**

Project main code.

#### **src/types/** (optional)

Put all type-related code in this folder and will be ignored when build code.

#### **src/index.ts** (optional)

Module export logic, must have a name of **moduleExports**.

```ts
export const moduleExports = MyAwesomeModuleExports;
```

#### **src/global.ts** (optional)

Code will be included at the top level of output code when build.

#### **src/example.ts** (optional)

Usage examples, will be included in README.md and dist/@index.js.

```ts
export function example1() {}
export function example2() {}
// ...
export function exampleN() {}
```

#### **src/\*\*/\*.ts** (optional)

Any other *.ts* file will be wrapped inside **<module_export_name>Module()** function.

```ts
function MyAwesomeModule() {

	/** Class 1 */
	/** Class 2 */
	// ...
	/** Class N */

	/** moduleExports */
	return moduleExports || {};
}
```

#### **src/\*.js** (optional)

Usually a vendor module code. Sample file: https://github.com/Sheetbase/module-md5-server/blob/master/src/md5.min.js

### **.clasp.json**

[@google/clasp](https://github.com/google/clasp) config file, will be copied to *dist/* folder.

### **.claspignore**

[@google/clasp](https://github.com/google/clasp) ignore file, prevent accidentially push the root folder, only run push '*clasp push*' inside the *dist/* folder.

### **appsscript.json**

GAS meta file, will be copied to *dist/* folder.

### **index.ts**

Module exports for developing against Typescript.

### **sheetbase.module.js**

Module compiled code for using with npm, generated when build code without *--app* flag (build a module).