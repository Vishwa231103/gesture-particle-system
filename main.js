import * as THREE from 'three'

// DOM ELEMENTS
const video = document.getElementById('video')
const handCanvas = document.getElementById('output')
const handCtx = handCanvas.getContext('2d')
const threeCanvas = document.getElementById('three')

// CAMERA PREVIEW SIZE
const CAM_WIDTH = 220
const CAM_HEIGHT = 160

handCanvas.width = CAM_WIDTH
handCanvas.height = CAM_HEIGHT


// GESTURE STATE
const gestureState = {
  pinch: 0,
  openness: 0,
  depth: 0,
}

// HAND ORIENTATION STATE
let handFacing = 'palm'
let lastHandFacing = 'palm'
let lastSwitchTime = 0

// UTILITY

function distance(a, b) {
  if (!a || !b) return 0
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = (a.z || 0) - (b.z || 0)
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// MEDIAPIPE HANDS
const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
})

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
})

// HAND RESULTS
hands.onResults((results) => {
  handCtx.clearRect(0, 0, CAM_WIDTH, CAM_HEIGHT)

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    gestureState.pinch *= 0.9
    gestureState.openness *= 0.9
    gestureState.depth *= 0.9
    return
  }

  const lm = results.multiHandLandmarks[0]

  drawConnectors(handCtx, lm, HAND_CONNECTIONS, {
    color: '#00f2ff',
    lineWidth: 2,
  })

  drawLandmarks(handCtx, lm, {
    color: '#ffffff',
    radius: 3,
  })

  const wrist = lm[0]
  const thumb = lm[4]
  const index = lm[8]
  const middle = lm[12]

  gestureState.pinch = Math.max(0, Math.min(1, 1 - distance(thumb, index) * 5))

  gestureState.openness = Math.max(
    0,
    Math.min(1, (distance(index, wrist) + distance(middle, wrist)) * 1.2)
  )

  gestureState.depth = Math.max(0, Math.min(1, -wrist.z * 2))

  const avgFingerZ = (index.z + middle.z) / 2
  handFacing = avgFingerZ < wrist.z ? 'palm' : 'back'
})

// CAMERA INPUT
const cam = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video })
  },
  width: CAM_WIDTH,
  height: CAM_HEIGHT,
})
cam.start()

// THREE.JS SETUP
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
camera.position.z = 4

const renderer = new THREE.WebGLRenderer({
  canvas: threeCanvas,
  alpha: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)

// PARTICLE TEMPLATES
function sphereTemplate(i, total) {
  const phi = Math.acos(1 - 2 * (i / total))
  const theta = Math.PI * (1 + Math.sqrt(5)) * i
  return {
    x: Math.cos(theta) * Math.sin(phi),
    y: Math.sin(theta) * Math.sin(phi),
    z: Math.cos(phi),
  }
}

function heartTemplate(i, total) {
  const t = (i / total) * Math.PI * 2
  return {
    x: 0.8 * Math.sin(t) ** 3,
    y: 0.6 * (Math.cos(t) - 0.5 * Math.cos(2 * t) - 0.2 * Math.cos(3 * t)),
    z: 0,
  }
}

function flowerTemplate(i, total) {
  const t = (i / total) * Math.PI * 2
  const r = Math.sin(5 * t) * 0.7
  return {
    x: Math.cos(t) * r,
    y: Math.sin(t) * r,
    z: 0,
  }
}

function saturnTemplate(i, total) {
  const angle = (i / total) * Math.PI * 2
  return i % 2 === 0
    ? { x: Math.cos(angle) * 1.4, y: 0, z: Math.sin(angle) * 1.4 }
    : sphereTemplate(i, total)
}

function fireworksTemplate() {
  return {
    x: (Math.random() - 0.5) * 3,
    y: (Math.random() - 0.5) * 3,
    z: (Math.random() - 0.5) * 3,
  }
}

const templates = [
  sphereTemplate,
  heartTemplate,
  flowerTemplate,
  saturnTemplate,
  fireworksTemplate,
]

let currentTemplate = 0

// PARTICLE SYSTEM (MORPHING)
const COUNT = 6000
const positions = new Float32Array(COUNT * 3)
const targetPositions = new Float32Array(COUNT * 3)

const geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

const material = new THREE.PointsMaterial({
  size: 0.025,
  color: 0x66ccff,
  transparent: true,
  opacity: 1,
})

const particles = new THREE.Points(geometry, material)
scene.add(particles)

let morphProgress = 1

function applyTemplate(templateFn) {
  for (let i = 0; i < COUNT; i++) {
    const p =
      templateFn === fireworksTemplate
        ? templateFn()
        : templateFn(i, COUNT)

    targetPositions[i * 3]     = p.x
    targetPositions[i * 3 + 1] = p.y
    targetPositions[i * 3 + 2] = p.z
  }

  morphProgress = 0
}

// Initialize first template
for (let i = 0; i < COUNT; i++) {
  const p = templates[currentTemplate](i, COUNT)

  positions[i * 3]     = p.x
  positions[i * 3 + 1] = p.y
  positions[i * 3 + 2] = p.z

  targetPositions[i * 3]     = p.x
  targetPositions[i * 3 + 1] = p.y
  targetPositions[i * 3 + 2] = p.z
}

geometry.attributes.position.needsUpdate = true

// ANIMATION LOOP

function animate() {
  requestAnimationFrame(animate)

  const targetScale = 0.6 + gestureState.openness * 1.6
  particles.scale.lerp(
    new THREE.Vector3(targetScale, targetScale, targetScale),
    0.08
  )

  const now = performance.now()
  if (
    handFacing !== lastHandFacing &&
    now - lastSwitchTime > 1200
  ) {
    currentTemplate = (currentTemplate + 1) % templates.length
    applyTemplate(templates[currentTemplate])
    lastSwitchTime = now
  }
  lastHandFacing = handFacing

  if (morphProgress < 1) {
    morphProgress += 0.04
    for (let i = 0; i < COUNT * 3; i++) {
      positions[i] += (targetPositions[i] - positions[i]) * 0.15
    }
    geometry.attributes.position.needsUpdate = true
  }

  material.color.lerpColors(
    new THREE.Color('#66ccff'),
    new THREE.Color('#ff66cc'),
    gestureState.pinch
  )

  material.size = 0.015 + gestureState.depth * 0.04

  particles.rotation.y += 0.002

  renderer.render(scene, camera)
}

animate()

// RESIZE
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
