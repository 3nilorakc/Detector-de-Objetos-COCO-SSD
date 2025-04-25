// Elementos do DOM
const uploadInput = document.getElementById("upload")
const uploadBtn = document.getElementById("upload-btn")
const uploadContainer = document.getElementById("upload-container")
const imageElement = document.getElementById("image")
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
const resultContainer = document.getElementById("result-container")
const loader = document.getElementById("loader")
const detectionInfo = document.getElementById("detection-info")
const detectionList = document.getElementById("detection-list")
const newImageBtn = document.getElementById("new-image-btn")

// Variáveis globais
let model
let modelLoaded = false
let detectedObjects = []

// Tradução de classes do COCO-SSD (inglês para português)
const translations = {
  person: "pessoa",
  bicycle: "bicicleta",
  car: "carro",
  motorcycle: "motocicleta",
  airplane: "avião",
  bus: "ônibus",
  train: "trem",
  truck: "caminhão",
  boat: "barco",
  "traffic light": "semáforo",
  "fire hydrant": "hidrante",
  "stop sign": "placa de pare",
  "parking meter": "parquímetro",
  bench: "banco",
  bird: "pássaro",
  cat: "gato",
  dog: "cachorro",
  horse: "cavalo",
  sheep: "ovelha",
  cow: "vaca",
  elephant: "elefante",
  bear: "urso",
  zebra: "zebra",
  giraffe: "girafa",
  backpack: "mochila",
  umbrella: "guarda-chuva",
  handbag: "bolsa",
  tie: "gravata",
  suitcase: "mala",
  frisbee: "frisbee",
  skis: "esquis",
  snowboard: "snowboard",
  "sports ball": "bola esportiva",
  kite: "pipa",
  "baseball bat": "taco de beisebol",
  "baseball glove": "luva de beisebol",
  skateboard: "skate",
  surfboard: "prancha de surf",
  "tennis racket": "raquete de tênis",
  bottle: "garrafa",
  "wine glass": "taça de vinho",
  cup: "xícara",
  fork: "garfo",
  knife: "faca",
  spoon: "colher",
  bowl: "tigela",
  banana: "banana",
  apple: "maçã",
  sandwich: "sanduíche",
  orange: "laranja",
  broccoli: "brócolis",
  carrot: "cenoura",
  "hot dog": "cachorro-quente",
  pizza: "pizza",
  donut: "rosquinha",
  cake: "bolo",
  chair: "cadeira",
  couch: "sofá",
  "potted plant": "planta em vaso",
  bed: "cama",
  "dining table": "mesa de jantar",
  toilet: "vaso sanitário",
  tv: "televisão",
  laptop: "laptop",
  mouse: "mouse",
  remote: "controle remoto",
  keyboard: "teclado",
  "cell phone": "celular",
  microwave: "micro-ondas",
  oven: "forno",
  toaster: "torradeira",
  sink: "pia",
  refrigerator: "geladeira",
  book: "livro",
  clock: "relógio",
  vase: "vaso",
  scissors: "tesoura",
  "teddy bear": "ursinho de pelúcia",
  "hair drier": "secador de cabelo",
  toothbrush: "escova de dentes",
}

// Função para traduzir classes
function translateClass(englishClass) {
  return translations[englishClass.toLowerCase()] || englishClass
}

// Inicializa a aplicação
function init() {
  // Carrega o modelo COCO-SSD
  showMessage("Carregando modelo COCO-SSD...")

  // Carrega o modelo usando a variável global cocoSsd que vem do CDN
  cocoSsd
    .load()
    .then((loadedModel) => {
      model = loadedModel
      modelLoaded = true
      showMessage("Modelo carregado com sucesso! Você pode fazer upload de uma imagem agora.")
      console.log("Modelo carregado com sucesso!")
    })
    .catch((error) => {
      showMessage("Erro ao carregar o modelo: " + error.message, true)
      console.error("Erro ao carregar o modelo:", error)
    })

  // Configurar eventos
  setupEventListeners()
}

// Configurar listeners de eventos
function setupEventListeners() {
  // Evento de clique no botão de upload
  uploadBtn.addEventListener("click", () => {
    uploadInput.click()
  })

  // Evento de upload de imagem
  uploadInput.addEventListener("change", handleImageUpload)

  // Suporte para arrastar e soltar
  uploadContainer.addEventListener("dragover", (e) => {
    e.preventDefault()
    uploadContainer.style.borderColor = "#4361ee"
    uploadContainer.style.backgroundColor = "rgba(67, 97, 238, 0.1)"
  })

  uploadContainer.addEventListener("dragleave", (e) => {
    e.preventDefault()
    uploadContainer.style.borderColor = "#dee2e6"
    uploadContainer.style.backgroundColor = "#f8f9fa"
  })

  uploadContainer.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadContainer.style.borderColor = "#dee2e6"
    uploadContainer.style.backgroundColor = "#f8f9fa"

    if (e.dataTransfer.files.length) {
      uploadInput.files = e.dataTransfer.files
      handleImageUpload({ target: uploadInput })
    }
  })

  // Evento de clique no botão de nova imagem
  newImageBtn.addEventListener("click", () => {
    // Esconder resultados e mostrar área de upload
    resultContainer.style.display = "none"
    uploadContainer.style.display = "flex"

    // Limpar o input de arquivo para permitir selecionar o mesmo arquivo novamente
    uploadInput.value = ""
  })
}

// Manipular upload de imagem
async function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!modelLoaded) {
    showMessage("O modelo ainda está carregando. Por favor, aguarde...")
    return
  }

  // Mostrar loader
  uploadContainer.style.display = "none"
  loader.style.display = "block"
  resultContainer.style.display = "none"

  const reader = new FileReader()
  reader.onload = (e) => {
    imageElement.src = e.target.result
    imageElement.onload = () => detectImage()
  }
  reader.readAsDataURL(file)
}

// Detecta objetos e desenha no canvas
async function detectImage() {
  try {
    // Ajustar o tamanho do canvas para corresponder à imagem
    const maxWidth = 600 // Reduzido de 800 para 600 para diminuir a imagem
    let width = imageElement.naturalWidth
    let height = imageElement.naturalHeight

    // Redimensionar se a imagem for muito grande
    if (width > maxWidth) {
      const ratio = maxWidth / width
      width = maxWidth
      height = height * ratio
    }

    canvas.width = width
    canvas.height = height

    // Desenhar a imagem no canvas
    ctx.drawImage(imageElement, 0, 0, width, height)

    // Detectar objetos
    const predictions = await model.detect(imageElement)
    detectedObjects = predictions

    // Desenhar as caixas delimitadoras
    drawDetections(predictions)

    // Mostrar informações de detecção
    updateDetectionInfo(predictions)

    // Esconder loader e mostrar resultados
    loader.style.display = "none"
    resultContainer.style.display = "block"
  } catch (error) {
    showMessage("Erro ao processar a imagem: " + error.message, true)
    console.error("Erro ao processar a imagem:", error)
    loader.style.display = "none"
    uploadContainer.style.display = "flex"
  }
}

// Desenhar as detecções no canvas
function drawDetections(predictions) {
  // Cores para diferentes classes de objetos
  const colors = [
    "#4361ee", // azul
    "#3a0ca3", // roxo
    "#7209b7", // roxo escuro
    "#f72585", // rosa
    "#4cc9f0", // azul claro
    "#38b000", // verde
    "#ff9e00", // laranja
    "#d90429", // vermelho
  ]

  predictions.forEach((pred, index) => {
    const color = colors[index % colors.length]

    // Desenhar retângulo
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.strokeRect(...pred.bbox)

    // Desenhar fundo para o texto
    const text = `${translateClass(pred.class)} (${(pred.score * 100).toFixed(1)}%)`
    const textWidth = ctx.measureText(text).width + 10
    const textHeight = 24

    ctx.fillStyle = color
    ctx.fillRect(
      pred.bbox[0],
      pred.bbox[1] > textHeight ? pred.bbox[1] - textHeight : pred.bbox[1] + pred.bbox[3],
      textWidth,
      textHeight,
    )

    // Desenhar texto
    ctx.font = "16px 'Poppins', sans-serif"
    ctx.fillStyle = "#ffffff"
    ctx.fillText(
      text,
      pred.bbox[0] + 5,
      pred.bbox[1] > textHeight ? pred.bbox[1] - 5 : pred.bbox[1] + pred.bbox[3] + 16,
    )
  })
}

// Atualizar informações de detecção
function updateDetectionInfo(predictions) {
  // Limpar lista anterior
  detectionList.innerHTML = ""

  if (predictions.length === 0) {
    detectionInfo.innerHTML = "<h3>Nenhum objeto detectado</h3>"
    return
  }

  // Agrupar objetos por classe e calcular média de confiança
  const objectInfo = {}
  predictions.forEach((pred) => {
    const translatedClass = translateClass(pred.class)
    if (!objectInfo[translatedClass]) {
      objectInfo[translatedClass] = {
        count: 0,
        totalConfidence: 0,
        highestConfidence: 0,
      }
    }
    objectInfo[translatedClass].count += 1
    objectInfo[translatedClass].totalConfidence += pred.score
    objectInfo[translatedClass].highestConfidence = Math.max(objectInfo[translatedClass].highestConfidence, pred.score)
  })

  // Adicionar itens à lista
  for (const [className, info] of Object.entries(objectInfo)) {
    const item = document.createElement("div")
    item.className = "detection-item"

    // Calcular a média de confiança ou usar a mais alta
    const confidence = (info.highestConfidence * 100).toFixed(1)

    item.innerHTML = `
      <i class="fas fa-check-circle"></i> 
      ${className} ${info.count > 1 ? `(${info.count})` : ""} 
      <span class="confidence">${confidence}%</span>
    `
    detectionList.appendChild(item)
  }
}

// Mostrar mensagem ao usuário
function showMessage(message, isError = false) {
  console.log(message)
  // Aqui você pode implementar um sistema de notificações se desejar
}

// Inicializar a aplicação quando a página carregar
window.addEventListener("DOMContentLoaded", init)
