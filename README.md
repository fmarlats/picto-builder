# Expedition 33 Builds

Expedition 33 Builds is a web-based build planner and sharing tool for the game *Clair Obscur: Expedition 33*. It lets you experiment with characters, skills, Pictos, and Luminas, and share complete builds via a single URL.

## 1. Project Overview

Expedition 33 Builds provides an interactive interface to plan and communicate in-game builds:

- Select a **character** from the available roster.
- Pick up to **6 skills** for that character, each with its **AP cost** and effect description.
- Browse all available **Pictos**, including their levels and attribute values.
- Mark Pictos as **Luminas** (for cost tracking) or as **Pictos** (for attribute summaries) using distinct selection modes.
- See a live **summary view** of your chosen character, skills, Pictos, Lumina total cost, and aggregated attributes.
- **Share builds via URL encoding**: the entire build (selected items, levels, title, and comments) is encoded into the URL so others can open it and see exactly the same configuration.

The production site is available at: https://www.expedition33builds.com

## 2. Data Files

The application loads its game data from static JSON files under `src/assets`.

### 2.1 `characters.json`

- **Path:** `src/assets/characters.json`
- **Purpose:** Defines the available playable characters and their skills.
- **Structure (per character):**
  - `id` *(number)* – unique character identifier.
  - `name` *(string)* – character name (e.g. `"Gustave"`).
  - `icon` *(string)* – filename for the character image (e.g. `"gustave.avif"`), resolved in the UI via a local asset map.
  - `skills` *(array of objects)* – list of skills available to this character.
- **Structure (per skill in `skills`):**
  - `id` *(number)* – unique numeric skill ID (used for selection and URL encoding).
  - `name` *(string)* – skill name.
  - `full_url` *(string)* – link to an external database entry for the skill.
  - `effect` *(string)* – full text description of the skill effect.
  - `cost` *(number)* – AP cost of the skill, shown as `AP` in the UI.

### 2.2 Picto data (`pictos_list.json`)

Although the UI conceptually works with "pictos" and "luminas", all underlying picto data is stored in a single JSON file:

- **Path:** `src/assets/pictos_list.json`
- **Purpose:** Defines all Pictos used both for picto selection and Lumina selection.
- **Structure (per picto):**
  - `id` *(number)* – unique numeric identifier for the picto; used as the base for UI IDs like `picto-<id>` and in URL encoding.
  - `name` *(string)* – picto name.
  - `type` *(string)* – type/category label (e.g. `"offensive"`, `"support"`, or combined types such as `"offensive / support"`).
  - `full_url` *(string)* – link to an external database entry for the picto.
  - `effect` *(string)* – textual description of the main effect.
  - `cost` *(number)* – Lumina cost used when the picto is selected as a Lumina.
  - `attributes` *(array)* – level-dependent attribute values:
    - Each entry has:
      - `level` *(string)* – level label (e.g. `"1"`, `"2"`, `"3"`, ...).
      - `attributes` *(object)* – map of attribute name → value at that level.

These fields power:
- The picto cards (name, type, effect, and cost).
- The level modal and level selector.
- Aggregated attribute and total Lumina cost calculations in the side and summary panels.

### 2.3 Lumina data (`luminas.json` concept)

There is currently **no separate** `luminas.json` file in the repository. Instead, the concept of a Lumina is represented by selecting picto entries from `src/assets/pictos_list.json` as Luminas:

- When you select a picto as a **Lumina**, the app uses:
  - the picto's `name` as the Lumina name, and
  - the picto's `cost` as the Lumina cost.
- The total Lumina cost shown in the UI is the sum of `cost` values of all pictos currently selected as Luminas.

If you introduce a dedicated Lumina data file in the future, it will likely live at `src/assets/luminas.json` and contain, for each Lumina, at least:
- `id` *(number)* – unique Lumina identifier.
- `name` *(string)* – Lumina name.
- `cost` *(number)* – Lumina cost value used in total-cost calculations.

## 3. Installation and Running

This project is a Vue 3 + TypeScript + Vite application. It can be developed and built locally using Node.js and the standard npm scripts defined in `package.json`. Docker and Make are not required.

### 3.1 Prerequisites

- **Node.js** 20 LTS or newer (matches the CI configuration).
- **npm** (comes with Node.js).
- (Optional) **Yarn** – if you prefer, but the examples below use npm.

### 3.2 Install dependencies

From the project root:

```bash
npm install
```

This installs all project dependencies into `node_modules/` using the `package-lock.json` file.

### 3.3 Run the development server

To start the Vite development server:

```bash
npm run dev
```

By default this starts Vite on `http://localhost:5174` (as configured in `vite.config.ts`). Open that URL in your browser to use the app.

### 3.4 Build for production

To create an optimized production build:

```bash
npm run build
```

The built static assets are emitted to the `dist/` directory.

### 3.5 Preview the production build locally

To serve the contents of `dist/` locally using Vite's preview server:

```bash
npm run preview
```

This runs the preview server on `http://localhost:4174`. Open that URL in your browser to verify the production build.
