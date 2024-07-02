let cena, camera, renderizador;
let bolas = [];
const caçapas = [];
let placaresJogadores = [0, 0];
let jogadorAtual = 0;
const larguraMesa = 10;
const alturaMesa = 5;
const raioBola = 0.2;
const raioCaçapa = 0.25;
const fricção = 0.98; // fricção

let bolaSelecionada = null;
let linhaMira = null;

iniciar();
animar();

function iniciar() {
    // Cena
    cena = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderizador = new THREE.WebGLRenderer({ antialias: true });
    renderizador.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderizador.domElement);

    // Luz
    const luz = new THREE.PointLight(0xffffff, 1, 100);
    luz.position.set(0, 10, 10);
    cena.add(luz);

    const luzAmbiente = new THREE.AmbientLight(0x404040); // luz ambiiente
    cena.add(luzAmbiente);

    // mesa
    criarMesa();

    const coresBolas = [
        0xFF0000, // Bola 1 - Vermelha
        0xFF7F00, // Bola 2 - Laranja
        0xFFFF00, // Bola 3 - Amarela
        0x00FF00, // Bola 4 - Verde
        0x0000FF, // Bola 5 - Azul
        0x4B0082, // Bola 6 - Índigo
        0x8B00FF  // Bola 7 - Violeta
    ];

    // bolas
    const geometriaBola = new THREE.SphereGeometry(raioBola, 32, 32);

    for (let i = 0; i < 16; i++) {
        let materialBola;

        if (i === 0) {
            // Bola branca
            materialBola = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        } else if (i === 8) {
            // Bola 8 preta
            materialBola = new THREE.MeshPhongMaterial({ color: 0x000000 });
        } else if (i >= 1 && i <= 7) {
            // Bolas 1 a 7 lisas com cores únicas
            materialBola = new THREE.MeshPhongMaterial({ color: coresBolas[i - 1] });
        } else if (i >= 9 && i <= 15) {
            // Bolas 9 a 15 listradas com cores únicas
            materialBola = criarMaterialListrado(`#${coresBolas[i - 9].toString(16).padStart(6, '0')}`);
        }

        const bola = new THREE.Mesh(geometriaBola, materialBola);
        bola.position.set(
            Math.random() * (larguraMesa - 2 * raioBola) - (larguraMesa / 2 - raioBola),
            raioBola,
            Math.random() * (alturaMesa - 2 * raioBola) - (alturaMesa / 2 - raioBola)
        );
        bola.velocidade = new THREE.Vector3(0, 0, 0); // Inicializa a velocidade
        bola.massa = 1; // Massa da bola para cálculos de colisão
        cena.add(bola);
        bolas.push(bola);
    }

    // caçapas
    criarCaçapas();

    // mira
    const materialLinha = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const geometriaLinha = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    linhaMira = new THREE.Line(geometriaLinha, materialLinha);
    cena.add(linhaMira);

    // posição camera
    camera.position.set(0, 9, 6);
    camera.lookAt(0, 0, 0);

    // ckick do mouse
    document.addEventListener('click', aoClicarDocumento, false);
    document.addEventListener('mousemove', aoMoverMouseDocumento, false);
}

// material
function criarMaterialListrado(corBase) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const contexto = canvas.getContext('2d');

    // Desenha a base da bola
    contexto.fillStyle = corBase;
    contexto.fillRect(0, 0, 64, 64);

    // Desenha a listra
    contexto.fillStyle = '#FFFFFF';
    contexto.fillRect(0, 28, 64, 8);

    const textura = new THREE.CanvasTexture(canvas);
    return new THREE.MeshPhongMaterial({ map: textura });
}

function criarMesa() {
    const materialMesa = new THREE.MeshPhongMaterial({ color: 0x006400 });

    // planoda mesa
    const geometriaMesa = new THREE.BoxGeometry(larguraMesa, 0.2, alturaMesa);
    const mesa = new THREE.Mesh(geometriaMesa, materialMesa);
    mesa.position.y = 0;
    cena.add(mesa);

    // bordas
    const materialBorda = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const espessuraBorda = 0.3;
    const alturaBorda = 0.5;

    // Borda esquerda
    criarBorda(-larguraMesa / 2 - espessuraBorda / 2, alturaBorda / 2, 0, espessuraBorda, alturaBorda, alturaMesa);
    // Borda direita
    criarBorda(larguraMesa / 2 + espessuraBorda / 2, alturaBorda / 2, 0, espessuraBorda, alturaBorda, alturaMesa);
    // Borda superior
    criarBorda(0, alturaBorda / 2, -alturaMesa / 2 - espessuraBorda / 2, larguraMesa, alturaBorda, espessuraBorda);
    // Borda inferior
    criarBorda(0, alturaBorda / 2, alturaMesa / 2 + espessuraBorda / 2, larguraMesa, alturaBorda, espessuraBorda);
}

function criarBorda(x, y, z, largura, altura, profundidade) {
    const geometriaBorda = new THREE.BoxGeometry(largura, altura, profundidade);
    const materialBorda = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const borda = new THREE.Mesh(geometriaBorda, materialBorda);
    borda.position.set(x, y, z);
    cena.add(borda);
    return borda;
}

function criarCaçapas() {
    const geometriaCaçapa = new THREE.SphereGeometry(raioCaçapa, 32, 32);
    const materialCaçapa = new THREE.MeshPhongMaterial({ color: 0x000000 });

    const posiçõesCaçapas = [
        [-larguraMesa / 2, 0, -alturaMesa / 2],
        [0, 0, -alturaMesa / 2],
        [larguraMesa / 2, 0, -alturaMesa / 2],
        [-larguraMesa / 2, 0, alturaMesa / 2],
        [0, 0, alturaMesa / 2],
        [larguraMesa / 2, 0, alturaMesa / 2]
    ];

    posiçõesCaçapas.forEach(pos => {
        const caçapa = new THREE.Mesh(geometriaCaçapa, materialCaçapa);
        caçapa.position.set(pos[0], pos[1], pos[2]);
        cena.add(caçapa);
        caçapas.push(caçapa);
    });
}

function aoClicarDocumento(evento) {
    const mouse = new THREE.Vector2();
    mouse.x = (evento.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(evento.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const interseções = raycaster.intersectObjects(bolas);

    if (interseções.length > 0) {
        const bolaIntersecada = interseções[0].object;
        bolaIntersecada.velocidade = new THREE.Vector3(Math.random() * 2 - 1, 0, Math.random() * 2 - 1);
        bolaSelecionada = null; // tira seleção apos tacar
        linhaMira.visible = false; // tira linha após tacar
        jogadorAtual = (jogadorAtual + 1) % 2; // troca jogador após tacar
    }
}

function aoMoverMouseDocumento(evento) {
    if (bolaSelecionada) {
        const mouse = new THREE.Vector2();
        mouse.x = (evento.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(evento.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const interseções = raycaster.intersectObjects(bolas);
        if (interseções.length > 0) {
            const ponto = interseções[0].point;
            const direção = new THREE.Vector3().subVectors(ponto, bolaSelecionada.position).normalize();
            linhaMira.geometry.setFromPoints([bolaSelecionada.position, bolaSelecionada.position.clone().add(direção.multiplyScalar(5))]);
            linhaMira.visible = true;
        } else {
            linhaMira.visible = false;
        }
    } else {
        // seleciona a bola
        const mouse = new THREE.Vector2();
        mouse.x = (evento.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(evento.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const interseções = raycaster.intersectObjects(bolas);
        if (interseções.length > 0) {
            bolaSelecionada = interseções[0].object;
        }
    }
}

function animar() {
    requestAnimationFrame(animar);

    bolas.forEach(bola => {
        if (bola.velocidade.length() > 0.01) { // velocidade para parar a bola
            bola.position.add(bola.velocidade.clone().multiplyScalar(0.1));

            // aplica a friccao 
            bola.velocidade.multiplyScalar(fricção);

            // colisão com borda
            if (bola.position.x - raioBola < -larguraMesa / 2 || bola.position.x + raioBola > larguraMesa / 2) {
                bola.velocidade.x = -bola.velocidade.x;
                bola.position.x = THREE.MathUtils.clamp(bola.position.x, -larguraMesa / 2 + raioBola, larguraMesa / 2 - raioBola);
            }
            if (bola.position.z - raioBola < -alturaMesa / 2 || bola.position.z + raioBola > alturaMesa / 2) {
                bola.velocidade.z = -bola.velocidade.z;
                bola.position.z = THREE.MathUtils.clamp(bola.position.z, -alturaMesa / 2 + raioBola, alturaMesa / 2 - raioBola);
            }

            // colisão com bolas
            bolas.forEach(outraBola => {
                if (bola !== outraBola && bola.position.distanceTo(outraBola.position) < 2 * raioBola) {
                    resolverColisão(bola, outraBola);
                }
            });

            // detecta caçapa
            caçapas.forEach(caçapa => {
                if (bola.position.distanceTo(caçapa.position) < raioCaçapa) {
                    console.log(`Bola encaçapada pelo jogador ${jogadorAtual + 1}`);
                    // remove bola do array
                    cena.remove(bola);
                    bolas = bolas.filter(b => b !== bola);
                    // adiciona no placar
                    placaresJogadores[jogadorAtual]++;
                    console.log(`Placar do jogador ${jogadorAtual + 1}: ${placaresJogadores[jogadorAtual]}`);
                    document.getElementById('jogador' + (jogadorAtual + 1)).innerText = `Jogador ${jogadorAtual + 1}: ${placaresJogadores[jogadorAtual]}`;
                }
            });
        } else {
            bola.velocidade.set(0, 0, 0);
        }
    });

    renderizador.render(cena, camera);
}

function resolverColisão(bola1, bola2) {
    const normal = new THREE.Vector3().subVectors(bola2.position, bola1.position).normalize();
    const velocidadeRelativa = new THREE.Vector3().subVectors(bola1.velocidade, bola2.velocidade);
    const velocidadeAoLongoDaNormal = velocidadeRelativa.dot(normal);

    // verifica proximidade da bola
    if (velocidadeAoLongoDaNormal < 0) {
        const magnitudeImpulso = -(1 + 0.8) * velocidadeAoLongoDaNormal / (1 / bola1.massa + 1 / bola2.massa);
        const impulso = normal.clone().multiplyScalar(magnitudeImpulso);

        bola1.velocidade.add(impulso.clone().multiplyScalar(1 / bola1.massa));
        bola2.velocidade.sub(impulso.clone().multiplyScalar(1 / bola2.massa));

        // corrige sobreposição
        const sobreposição = 2 * raioBola - bola1.position.distanceTo(bola2.position);
        if (sobreposição > 0) {
            const correção = normal.clone().multiplyScalar(sobreposição * 0.5);
            bola1.position.sub(correção);
            bola2.position.add(correção);
        }
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
});
