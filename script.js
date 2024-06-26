let scene, camera, renderer;
let balls = [];
const pockets = [];
let playerScores = [0, 0];
let currentPlayer = 0;
const tableWidth = 10;
const tableHeight = 5;
const ballRadius = 0.2;
const pocketRadius = 0.25;
const friction = 0.98; // Fator de fricção

let selectedBall = null;
let aimLine = null;

init();
animate();

function init() {
    // Configuração básica da cena
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // Luz
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 10, 10);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    // Mesa de Sinuca
    createTable();

    // Criação das Bolas
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    
    for (let i = 0; i < 16; i++) {
        const ballMaterial = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.position.set(
            Math.random() * (tableWidth - 2 * ballRadius) - (tableWidth / 2 - ballRadius),
            ballRadius,
            Math.random() * (tableHeight - 2 * ballRadius) - (tableHeight / 2 - ballRadius)
        );
        ball.velocity = new THREE.Vector3(0, 0, 0); // Inicializa a velocidade
        ball.mass = 1; // Massa da bola para cálculos de colisão
        scene.add(ball);
        balls.push(ball);
    }

    // Criação das Caçapas
    createPockets();

    // Adicionar linha de mira
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    aimLine = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(aimLine);

    // Posicionar a câmera acima da mesa
    camera.position.set(0, 9, 6);
    camera.lookAt(0, 0, 0);

    // Evento de clique e movimento do mouse
    document.addEventListener('click', onDocumentClick, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
}

function createTable() {
    const tableMaterial = new THREE.MeshPhongMaterial({ color: 0x006400 });

    // Plano da mesa
    const tableGeometry = new THREE.BoxGeometry(tableWidth, 0.2, tableHeight);
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = 0;
    scene.add(table);

    // Bordas da mesa
    const borderMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const borderThickness = 0.3;
    const borderHeight = 0.5;

    // Borda esquerda
    createBorder(-tableWidth / 2 - borderThickness / 2, borderHeight / 2, 0, borderThickness, borderHeight, tableHeight);
    // Borda direita
    createBorder(tableWidth / 2 + borderThickness / 2, borderHeight / 2, 0, borderThickness, borderHeight, tableHeight);
    // Borda superior
    createBorder(0, borderHeight / 2, -tableHeight / 2 - borderThickness / 2, tableWidth, borderHeight, borderThickness);
    // Borda inferior
    createBorder(0, borderHeight / 2, tableHeight / 2 + borderThickness / 2, tableWidth, borderHeight, borderThickness);
}

function createBorder(x, y, z, width, height, depth) {
    const borderGeometry = new THREE.BoxGeometry(width, height, depth);
    const borderMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.set(x, y, z);
    scene.add(border);
    return border;
}

function createPockets() {
    const pocketGeometry = new THREE.SphereGeometry(pocketRadius, 32, 32);
    const pocketMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

    const pocketPositions = [
        [-tableWidth / 2, 0, -tableHeight / 2],
        [0, 0, -tableHeight / 2],
        [tableWidth / 2, 0, -tableHeight / 2],
        [-tableWidth / 2, 0, tableHeight / 2],
        [0, 0, tableHeight / 2],
        [tableWidth / 2, 0, tableHeight / 2]
    ];

    pocketPositions.forEach(pos => {
        const pocket = new THREE.Mesh(pocketGeometry, pocketMaterial);
        pocket.position.set(pos[0], pos[1], pos[2]);
        scene.add(pocket);
        pockets.push(pocket);
    });
}

function onDocumentClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(balls);

    if (intersects.length > 0) {
        const intersectedBall = intersects[0].object;
        intersectedBall.velocity = new THREE.Vector3(Math.random() * 2 - 1, 0, Math.random() * 2 - 1);
        selectedBall = null; // Deselect the ball after shooting
        aimLine.visible = false; // Hide the aim line after shooting
        currentPlayer = (currentPlayer + 1) % 2; // Switch player after shooting
    }
}

function onDocumentMouseMove(event) {
    if (selectedBall) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(balls);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const direction = new THREE.Vector3().subVectors(point, selectedBall.position).normalize();
            aimLine.geometry.setFromPoints([selectedBall.position, selectedBall.position.clone().add(direction.multiplyScalar(5))]);
            aimLine.visible = true;
        } else {
            aimLine.visible = false;
        }
    } else {
        // Seleciona a bola quando o mouse se move sobre ela
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(balls);
        if (intersects.length > 0) {
            selectedBall = intersects[0].object;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    balls.forEach(ball => {
        if (ball.velocity.length() > 0.01) { // Velocidade mínima para parar a bola
            ball.position.add(ball.velocity.clone().multiplyScalar(0.1));

            // Aplica fricção
            ball.velocity.multiplyScalar(friction);

            // Colisão com as bordas
            if (ball.position.x - ballRadius < -tableWidth / 2 || ball.position.x + ballRadius > tableWidth / 2) {
                ball.velocity.x = -ball.velocity.x;
                ball.position.x = THREE.MathUtils.clamp(ball.position.x, -tableWidth / 2 + ballRadius, tableWidth / 2 - ballRadius);
            }
            if (ball.position.z - ballRadius < -tableHeight / 2 || ball.position.z + ballRadius > tableHeight / 2) {
                ball.velocity.z = -ball.velocity.z;
                ball.position.z = THREE.MathUtils.clamp(ball.position.z, -tableHeight / 2 + ballRadius, tableHeight / 2 - ballRadius);
            }

            // Colisão com outras bolas
            balls.forEach(otherBall => {
                if (ball !== otherBall && ball.position.distanceTo(otherBall.position) < 2 * ballRadius) {
                    resolveCollision(ball, otherBall);
                }
            });

            // Detecção de caçapas
            pockets.forEach(pocket => {
                if (ball.position.distanceTo(pocket.position) < pocketRadius) {
                    // Remove a bola da cena e do array
                    scene.remove(ball);
                    balls = balls.filter(b => b !== ball);
                    // Incrementa o placar do jogador atual
                    playerScores[currentPlayer]++;
                    document.getElementById('player' + (currentPlayer + 1)).innerText = `Jogador ${currentPlayer + 1}: ${playerScores[currentPlayer]}`;
                }
            });
        } else {
            ball.velocity.set(0, 0, 0); // Para a bola completamente
        }
    });

    renderer.render(scene, camera);
}

function resolveCollision(ball1, ball2) {
    const normal = new THREE.Vector3().subVectors(ball2.position, ball1.position).normalize();
    const relativeVelocity = new THREE.Vector3().subVectors(ball1.velocity, ball2.velocity);
    const speedAlongNormal = relativeVelocity.dot(normal);

    // Verifica se as bolas estão se aproximando
    if (speedAlongNormal < 0) {
        const impulseMagnitude = -(1 + 0.8) * speedAlongNormal / (1 / ball1.mass + 1 / ball2.mass);
        const impulse = normal.clone().multiplyScalar(impulseMagnitude);

        ball1.velocity.add(impulse.clone().multiplyScalar(1 / ball1.mass));
        ball2.velocity.sub(impulse.clone().multiplyScalar(1 / ball2.mass));

        // Verifica e corrige a sobreposição
        const overlap = 2 * ballRadius - ball1.position.distanceTo(ball2.position);
        if (overlap > 0) {
            const correction = normal.clone().multiplyScalar(overlap * 0.5);
            ball1.position.sub(correction);
            ball2.position.add(correction);
        }
    }
}


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
