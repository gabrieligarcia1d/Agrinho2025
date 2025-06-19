let estadoJogo = "menu";
let pontuacao = 0;
let nivel = 1;
let tempoRestante = 60;
let timer;

let elementosCampo = [];
let elementosCidade = [];
let obstaculos = [];
let bonus = [];
let conexoesAtivas = [];

const LADO_CAMPO = 0;
const LADO_CIDADE = 1;
const MAX_ELEMENTOS_CAMPO = 5;
const MAX_ELEMENTOS_CIDADE = 5;
const MAX_OBSTACULOS = 3;
const CORES = {
  campoFundo: "#8BC34A",
  cidadeFundo: "#9E9E9E",
  ponte: "#FFFFFF",
  obstaculo: "#000000",
  bonus: "#FFD700",
  textoHUD: "#FFFFFF",
  borda: "#000000",
};

let arrastando = false;
let elementoOrigem = null;

const TAM_EMOJI = 40;

function setup() {
  createCanvas(900, 600);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(220);

  switch (estadoJogo) {
    case "menu":
      desenhaMenu();
      break;
    case "jogando":
      logicaJogo();
      desenhaJogo();
      break;
    case "fimJogo":
      desenhaFimJogo();
      break;
  }
}

function desenhaMenu() {
  background(CORES.campoFundo);
  fill(CORES.textoHUD);
  textSize(60);
  text("Pontes do Agrinho", width / 2, height / 3);
  textSize(28);
  text("Pressione ESPAÇO para Começar", width / 2, height / 2);
  textSize(18);
  text(
    "Conecte 🌽 do Campo com 🏪 da Cidade arrastando o mouse.",
    width / 2,
    height * 0.7
  );
  text("Evite as 🕷️ e colete os ✨!", width / 2, height * 0.75);
}

function desenhaJogo() {
  noStroke();
  fill(CORES.campoFundo);
  rect(width / 4, height / 2, width / 2, height);
  fill(CORES.cidadeFundo);
  rect((width * 3) / 4, height / 2, width / 2, height);
  stroke(CORES.borda);
  strokeWeight(3);
  line(width / 2, 0, width / 2, height);

  for (let el of elementosCampo) {
    desenhaEmojiElemento(el);
  }

  for (let el of elementosCidade) {
    desenhaEmojiElemento(el);
  }

  for (let conexao of conexoesAtivas) {
    stroke(CORES.ponte);
    strokeWeight(3);
    line(conexao.x1, conexao.y1, conexao.x2, conexao.y2);
  }

  for (let obs of obstaculos) {
    textSize(TAM_EMOJI);
    text(obs.emoji, obs.x, obs.y);
  }

  for (let b of bonus) {
    textSize(TAM_EMOJI);
    text(b.emoji, b.x, b.y);
  }

  if (arrastando && elementoOrigem) {
    stroke(CORES.ponte);
    strokeWeight(3);
    line(elementoOrigem.x, elementoOrigem.y, mouseX, mouseY);
  }

  desenhaHUD();
}

function desenhaEmojiElemento(el) {
  textSize(TAM_EMOJI);
  text(el.emoji, el.x, el.y);
}

function desenhaFimJogo() {
  background(CORES.obstaculo);
  fill(CORES.textoHUD);
  textSize(60);
  text("Fim de Jogo!", width / 2, height / 3);
  textSize(35);
  text("Pontuação Final: " + pontuacao, width / 2, height / 2);
  textSize(24);
  text("Pressione R para Reiniciar", width / 2, height * 0.7);
}

function desenhaHUD() {
  fill(CORES.textoHUD);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Pontos: " + pontuacao, 10, 10);
  text("Nível: " + nivel, 10, 40);
  textAlign(RIGHT, TOP);
  text("Tempo: " + floor(tempoRestante), width - 10, 10);
}

function logicaJogo() {
  if (
    frameCount % (60 - nivel * 5) === 0 &&
    elementosCampo.length < MAX_ELEMENTOS_CAMPO
  ) {
    gerarElemento(LADO_CAMPO);
  }
  if (
    frameCount % (60 - nivel * 5) === 0 &&
    elementosCidade.length < MAX_ELEMENTOS_CIDADE
  ) {
    gerarElemento(LADO_CIDADE);
  }

  if (
    frameCount % (90 - nivel * 5) === 0 &&
    obstaculos.length < MAX_OBSTACULOS
  ) {
    gerarObstaculo();
  }

  if (frameCount % 400 === 0 && bonus.length < 1) {
    gerarBonus();
  }

  for (let obs of obstaculos) {
    obs.x += obs.velocidadeX;
    obs.y += obs.velocidadeY;
    if (obs.x < TAM_EMOJI / 2 || obs.x > width - TAM_EMOJI / 2) {
      obs.velocidadeX *= -1;
    }
    if (obs.y < TAM_EMOJI / 2 || obs.y > height - TAM_EMOJI / 2) {
      obs.velocidadeY *= -1;
    }
  }

  if (arrastando && elementoOrigem) {
    for (let obs of obstaculos) {
      let d = distToSegment(
        obs.x,
        obs.y,
        elementoOrigem.x,
        elementoOrigem.y,
        mouseX,
        mouseY
      );
      if (d < TAM_EMOJI / 2) {
        arrastando = false;
        elementoOrigem = null;
        pontuacao -= 15;
        if (pontuacao < 0) pontuacao = 0;
        return;
      }
    }
  }

  for (let i = bonus.length - 1; i >= 0; i--) {
    let b = bonus[i];
    if (arrastando && elementoOrigem) {
      let d = distToSegment(
        b.x,
        b.y,
        elementoOrigem.x,
        elementoOrigem.y,
        mouseX,
        mouseY
      );
      if (d < TAM_EMOJI / 2) {
        pontuacao += 25;
        tempoRestante += 5;
        bonus.splice(i, 1);
      }
    }
  }

  if (tempoRestante <= 0) {
    estadoJogo = "fimJogo";
    clearInterval(timer);
  }

  if (pontuacao >= nivel * 100) {
    nivel++;
    tempoRestante += 30;
    reiniciarElementos();
    tempoRestante = constrain(tempoRestante, 0, 120);
  }
}

function gerarElemento(lado) {
  let x, y, emoji, tipo;

  if (lado === LADO_CAMPO) {
    x = random(TAM_EMOJI / 2, width / 2 - TAM_EMOJI / 2);
    y = random(TAM_EMOJI / 2, height - TAM_EMOJI / 2);
    let tiposCampo = ["milho", "tomate", "vaca", "trigo"];
    tipo = random(tiposCampo);
    switch (tipo) {
      case "milho":
        emoji = "🌽";
        break;
      case "tomate":
        emoji = "🍅";
        break;
      case "vaca":
        emoji = "🐄";
        break;
      case "trigo":
        emoji = "🌾";
        break;
    }
    elementosCampo.push({
      x,
      y,
      emoji,
      lado,
      tipo,
    });
  } else {
    x = random(width / 2 + TAM_EMOJI / 2, width - TAM_EMOJI / 2);
    y = random(TAM_EMOJI / 2, height - TAM_EMOJI / 2);
    let tiposCidade = ["mercado", "casa", "fabrica", "caminhao"];
    tipo = random(tiposCidade);
    switch (tipo) {
      case "mercado":
        emoji = "🏪";
        break;
      case "casa":
        emoji = "🏠";
        break;
      case "fabrica":
        emoji = "🏭";
        break;
      case "caminhao":
        emoji = "🚚";
        break;
    }
    elementosCidade.push({
      x,
      y,
      emoji,
      lado,
      tipo,
    });
  }
}

function gerarObstaculo() {
  let x = random(width);
  let y = random(height);
  let emoji = random(["🕷️", "🚧"]);
  let velocidadeX = random([-2, 2]) * (nivel * 0.5 + 1);
  let velocidadeY = random([-2, 2]) * (nivel * 0.5 + 1);
  obstaculos.push({
    x,
    y,
    emoji,
    velocidadeX,
    velocidadeY,
  });
}

function gerarBonus() {
  let x = random(width);
  let y = random(height);
  let emoji = random(["✨", "🌟"]);
  bonus.push({
    x,
    y,
    emoji,
  });
}

function reiniciarElementos() {
  elementosCampo = [];
  elementosCidade = [];
  obstaculos = [];
  bonus = [];
  conexoesAtivas = [];
}

function mousePressed() {
  if (estadoJogo === "jogando") {
    for (let el of elementosCampo) {
      if (dist(mouseX, mouseY, el.x, el.y) < TAM_EMOJI / 2) {
        arrastando = true;
        elementoOrigem = el;
        return;
      }
    }
    for (let el of elementosCidade) {
      if (dist(mouseX, mouseY, el.x, el.y) < TAM_EMOJI / 2) {
        arrastando = true;
        elementoOrigem = el;
        return;
      }
    }
  }
}

function mouseReleased() {
  if (estadoJogo === "jogando" && arrastando && elementoOrigem) {
    let elementoAlvo = null;

    if (elementoOrigem.lado === LADO_CAMPO) {
      for (let el of elementosCidade) {
        if (dist(mouseX, mouseY, el.x, el.y) < TAM_EMOJI / 2) {
          elementoAlvo = el;
          break;
        }
      }
    } else {
      for (let el of elementosCampo) {
        if (dist(mouseX, mouseY, el.x, el.y) < TAM_EMOJI / 2) {
          elementoAlvo = el;
          break;
        }
      }
    }

    if (elementoAlvo) {
      conexoesAtivas.push({
        x1: elementoOrigem.x,
        y1: elementoOrigem.y,
        x2: elementoAlvo.x,
        y2: elementoAlvo.y,
      });
      pontuacao += 20;
      if (elementoOrigem.lado === LADO_CAMPO) {
        elementosCampo = elementosCampo.filter((el) => el !== elementoOrigem);
        elementosCidade = elementosCidade.filter((el) => el !== elementoAlvo);
      } else {
        elementosCidade = elementosCidade.filter((el) => el !== elementoOrigem);
        elementosCampo = elementosCampo.filter((el) => el !== elementoAlvo);
      }
    }
    arrastando = false;
    elementoOrigem = null;
  }
}

function keyPressed() {
  if (estadoJogo === "menu" && keyCode === 32) {
    iniciarJogo();
  } else if (estadoJogo === "fimJogo" && keyCode === 82) {
    reiniciarJogo();
  }
}

function iniciarJogo() {
  estadoJogo = "jogando";
  pontuacao = 0;
  nivel = 1;
  tempoRestante = 60;
  reiniciarElementos();
  for (let i = 0; i < 3; i++) {
    gerarElemento(LADO_CAMPO);
    gerarElemento(LADO_CIDADE);
  }
  for (let i = 0; i < 1; i++) {
    gerarObstaculo();
  }

  timer = setInterval(function () {
    tempoRestante--;
  }, 1000);
}

function reiniciarJogo() {
  clearInterval(timer);
  iniciarJogo();
}

function distToSegment(px, py, x1, y1, x2, y2) {
  let dx = x2 - x1;
  let dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return dist(px, py, x1, y1);
  }

  let l2 = dx * dx + dy * dy;

  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = constrain(t, 0, 1);

  let closestX = x1 + t * dx;
  let closestY = y1 + t * dy;

  return dist(px, py, closestX, closestY);
}
