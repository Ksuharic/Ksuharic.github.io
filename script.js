// Инициализация игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const clockFace = document.getElementById('clock-face');
const clockHand = document.getElementById('clock-hand');
const menuScreen = document.getElementById('menuScreen');
const endScreen = document.getElementById('endScreen');
const endTitle = document.getElementById('endTitle');
const endMessage = document.getElementById('endMessage');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const loadingScreen = document.getElementById('loading');
const ui = document.getElementById('ui');
const puddlesCounter = document.getElementById('puddles-counter');

// Настройки игры
let GAME_WIDTH = window.innerWidth;
let GAME_HEIGHT = window.innerHeight;

// Состояние игры
let gameRunning = false;
let gameTime = 0;
let maxGameTime = 120; // 2 минуты
let puddlesCount = 50; // Увеличили начальное количество луж
let puddles = [];
let clouds = [];
let buildings = [];
let sunX = 0;
let sunY = 0;
let sunSize = 80;
let sunTargetX = 0;
let sunSpeed = 5;
let sunFace = 'happy';
let gameTimeRatio = 0;
let lightPower = 1;
let lastCloudSpawn = 0;
let lastStormSpawn = 0;
let skyColor = { r: 135, g: 206, b: 235 };
let groundColor = { r: 124, g: 252, b: 0 };
let roadColor = { r: 51, g: 51, b: 51 };
let sidewalkColor = { r: 170, g: 170, b: 170 };
let curbColor = { r: 85, g: 85, b: 85 };
let roadMarkingColor = { r: 255, g: 255, b: 255 };
let rainDrops = [];
let isSunVisible = true;
let isSunBeamVisible = true;

// Ресайз канваса
function resizeCanvas() {
    GAME_WIDTH = window.innerWidth;
    GAME_HEIGHT = window.innerHeight;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    sunX = Math.min(Math.max(GAME_WIDTH / 2, sunSize), GAME_WIDTH - sunSize);
    sunY = sunSize * 1.5;
    sunTargetX = sunX;
    
    createBuildings();
}

// Создание зданий (сделаны меньше)
function createBuildings() {
    buildings = [];
    const groundLevel = GAME_HEIGHT * 0.7;
    
    // 3 слоя зданий
    for (let layer = 0; layer < 3; layer++) {
        const layerCount = 5 + layer * 3;
        const layerHeight = groundLevel * (0.5 - layer * 0.1); // Уменьшил высоту
        const layerColor = [
            '#4B0082',  // Темно-фиолетовый (передний план)
            '#663399',  // Темно-сиреневый
            '#9370DB'   // Светло-сиреневый
        ][layer];
        
        for (let i = 0; i < layerCount; i++) {
            const width = 60 + Math.random() * 80; // Уменьшил ширину
            const height = 80 + Math.random() * 120; // Уменьшил высоту
            const x = (GAME_WIDTH / layerCount) * i + Math.random() * 50 - 25;
            
            buildings.push({
                x: x,
                y: groundLevel - height,
                width: width,
                height: height,
                color: layerColor,
                layer: layer,
                windows: [],
                baseColor: layerColor
            });
            
            // Добавляем прямоугольные окна с равными отступами
            const windowWidth = 6; // Уменьшил ширину окна
            const windowHeight = 8; // Уменьшил высоту окна
            const windowMargin = 8; // Расстояние между окнами и от краев
            const windowsPerRow = Math.floor((width - windowMargin * 2) / (windowWidth + windowMargin));
            const windowRows = Math.floor((height - windowMargin * 2) / (windowHeight + windowMargin));
            
            // Центрируем окна
            const totalWindowsWidth = windowsPerRow * windowWidth + (windowsPerRow - 1) * windowMargin;
            const startX = (width - totalWindowsWidth) / 2;
            
            const totalWindowsHeight = windowRows * windowHeight + (windowRows - 1) * windowMargin;
            const startY = (height - totalWindowsHeight) / 2;
            
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowsPerRow; col++) {
                    if (col % 2 === row % 2) continue;
                    
                    buildings[buildings.length - 1].windows.push({
                        x: startX + col * (windowWidth + windowMargin),
                        y: startY + row * (windowHeight + windowMargin),
                        width: windowWidth,
                        height: windowHeight,
                        lit: Math.random() > 0.8, // Только 20% окон изначально горят
                        alpha: 0
                    });
                }
            }
        }
    }
}

// Создание луж
function createPuddles() {
    puddles = [];
    const groundLevel = GAME_HEIGHT * 0.7;
    
    for (let i = 0; i < puddlesCount; i++) {
        const isOnRoad = Math.random() < 0.3;
        const yOffset = isOnRoad ? 40 : 10; // Сместили лужи вниз
        
        puddles.push({
            x: Math.random() * GAME_WIDTH,
            y: groundLevel + yOffset + Math.random() * 30 + 20,
            width: Math.random() * 120 + 80,
            height: Math.random() * 40 + 20,
            size: 1,
            drying: false,
            wetness: 1,
            isOnRoad: isOnRoad,
            baseColor: isOnRoad ? { r: 100, g: 100, b: 255 } : { r: 64, g: 164, b: 255 }
        });
    }
    
    updatePuddlesCounter();
}

function updatePuddlesCounter() {
    puddlesCounter.textContent = `Лужи: ${puddles.length}`;
}

// Создание облака
function createCloud(isStorm = false) {
    const size = 80 + Math.random() * 80;
    const speed = 1 + Math.random() * 2;
    const y = Math.random() * (GAME_HEIGHT * 0.4) + 50;
    
    clouds.push({
        x: Math.random() < 0.5 ? -size : GAME_WIDTH + size,
        y: y,
        width: size,
        height: size * 0.6,
        speed: speed * (Math.random() < 0.5 ? 1 : -1),
        isStorm: isStorm,
        face: isStorm ? 'angry' : 'normal',
        wetness: 0,
        parts: [],
        baseColor: isStorm ? { r: 150, g: 150, b: 150 } : { r: 220, g: 220, b: 220 }
    });
    
    const cloud = clouds[clouds.length - 1];
    const partCount = 4 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < partCount; i++) {
        cloud.parts.push({
            x: (Math.random() - 0.5) * cloud.width * 0.6,
            y: (Math.random() - 0.5) * cloud.height * 0.6,
            width: cloud.width * (0.4 + Math.random() * 0.4),
            height: cloud.height * (0.4 + Math.random() * 0.4)
        });
    }
}

// Создание капли дождя
function createRainDrop(cloud) {
    const groundLevel = GAME_HEIGHT * 0.7;
    // Не даем лужам появляться слишком близко к краям экрана
    const minX = 100;
    const maxX = GAME_WIDTH - 100;
    const x = Math.min(maxX, Math.max(minX, cloud.x + (Math.random() - 0.5) * cloud.width * 0.8));
    
    for (let i = 0; i < 3; i++) {
        rainDrops.push({
            x: x + (Math.random() - 0.5) * 10,
            y: cloud.y + cloud.height/2 + (Math.random() - 0.5) * 10,
            endY: groundLevel + 60 + (Math.random() - 0.5) * 20, // Сместили лужи вниз
            speed: 3 + Math.random() * 4,
            angle: (Math.random() - 0.5) * 0.2,
            length: 10 + Math.random() * 10,
            alpha: 0.7,
            cloud: cloud
        });
    }
}

// Проверка столкновения луча с лужей
function checkPuddleCollision() {
    if (!isSunBeamVisible) return false;
    
    const beamWidth = 150 * lightPower;
    const beamStartX = Math.max(0, sunX - beamWidth / 2);
    const beamEndX = Math.min(GAME_WIDTH, sunX + beamWidth / 2);
    const groundLevel = GAME_HEIGHT * 0.7;
    
    let anyPuddleDrying = false;
    let puddlesRemoved = false;
    
    for (let i = 0; i < puddles.length; i++) {
        const puddle = puddles[i];
        
        // Проверяем пересечение прямоугольников (луча и лужи)
        const puddleLeft = puddle.x - puddle.width / 2 * puddle.size;
        const puddleRight = puddle.x + puddle.width / 2 * puddle.size;
        
        // Если есть пересечение по X и лужа находится на земле
        if (puddleRight > beamStartX && 
            puddleLeft < beamEndX && 
            puddle.y < groundLevel + 100 && 
            puddle.size > 0) {
            
            if (!puddle.drying) {
                puddle.drying = true;
            }
            
            puddle.wetness = Math.max(0, puddle.wetness - 0.005 * lightPower);
            puddle.size = puddle.wetness;
            anyPuddleDrying = true;
        } else {
            puddle.drying = false;
        }
        
        // Лужа исчезает, когда становится достаточно маленькой (не обязательно полностью)
        if (puddle.size <= 0.2) {
            puddles.splice(i, 1);
            i--;
            puddlesRemoved = true;
        }
    }
    
    if (puddlesRemoved) {
        updatePuddlesCounter();
    }
    
    if (puddles.length === 0) {
        endGame(true);
    }
    
    return anyPuddleDrying;
}

// Проверка видимости солнца и луча
function checkSunVisibility() {
    const groundLevel = GAME_HEIGHT * 0.7;
    isSunBeamVisible = true;
    
    // Проверяем, не закрыто ли лицо солнца зданиями
    for (const building of buildings) {
        const buildingRight = building.x + building.width;
        const buildingBottom = building.y + building.height;
        
        // Проверяем, находится ли лицо солнца (центр) внутри здания
        const faceY = sunY + sunSize * 0.15; // Примерное положение лица
        if (sunX > building.x && sunX < buildingRight &&
            faceY > building.y && faceY < buildingBottom) {
            isSunBeamVisible = false;
            break;
        }
    }
    
    if (!isSunBeamVisible) return false;
    
    // Проверяем луч солнца на пересечение с облаками
    const beamWidth = 150 * lightPower;
    const beamStartX = Math.max(0, sunX - beamWidth / 2);
    const beamEndX = Math.min(GAME_WIDTH, sunX + beamWidth / 2);
    const beamTopY = sunY;
    const beamBottomY = groundLevel + 100;
    
    for (const cloud of clouds) {
        const cloudLeft = cloud.x - cloud.width/2;
        const cloudRight = cloud.x + cloud.width/2;
        const cloudTop = cloud.y - cloud.height/2;
        const cloudBottom = cloud.y + cloud.height/2;
        
        // Проверяем, пересекается ли луч с облаком
        const beamIntersectsCloud = 
            beamEndX > cloudLeft && 
            beamStartX < cloudRight && 
            beamBottomY > cloudTop && 
            beamTopY < cloudBottom;
        
        // Проверяем, закрывает ли облако лицо солнца
        const coversSunFace = 
            sunX > cloudLeft && 
            sunX < cloudRight && 
            (sunY + sunSize * 0.15) > cloudTop && 
            (sunY + sunSize * 0.15) < cloudBottom;
        
        if (beamIntersectsCloud || coversSunFace) {
            isSunBeamVisible = false;
            
            if (cloud.isStorm && Math.random() < 0.05) {
                createRainDrop(cloud);
            }
            break;
        }
    }
    
    return true;
}

// Обновление цветов окружения
function updateColors() {
    // Целевые цвета
    const dayColorTop = { r: 100, g: 180, b: 255 };
    const dayColorMiddle = { r: 255, g: 255, b: 255 };
    const dayColorBottom = { r: 100, g: 180, b: 255 };
    const nightColorTop = { r: 10, g: 10, b: 60 };
    const nightColorMiddle = { r: 150, g: 200, b: 255 };
    const nightColorBottom = { r: 10, g: 10, b: 60 };
    
    const dayGroundColor = { r: 124, g: 252, b: 0 };
    const nightGroundColor = { r: 30, g: 80, b: 40 };
    
    const dayRoadColor = { r: 51, g: 51, b: 51 };
    const nightRoadColor = { r: 20, g: 20, b: 20 };
    
    const daySidewalkColor = { r: 170, g: 170, b: 170 };
    const nightSidewalkColor = { r: 80, g: 80, b: 80 };
    
    const dayCurbColor = { r: 85, g: 85, b: 85 };
    const nightCurbColor = { r: 40, g: 40, b: 40 };
    
    const dayRoadMarkingColor = { r: 255, g: 255, b: 255 };
    const nightRoadMarkingColor = { r: 180, g: 180, b: 180 };
    
    // Затемнение после 90 секунд
    if (gameTime > 90) {
        const progress = Math.min(1, (gameTime - 90) / 30);
        
        // Небо
        skyColor = {
            r: Math.round(100 + (10 - 100) * progress),
            g: Math.round(180 + (10 - 180) * progress),
            b: Math.round(255 + (60 - 255) * progress)
        };
        
        // Земля
        groundColor = {
            r: Math.round(124 + (30 - 124) * progress),
            g: Math.round(252 + (80 - 252) * progress),
            b: Math.round(0 + (40 - 0) * progress)
        };
        
        // Дорога
        roadColor = {
            r: Math.round(51 + (20 - 51) * progress),
            g: Math.round(51 + (20 - 51) * progress),
            b: Math.round(51 + (20 - 51) * progress)
        };
        
        // Тротуар
        sidewalkColor = {
            r: Math.round(170 + (80 - 170) * progress),
            g: Math.round(170 + (80 - 170) * progress),
            b: Math.round(170 + (80 - 170) * progress)
        };
        
        // Бордюр
        curbColor = {
            r: Math.round(85 + (40 - 85) * progress),
            g: Math.round(85 + (40 - 85) * progress),
            b: Math.round(85 + (40 - 85) * progress)
        };
        
        // Разметка
        roadMarkingColor = {
            r: Math.round(255 + (180 - 255) * progress),
            g: Math.round(255 + (180 - 255) * progress),
            b: Math.round(255 + (180 - 255) * progress)
        };
        
        // Здания
        for (const building of buildings) {
            const baseColor = hexToRgb(building.baseColor);
            building.color = `rgb(
                ${Math.round(baseColor.r * (1 - progress * 0.7))},
                ${Math.round(baseColor.g * (1 - progress * 0.7))},
                ${Math.round(baseColor.b * (1 - progress * 0.7))}
            )`;
        }
        
        // Облака и тучи - темнеют и становятся голубее
        for (const cloud of clouds) {
            const baseColor = cloud.baseColor;
            const targetColor = {
                r: Math.round(baseColor.r * 0.6),
                g: Math.round(baseColor.g * 0.6),
                b: Math.round(baseColor.b * 0.8)
            };
            
            cloud.currentColor = `rgba(
                ${Math.round(baseColor.r + (targetColor.r - baseColor.r) * progress)},
                ${Math.round(baseColor.g + (targetColor.g - baseColor.g) * progress)},
                ${Math.round(baseColor.b + (targetColor.b - baseColor.b) * progress)},
                ${0.8}
            )`;
        }
        
        // Лужи - темнеют
        for (const puddle of puddles) {
            const baseColor = puddle.baseColor;
            const targetColor = {
                r: Math.round(baseColor.r * 0.6),
                g: Math.round(baseColor.g * 0.6),
                b: Math.round(baseColor.b * 0.6)
            };
            
            puddle.currentColor = `rgba(
                ${Math.round(baseColor.r + (targetColor.r - baseColor.r) * progress)},
                ${Math.round(baseColor.g + (targetColor.g - baseColor.g) * progress)},
                ${Math.round(baseColor.b + (targetColor.b - baseColor.b) * progress)},
                ${0.8 * puddle.size}
            )`;
        }
    } else {
        skyColor = dayColorTop;
        groundColor = dayGroundColor;
        roadColor = dayRoadColor;
        sidewalkColor = daySidewalkColor;
        curbColor = dayCurbColor;
        roadMarkingColor = dayRoadMarkingColor;
        
        for (const building of buildings) {
            building.color = building.baseColor;
        }
        
        for (const cloud of clouds) {
            cloud.currentColor = `rgba(${cloud.baseColor.r}, ${cloud.baseColor.g}, ${cloud.baseColor.b}, 0.8)`;
        }
        
        for (const puddle of puddles) {
            puddle.currentColor = `rgba(${puddle.baseColor.r}, ${puddle.baseColor.g}, ${puddle.baseColor.b}, ${0.8 * puddle.size})`;
        }
    }
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

// Обновление прозрачности окон (включаются только некоторые)
function updateWindows() {
    const targetAlpha = 0.7;
    
    for (const building of buildings) {
        for (const window of building.windows) {
            if (window.lit) {
                // Окна зажигаются постепенно и не все
                if (gameTime > 110 && Math.random() < 0.003) { // Только 0.3% шанс включения
                    window.lit = true;
                }
                window.alpha = Math.min(targetAlpha, window.alpha + 0.01);
            } else {
                window.alpha = Math.max(0, window.alpha - 0.01);
            }
        }
    }
}

// Обновление часов
function updateClock() {
    const angle = 360 * gameTimeRatio;
    clockHand.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    
    // Изменение цвета часов
    if (gameTime < 60) {
        clockFace.style.background = '#4CAF50'; // зеленый
    } else if (gameTime < 90) {
        const progress = (gameTime - 60) / 30;
        clockFace.style.background = `rgb(
            ${76 + (255-76)*progress}, 
            ${175 + (255-175)*progress}, 
            ${80 + (0-80)*progress}
        )`; // зеленый -> желтый
    } else {
        const progress = Math.min(1, (gameTime - 90) / 30);
        clockFace.style.background = `rgb(
            ${255}, 
            ${255 - (255-69)*progress}, 
            ${0}
        )`; // желтый -> красный
    }
}

// Обновление игры
function updateGame(deltaTime) {
    if (!gameRunning) return;
    
    gameTime += deltaTime / 1000;
    gameTimeRatio = Math.min(1, gameTime / maxGameTime);
    
    checkSunVisibility();
    updateColors();
    updateWindows();
    updateClock();
    
    if (gameTime >= maxGameTime) {
        endGame(false);
        return;
    }
    
    // Движение солнца
    if (leftKeyPressed) {
        sunTargetX = Math.max(sunSize, sunTargetX - sunSpeed);
    }
    if (rightKeyPressed) {
       sunTargetX = Math.min(GAME_WIDTH - sunSize, sunTargetX + sunSpeed);
    }
    sunTargetX = Math.min(Math.max(sunTargetX, sunSize), GAME_WIDTH - sunSize);
    sunX += (sunTargetX - sunX) * 0.1;
    
    // Солнце начинает опускаться после 60 секунд
    if (gameTime > 60) {
        const sunProgress = Math.min(1, (gameTime - 60) / (maxGameTime - 60));
        // Солнце опускается только до середины экрана и немного уменьшается
        sunY = sunSize * 1.5 + (GAME_HEIGHT * 0.6 - sunSize * 1.5) * sunProgress;
        lightPower = Math.max(0.4, 1 - sunProgress * 0.6); // Солнце не исчезает полностью
        sunSize = 80 * Math.max(0.8, 1 - sunProgress * 0.4); // Уменьшаем размер солнца
    } else {
        sunY = sunSize * 1.5;
        lightPower = 1;
        sunSize = 80;
    }
    
    // Обновление облаков
    for (let i = 0; i < clouds.length; i++) {
        const cloud = clouds[i];
        cloud.x += cloud.speed;
        
        if (cloud.x < -cloud.width * 2 || cloud.x > GAME_WIDTH + cloud.width * 2) {
            clouds.splice(i, 1);
            i--;
        }
    }
    
    // Спавн облаков
    if (gameTime - lastCloudSpawn > Math.random() * 8 + 1) {
        createCloud(Math.random() < 0.4);
        lastCloudSpawn = gameTime;
    }
    
    // Обновление капель дождя
    for (let i = 0; i < rainDrops.length; i++) {
        const drop = rainDrops[i];
        drop.y += drop.speed;
        drop.x += drop.angle * drop.speed;
        
        if (drop.y >= drop.endY) {
            const groundLevel = GAME_HEIGHT * 0.7;
            // Увеличиваем размер луж от дождя и не даем им появляться у краев
            const minX = 100;
            const maxX = GAME_WIDTH - 100;
            const x = Math.min(maxX, Math.max(minX, drop.x));
            
            puddles.push({
                x: x,
                y: groundLevel + 40 + (Math.random() - 0.5) * 20,
                width: 60 + Math.random() * 60, // Большие лужи от дождя
                height: 25 + Math.random() * 25,
                size: 1,
                drying: false,
                wetness: 1,
                isOnRoad: Math.random() < 0.3,
                baseColor: Math.random() < 0.3 ? { r: 100, g: 100, b: 255 } : { r: 64, g: 164, b: 255 }
            });
            
            rainDrops.splice(i, 1);
            i--;
            updatePuddlesCounter();
        }
    }
    
    const isDrying = checkPuddleCollision();
    sunFace = !isSunBeamVisible ? 'sad' : (isDrying ? 'happy' : 'neutral');
}

// Отрисовка игры с правильным порядком элементов
function drawGame() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    drawSky();
    
    if (gameTime > 110) {
        drawStars();
    }
    
    // Рисуем солнце
    drawSun();
    
    // Рисуем здания
    drawBuildings();
    
    // Остальные элементы
    drawGround();
    drawClouds();
    drawRain();
    drawPuddles();
    
    // Рисуем луч солнца
    if (isSunBeamVisible && sunY < GAME_HEIGHT * 0.7) {
        drawSunBeam();
    }
    
}

// Рисуем небо с градиентом к середине
function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    
    if (gameTime > 90) {
        const progress = Math.min(1, (gameTime - 90) / 30);
        
        const topColor = {
            r: Math.round(100 + (10 - 100) * progress),
            g: Math.round(180 + (10 - 180) * progress),
            b: Math.round(255 + (60 - 255) * progress)
        };
        
        const middleColor = {
            r: Math.round(255 + (150 - 255) * progress),
            g: Math.round(255 + (200 - 255) * progress),
            b: Math.round(255 + (255 - 255) * progress)
        };
        
        const bottomColor = {
            r: Math.round(200 + (25 - 200) * progress),
            g: Math.round(230 + (25 - 230) * progress),
            b: Math.round(255 + (112 - 255) * progress)
        };
        
        gradient.addColorStop(0, `rgb(${topColor.r}, ${topColor.g}, ${topColor.b})`);
        gradient.addColorStop(0.5, `rgb(${middleColor.r}, ${middleColor.g}, ${middleColor.b})`);
        gradient.addColorStop(1, `rgb(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b})`);
    } else {
        gradient.addColorStop(0, 'rgb(100, 180, 255)');
        gradient.addColorStop(0.5, 'rgb(255, 255, 255)');
        gradient.addColorStop(1, 'rgb(200, 230, 255)');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

// Рисуем здания с прямоугольными окнами
function drawBuildings() {
    const groundLevel = GAME_HEIGHT * 0.7;
    
    for (let layer = 2; layer >= 0; layer--) {
        const layerBuildings = buildings.filter(b => b.layer === layer);
        
        for (const building of layerBuildings) {
            ctx.fillStyle = building.color;
            ctx.fillRect(building.x, building.y, building.width, building.height);
            
            for (const window of building.windows) {
                if (window.lit) {
                    ctx.fillStyle = `rgba(255, 215, 0, ${window.alpha})`;
                    ctx.fillRect(
                        building.x + window.x, 
                        building.y + window.y, 
                        window.width, 
                        window.height
                    );
                }
            }
        }
    }
}

// Рисуем землю
function drawGround() {
    const groundLevel = GAME_HEIGHT * 0.7;
    
    ctx.fillStyle = `rgb(${groundColor.r}, ${groundColor.g}, ${groundColor.b})`;
    ctx.fillRect(0, groundLevel, GAME_WIDTH, GAME_HEIGHT - groundLevel);
    
    ctx.fillStyle = `rgb(${roadColor.r}, ${roadColor.g}, ${roadColor.b})`;
    ctx.fillRect(0, groundLevel + 20, GAME_WIDTH, 50);
    
    ctx.fillStyle = `rgb(${roadMarkingColor.r}, ${roadMarkingColor.g}, ${roadMarkingColor.b})`;
    for (let x = 20; x < GAME_WIDTH; x += 60) {
        ctx.fillRect(x, groundLevel + 45, 40, 5);
    }
    
    ctx.fillStyle = `rgb(${curbColor.r}, ${curbColor.g}, ${curbColor.b})`;
    ctx.fillRect(0, groundLevel + 70, GAME_WIDTH, 10);
    
    ctx.fillStyle = `rgb(${sidewalkColor.r}, ${sidewalkColor.g}, ${sidewalkColor.b})`;
    ctx.fillRect(0, groundLevel + 80, GAME_WIDTH, 30);
}

// Рисуем луч солнца 
function drawSunBeam() {
    const beamTopWidth = 50 * lightPower;
    const beamBottomWidth = 200 * lightPower;
    const groundLevel = GAME_HEIGHT * 0.7;

    // Смещение луча вниз (20% от размера солнца)
    const beamOffsetY = sunSize * 0.4;
    const beamStartY = sunY + beamOffsetY;

    // Основной луч с мягкими краями
    ctx.save();

    // 1. Создаем градиент для основного луча
    const gradient = ctx.createLinearGradient(
        sunX, beamStartY,  // Используем beamStartY вместо sunY
        sunX, groundLevel + 100
    );
    gradient.addColorStop(0, `rgba(255, 255, 180, ${0.7 * lightPower})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 200, ${0.4 * lightPower})`);
    gradient.addColorStop(1, `rgba(255, 255, 150, 0)`);

    // 2. Рисуем основную трапецию со смещением
    ctx.beginPath();
    ctx.moveTo(sunX - beamTopWidth/2, beamStartY);  // Используем beamStartY
    ctx.lineTo(sunX + beamTopWidth/2, beamStartY);  // Используем beamStartY
    ctx.lineTo(sunX + beamBottomWidth/2, groundLevel + 100);
    ctx.lineTo(sunX - beamBottomWidth/2, groundLevel + 100);
    ctx.closePath();

    // 3. Применяем размытие через фильтр (если поддерживается)
    if (typeof ctx.filter !== 'undefined') {
        ctx.filter = `blur(${8 * lightPower}px)`;
    }

    ctx.fillStyle = gradient;
    ctx.fill();

    // 4. Добавляем свечение без артефактов (также со смещением)
    if (typeof ctx.filter !== 'undefined') {
        ctx.filter = 'none';
        const glowGradient = ctx.createRadialGradient(
            sunX, beamStartY, 0,  // Используем beamStartY вместо sunY
            sunX, beamStartY, beamTopWidth * 1.5  // Используем beamStartY
        );
        glowGradient.addColorStop(0, `rgba(255, 255, 100, ${0.3 * lightPower})`);
        glowGradient.addColorStop(1, 'rgba(255, 255, 100, 0)');

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(sunX, beamStartY, beamTopWidth * 1.5, 0, Math.PI * 2);  // Используем beamStartY
        ctx.fill();
    }

    ctx.restore();
}

// Рисуем облака
function drawClouds() {
    for (const cloud of clouds) {
        ctx.fillStyle = cloud.currentColor || 
            (cloud.isStorm ? `rgba(150, 150, 150, 0.8)` : `rgba(220, 220, 220, 0.8)`);
        
        for (const part of cloud.parts) {
            ctx.beginPath();
            ctx.ellipse(
                cloud.x + part.x,
                cloud.y + part.y,
                part.width / 2,
                part.height / 2,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        if (cloud.width > 70) {
            ctx.fillStyle = '#333333';
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 4;
            
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            for (const part of cloud.parts) {
                minX = Math.min(minX, cloud.x + part.x - part.width/2);
                maxX = Math.max(maxX, cloud.x + part.x + part.width/2);
                minY = Math.min(minY, cloud.y + part.y - part.height/2);
                maxY = Math.max(maxY, cloud.y + part.y + part.height/2);
            }
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            
            // Фиксированные расстояния между элементами лица
            const eyeOffsetX = 15; // Фиксированное расстояние между глазами
            const eyeOffsetY = cloud.height * 0.15;
            const mouthOffsetY = cloud.height * 0.15;
            
            if (cloud.face === 'angry') {
                // Брови
                ctx.fillRect(centerX - eyeOffsetX - 5, centerY - eyeOffsetY - 5, 15, 4);
                ctx.fillRect(centerX + eyeOffsetX - 5, centerY - eyeOffsetY - 5, 15, 4);
                
                // Глаза
                ctx.beginPath();
                ctx.arc(centerX - eyeOffsetX, centerY - eyeOffsetY, 5, 0, Math.PI * 2);
                ctx.arc(centerX + eyeOffsetX, centerY - eyeOffsetY, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Рот
                ctx.beginPath();
                ctx.arc(centerX, centerY + mouthOffsetY, 8, Math.PI, Math.PI * 2);
                ctx.stroke();
            } else {
                // Глаза
                ctx.beginPath();
                ctx.arc(centerX - eyeOffsetX, centerY - eyeOffsetY, 5, 0, Math.PI * 2);
                ctx.arc(centerX + eyeOffsetX, centerY - eyeOffsetY, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Рот
                ctx.beginPath();
                ctx.arc(centerX, centerY + mouthOffsetY, 8, 0, Math.PI);
                ctx.stroke();
            }
        }
    }
}

// Рисуем дождь
function drawRain() {
    ctx.strokeStyle = 'rgba(200, 200, 255, 0.7)';
    
    for (const drop of rainDrops) {
        ctx.lineWidth = 2 + Math.random();
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(
            drop.x + drop.angle * drop.length,
            drop.y + drop.length
        );
        ctx.stroke();
    }
}

// Рисуем лужи (сделаны ярче)
function drawPuddles() {
    const groundLevel = GAME_HEIGHT * 0.7;

    for (const puddle of puddles) {
        // Используем текущий цвет лужи или базовый, если текущий не определен
        const puddleColor = puddle.currentColor || 
            `rgba(${puddle.baseColor.r}, ${puddle.baseColor.g}, ${puddle.baseColor.b}, ${0.8 * puddle.size})`;
    
        // Рисуем саму лужу
        ctx.fillStyle = puddleColor;
    
        ctx.beginPath();
        ctx.ellipse(
            puddle.x,
            puddle.y,
            puddle.width / 2 * puddle.size,
            puddle.height / 2 * puddle.size,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
    
        // Рисуем блик только если лужа достаточно большая
        if (puddle.drying && puddle.size > 0.3) {
            // Блик - это часть лужи, поэтому используем те же координаты и масштаб
            const highlightWidth = puddle.width / 6 * puddle.size;
            const highlightHeight = puddle.height / 8 * puddle.size;
    
            // Позиция блика относительно центра лужи (смещен вверх и вправо)
            const highlightX = puddle.x + puddle.width * 0.2 * puddle.size;
            const highlightY = puddle.y - puddle.height * 0.1 * puddle.size;
    
            ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * puddle.size * 0.9})`;
    
            ctx.beginPath();
            ctx.ellipse(
                highlightX,
                highlightY,
                highlightWidth,
                highlightHeight,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
       }
    }
}

// Рисуем солнце
function drawSun() {
    const drawX = Math.max(sunSize * lightPower, Math.min(sunX, GAME_WIDTH - sunSize * lightPower));
    const drawY = Math.max(sunSize * lightPower, Math.min(sunY, GAME_HEIGHT - sunSize * lightPower));
    
    // Изменяем цвет солнца при закате
    let sunColor1, sunColor2;
    if (gameTime > 60) {
        const progress = Math.min(1, (gameTime - 60) / (maxGameTime - 60));
        sunColor1 = `rgb(255, ${Math.round(255 - 55 * progress)}, 0)`;
        sunColor2 = `rgba(255, ${Math.round(255 - 55 * progress)}, 0, 0)`;
    } else {
        sunColor1 = '#FFFF00';
        sunColor2 = 'rgba(255, 255, 0, 0)';
    }
    
    const gradient = ctx.createRadialGradient(
        drawX, drawY, sunSize * 0.3 * lightPower,
        drawX, drawY, sunSize * lightPower
    );
    gradient.addColorStop(0, sunColor1);
    gradient.addColorStop(1, sunColor2);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(drawX, drawY, sunSize * lightPower, 0, Math.PI * 2);
    ctx.fill();
    
    // Рисуем лицо солнца поверх луча
    ctx.fillStyle = '#333333';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4 * lightPower; // Уменьшаем толщину линий пропорционально
    
    if (sunFace === 'happy') {
        ctx.beginPath();
        ctx.arc(drawX - sunSize * 0.25 * lightPower, drawY - sunSize * 0.15 * lightPower, 
                sunSize * 0.08 * lightPower, 0, Math.PI * 2);
        ctx.arc(drawX + sunSize * 0.25 * lightPower, drawY - sunSize * 0.15 * lightPower, 
                sunSize * 0.08 * lightPower, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(drawX, drawY + sunSize * 0.15 * lightPower, 
                sunSize * 0.2 * lightPower, 0, Math.PI);
        ctx.stroke();
    } else if (sunFace === 'sad') {
        ctx.beginPath();
        ctx.arc(drawX - sunSize * 0.25 * lightPower, drawY - sunSize * 0.15 * lightPower, 
                sunSize * 0.08 * lightPower, 0, Math.PI * 2);
        ctx.arc(drawX + sunSize * 0.25 * lightPower, drawY - sunSize * 0.15 * lightPower, 
                sunSize * 0.08 * lightPower, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(drawX, drawY + sunSize * 0.3 * lightPower, 
                sunSize * 0.2 * lightPower, Math.PI, Math.PI * 2);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(drawX - sunSize * 0.25 * lightPower, drawY - sunSize * 0.15 * lightPower, 
                sunSize * 0.08 * lightPower, 0, Math.PI * 2);
        ctx.arc(drawX + sunSize * 0.25 * lightPower, drawY - sunSize * 0.15 * lightPower, 
                sunSize * 0.08 * lightPower, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(drawX - sunSize * 0.3 * lightPower, drawY + sunSize * 0.15 * lightPower);
        ctx.lineTo(drawX + sunSize * 0.3 * lightPower, drawY + sunSize * 0.15 * lightPower);
        ctx.stroke();
    }
}

// Рисуем звезды
function drawStars() {
    const starAlpha = Math.min(1, (gameTime - 110) / 10);
    
    if (!window.starPositions) {
        window.starPositions = [];
        const starCount = 150;
        
        for (let i = 0; i < starCount; i++) {
            window.starPositions.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * (GAME_HEIGHT * 0.6),
                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.5 + 0.5
            });
        }
    }
    
    for (const star of window.starPositions) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * starAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Завершение игры
function endGame(isWin) {
    gameRunning = false;
    
    endScreen.style.display = 'flex';
    
    if (isWin) {
        endTitle.textContent = 'Победа!';
        endMessage.textContent = 'Ты высушил все лужи до заката!';
    } else {
        endTitle.textContent = 'Поражение';
        endMessage.textContent = 'Солнце село, а лужи остались...';
    }
}

// Обработчики событий
function handleMouseMove(e) {
    sunTargetX = e.clientX;
}

function handleTouchMove(e) {
    e.preventDefault();
    sunTargetX = e.touches[0].clientX;
}

let leftKeyPressed = false;
let rightKeyPressed = false;

function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') {
        leftKeyPressed = true;
    } else if (e.key === 'ArrowRight') {
        rightKeyPressed = true;
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft') {
        leftKeyPressed = false;
    } else if (e.key === 'ArrowRight') {
        rightKeyPressed = false;
    }
}

function startGame() {
    menuScreen.style.display = 'none';
    endScreen.style.display = 'none';
    ui.style.display = 'flex';
    puddlesCounter.style.display = 'block';
    
    resizeCanvas();
    createPuddles();
    gameTime = 0;
    clouds = [];
    rainDrops = [];
    lastCloudSpawn = 0;
    lastStormSpawn = 0;
    sunFace = 'happy';
    window.starPositions = null;
    isSunVisible = true;
    isSunBeamVisible = true;
    
    gameRunning = true;
    lastTime = performance.now();
    gameLoop();
}

// Игровой цикл
let lastTime = 0;
function gameLoop(timestamp = 0) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    updateGame(deltaTime);
    drawGame();
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Инициализация
window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('touchmove', handleTouchMove, { passive: false });
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Загрузка игры
setTimeout(() => {
    loadingScreen.style.display = 'none';
    resizeCanvas();
}, 1500);