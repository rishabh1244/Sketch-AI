# 🎨 **Sketch‑AI** – AI‑powered physics & math diagrams in the browser  

[![License](https://img.shields.io/github/license/your‑org/sketch‑ai?color=blue)](LICENSE)  
[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black?logo=nextdotjs)](https://nextjs.org)  
[![Supabase](https://img.shields.io/badge/Supabase-2.0-3ECF8E?logo=supabase)](https://supabase.com)  
[![OpenAI / OpenRouter](https://img.shields.io/badge/LLM-OpenAI%2FOpenRouter-FF5A5F?logo=openai)](https://openai.com)  
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwindcss)](https://tailwindcss.com)  

> **Sketch‑AI** lets you type a physics or mathematics concept (e.g. *simple harmonic motion*, *Lorenz attractor*) and instantly receive a fully‑featured, animated **Excalidraw** diagram.  
> The app handles authentication, stores sketches in Supabase, and runs the animation loop entirely on the client.

---  

## ✨ Introduction  

Sketch‑AI is a **Next.js 16** application built with:

* **React 19** – modern concurrent UI.  
* **Excalidraw** – the drawing canvas that renders the JSON diagrams.  
* **Supabase** – server‑less auth + PostgreSQL storage.  
* **OpenAI / OpenRouter** – LLM back‑end that converts a natural‑language prompt into a strict Excalidraw JSON schema (including physics‑based animation fields).  
* **TailwindCSS** – tiny, dark‑mode‑ready UI.  

> The core idea: *“Describe a concept → LLM generates JSON → client animates it.”*  

---  

## 🚀 Key Features  

- **🗣️ Prompt‑to‑Diagram** – type a concept, choose a model (Gemini, Llama, etc.) and get a ready‑to‑use diagram.  
- **⚙️ Physics‑aware animation** – the JSON includes `govern_x` / `govern_y` functions that are compiled and executed each frame.  
- **🔐 Auth & persistence** – Google OAuth via Supabase, each user gets a private sketch history.  
- **📦 Sample library** – a curated set of example pages (pendulum, Lorenz attractor, uranium atom, …).  
- **🖥️ Server‑less** – all heavy lifting (LLM request, DB writes) lives in API routes; the UI is fully static‑rendered.  
- **🔧 Extensible** – add new LLM providers, custom element palettes, or additional animation helpers with minimal changes.  

---  

## 🏗️ Architecture Overview  

```
src/
├─ app/
│   ├─ api/
│   │   ├─ llm/            ← LLM request → JSON generation
│   │   ├─ diagram/        ← GET latest sketch for the user
│   │   ├─ TEST_LLM/       ← Demo route using NVIDIA LLM (fallback)
│   │   └─ sample_diagram/ ← Serve static sample JSON
│   ├─ auth/
│   │   ├─ context/        ← React context for auth state
│   │   ├─ supabase/       ← client (browser) & server helpers
│   │   └─ AuthModal.tsx   ← Google sign‑in UI
│   ├─ canvas/             ← Main drawing page (Navbar + Excalidraw + LLM bar)
│   ├─ drawing/            ← Wrapper around Excalidraw, animation loop
│   ├─ LLM/                ← Floating prompt bar UI
│   ├─ landing_page/       ← Hero page with animated background & sample cards
│   └─ layout.tsx          ← Global layout + AuthProvider
├─ public/                 ← static assets (logo, favicons)
├─ styles/                 ← Tailwind + custom CSS modules
└─ utils/                  ← helper functions (prompt generation, etc.)
```

* **API routes** are **server‑only** (`app/api/.../route.ts`).  
* **Client components** (`"use client"`) handle UI, animation, and interaction with the API.  
* **Supabase** is used both on the server (`createServerClient`) and client (`createBrowserClient`) to keep auth state in sync.  

---  

## 🛠️ Tech Stack  

| Layer | Technology | Reason |
|------|------------|--------|
| **Framework** | **Next.js 16 (app router)** | File‑system routing, server components, built‑in API routes |
| **UI** | React 19, TailwindCSS, CSS Modules | Modern, fast, and easy theming |
| **Canvas** | `@excalidraw/excalidraw` | Open‑source diagram format + animation support |
| **Auth / DB** | Supabase (PostgreSQL + Auth) | Server‑less, simple OAuth, row‑level security |
| **LLM** | OpenAI / OpenRouter (any model) | Prompt‑to‑JSON generation, model‑agnostic |
| **Language** | TypeScript (strict) | Guarantees type safety across the whole stack |
| **Deployment** | Vercel (recommended) | Zero‑config, edge‑ready, supports Next.js 16 |

---  

## 📦 Prerequisites  

| Tool | Minimum version |
|------|-----------------|
| **Node** | `>=18` |
| **npm / yarn / pnpm / bun** | any modern package manager |
| **Supabase project** | with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set |
| **OpenRouter / OpenAI API key** | `OPENROUTER_API_KEY` (or `NVIDIA_KEY` for the test route) |
| **Git** | for cloning the repo |

---  

## ⚡ Installation  

```bash
# 1️⃣ Clone the repo
git clone https://github.com/your-org/sketch-ai.git
cd sketch-ai

# 2️⃣ Install dependencies (npm shown, but yarn/pnpm/bun work as well)
npm install            # or `yarn`, `pnpm install`, `bun install`

# 3️⃣ Create a .env.local file (copy from .env.example if present)
cp .env.example .env.local

# Edit .env.local and add:
NEXT_PUBLIC_SUPABASE_URL=https://<your‑project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your‑public‑anon‑key
OPENROUTER_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
# optional – NVIDIA LLM fallback
NVIDIA_KEY=nvapi-xxxxxxxxxxxx

# 4️⃣ Run the development server
npm run dev            # or `yarn dev`, `pnpm dev`, `bun dev`

# Open http://localhost:3000 in your browser
```

---  

## 📖 Usage Guide  

### 1️⃣ Sign‑in  

- Click **“Sign in with Google”** on the landing page or the navbar.  
- After the OAuth flow you’ll be redirected back; the user avatar appears in the top‑right corner.

### 2️⃣ Create a diagram  

1. Navigate to **`/canvas`** (or click *“New Sketch”* from the navbar).  
2. In the floating bar at the bottom:  
   - Type a natural‑language description, e.g. `Simple harmonic motion of a mass‑spring system`.  
   - Choose a model from the dropdown (Gemini‑flash, Qwen‑coder, etc.).  
   - Press **Enter** or click the **Send** button.  

```tsx
// Example fetch call (handled internally by LLM component)
await fetch("/api/llm", {
  method: "POST",
  body: JSON.stringify({
    USER_CONCEPT: "pendulum motion",
    LLM: "google/gemini-2.0-flash-001",
    SKETCH_NAME: "My Pendulum"
  })
});
```

3. The server calls the selected LLM, receives strict JSON, stores it in Supabase, and returns the diagram.  
4. The client receives a `diagram-updated` event, reloads the JSON, and the **animation loop** starts automatically.

### 3️⃣ Interact with the diagram  

- **Zoom / Pan** – use mouse wheel or touch gestures (Excalidraw view‑mode).  
- **Export** – UI options are hidden for a clean experience; you can add a custom export button if needed.  

### 4️⃣ View saved sketches  

- Click the user avatar → **“My Sketches”** (implementation left for you).  
- The API route `GET /api/diagram` returns the latest sketch for the signed‑in user.

### 5️⃣ Sample pages  

Visit `/sample_page#pendulum`, `/sample_page#lorenz`, etc., to see pre‑generated diagrams (served from `app/data/*.json`).  

---  

## 🛠️ Development Tips  

| Topic | How‑to |
|------|--------|
| **Add a new LLM model** | Extend `MODELS` in `app/LLM/llm.tsx` and ensure the model name is accepted by OpenRouter. |
| **Change animation logic** | Edit `gen_prompt` in `app/api/llm/prompt.ts` – the prompt defines the JSON schema. |
| **Custom UI components** | All UI lives under `app/*` as **client components** (`"use client"`). Add new pages in the `app/` folder, they become routes automatically. |
| **Deploy** | Push to GitHub → Vercel auto‑detects the Next.js project. Set the same environment variables in Vercel dashboard. |
| **Run lint** | `npm run lint` (ESLint config extends `eslint-config-next`). |
| **Testing** | The repo currently has no tests; you can add Jest + React Testing Library for component/unit tests. |

---  

## 🤝 Contributing  

We welcome contributions! Please follow these steps:

1. **Fork** the repository.  
2. **Create a feature branch**: `git checkout -b feat/awesome-feature`.  
3. **Install dependencies** (see *Installation*).  
4. **Make your changes** – keep TypeScript strictness (`npm run lint` should pass).  
5. **Add tests** if you introduce new logic.  
6. **Commit** with a clear message and push to your fork.  
7. **Open a Pull Request** – describe the problem, the solution, and any relevant screenshots.  

### Code Style  

- Use **Prettier** (the repo includes a default config).  
- Follow the existing **module‑CSS** pattern for component styles.  
- Keep API routes **pure** – avoid side‑effects outside the request lifecycle.  

### Reporting Bugs  

- Open an issue with a **clear title**, a short description, and steps to reproduce.  
- Include console logs or network traces if the error originates from the LLM or Supabase layers.  

---  

## 📜 License  

This project is licensed under the **MIT License** – see the `LICENSE` file for details.  

---  

### 🎉 Happy diagramming!  

If you enjoy Sketch‑AI, consider giving the repo a ⭐, sharing it with classmates, or contributing a new physics example.  

*— The Sketch‑AI maintainers*  
