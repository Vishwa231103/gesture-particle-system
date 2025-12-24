# 🎥 Gesture-Controlled 3D Particle System

An interactive real-time **3D particle visualization** built with **Three.js** and **MediaPipe Hands**, where **hand gestures control particle behavior, shapes, and motion** directly through the webcam.

This project demonstrates **computer vision + creative coding + real-time graphics**, inspired by modern AI and immersive UI demos.

---

## ✨ Features

- 🖐 **Real-time hand tracking** using MediaPipe
- 🔄 **Smooth particle morphing** between shapes
- 🧠 **Gesture-based controls**
  - Open palm → expand particles
  - Closed hand → collapse particles
  - Pinch → color variation
  - **Flip palm ↔ back of hand → switch particle template**
- 💫 **Particle templates**
  - Sphere
  - Heart
  - Flower
  - Saturn
  - Fireworks
- 🎥 **Picture-in-Picture camera preview** (bottom-left)
- ⚡ Optimized for smooth performance
- 🌐 Fully client-side (no backend required)

---

## 🛠 Tech Stack

- **Three.js** — 3D rendering & particle system
- **MediaPipe Hands** — hand detection & gesture tracking
- **Vite** — fast build tool
- **JavaScript (ES Modules)**
- **HTML5 + CSS3**

---

## 🚀 Live Demo

🔗 **Live URL:**  
👉 *(Add your Vercel deployment link here)*

> ⚠️ Please allow **camera access** when prompted.  
> Best experienced on **desktop Chrome / Edge**.

---

## 🧩 How It Works

1. MediaPipe detects hand landmarks from the webcam
2. Gestures are translated into numeric states:
   - `pinch`
   - `openness`
   - `depth`
   - `hand orientation (palm / back)`
3. These values dynamically control:
   - Particle scale
   - Color interpolation
   - Shape morphing
4. Smooth interpolation (lerp) ensures cinematic transitions between templates

---

## 📦 Installation & Local Setup

```bash
# Clone the repository
git clone https://github.com/your-username/gesture-particle-system.git

# Navigate to project folder
cd gesture-particle-system

# Install dependencies
npm install

# Start development server
npm run dev
