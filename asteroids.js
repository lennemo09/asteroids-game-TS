"use strict";
function asteroids() {
    const svg = document.getElementById("canvas");
    const svgRect = svg.getBoundingClientRect();
    const gameRuleDefault = {
        FPS: 30,
        rotateSpeed: 60,
        thrustSpeed: 3,
        bulletSpeed: 10,
        frictionMultiplier: 0.98,
        asteroidsCount: 0,
        asteroidsMaxSpeed: 8,
        asteroidsMaxCount: 4,
        asteroidsMaxSize: 6,
        explosionSize: 15,
        explosionTime: 400,
        delayBetweenShots: 500,
        enemyMoveSpeed: 0.5,
        enemyShootDelay: 1500,
        enemyBulletSpeed: 1
    };
    const gameRule = {
        FPS: 30,
        rotateSpeed: 60,
        thrustSpeed: 3,
        bulletSpeed: 10,
        frictionMultiplier: 0.98,
        asteroidsCount: 0,
        asteroidsMaxSpeed: 8,
        asteroidsMaxCount: 4,
        asteroidsMaxSize: 6,
        explosionSize: 15,
        explosionTime: 400,
        delayBetweenShots: 500,
        enemyMoveSpeed: 0.5,
        enemyShootDelay: 1500,
        enemyBulletSpeed: 1
    };
    const originX = svg.clientWidth / 2;
    const originY = svg.clientHeight / 2;
    let g = new Elem(svg, 'g')
        .attr("transform", "translate(" + String(originX) + " " + String(originY) + ") rotate(0)");
    const playerStats = {
        score: 0,
        lives: 3,
        level: 1,
        gameEnd: false
    };
    const powerUpNames = [
        "shield",
        "life",
        "speed",
        "laser"
    ];
    const shipStats = {
        alive: true,
        invulnerable: false,
        x: originX,
        y: originY,
        angle: 0,
        thrustX: 0,
        thrustY: 0,
        isShooting: false,
        lastShot: 0,
        firstBulletTime: 0,
    };
    const shipPower = {
        shield: false,
        speed: false,
        laser: false
    };
    const shipPowerPickupTime = {
        shield: 0,
        speed: 0,
        laser: 0
    };
    const shipPowerSprite = {
        shield: new Elem(svg, 'circle', g.elem)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 55)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", "0")
            .attr("stroke-dasharray", "8")
            .attr("stroke-linejoin", "bevel"),
        laser: new Elem(svg, 'line', g.elem)
            .attr("x1", -35 * Math.sin(shipStats.angle * Math.PI / 180))
            .attr("y1", -35 * Math.cos(shipStats.angle * Math.PI / 180))
            .attr("x2", -600 * Math.sin(shipStats.angle * Math.PI / 180))
            .attr("y2", -600 * Math.cos(shipStats.angle * Math.PI / 180))
            .attr("stroke", "white")
            .attr("stroke-width", "0")
            .attr("stroke-dasharray", "20 50")
            .attr("stroke-linejoin", "bevel"),
        speed: new Elem(svg, 'circle', g.elem)
            .attr("cx", 0)
            .attr("cy", 5 * Math.cos(shipStats.angle * Math.PI / 180))
            .attr("r", 5)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", "1")
    };
    let asteroidsArray = [];
    let bulletArray = [];
    let powerUpArray = [];
    let enemiesArray = [];
    let enemiesBulletArray = [];
    let ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 15,20 0,-20")
        .attr("style", "fill:none;stroke:white; stroke-width:1");
    function randInt(x, y) {
        return Math.floor(Math.random() * (Math.abs(x - y) + 1)) + x;
    }
    function generateAsteroid(asteroidsMaxSize = randInt(1, gameRule.asteroidsMaxSize), asteroidNewX = randInt(0, svg.clientWidth), asteroidNewY = randInt(0, svg.clientHeight)) {
        let asteroidX = asteroidNewX + randInt(-20, 20);
        let asteroidY = asteroidNewY + randInt(-20, 20);
        const asteroidSize = 10 * asteroidsMaxSize;
        const asteroidSpeedX = randInt(-(gameRule.asteroidsMaxSpeed), gameRule.asteroidsMaxSpeed) / 10;
        const asteroidSpeedY = randInt(-(gameRule.asteroidsMaxSpeed), gameRule.asteroidsMaxSpeed) / 10;
        if (asteroidX === shipStats.x && asteroidY === shipStats.y) {
            asteroidX += randInt(10, 10);
            asteroidY += randInt(10, 10);
        }
        const asteroidElem = new Elem(svg, 'circle')
            .attr("cx", asteroidX)
            .attr("cy", asteroidY)
            .attr("r", asteroidSize)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", "1")
            .attr("xSpeed", asteroidSpeedX)
            .attr("ySpeed", asteroidSpeedY)
            .attr("destroyed", "false");
        gameRule.asteroidsCount += 1;
        return asteroidElem;
    }
    function moveAsteroid(asteroid) {
        gameTick.takeUntil(gameTick.filter(_ => asteroid.attr("destroyed") === "true")).subscribe(() => {
            asteroid.attr("cx", Number(asteroid.attr("cx")) + Number(asteroid.attr("xSpeed")));
            asteroid.attr("cy", Number(asteroid.attr("cy")) - Number(asteroid.attr("ySpeed")));
            if (Number(asteroid.attr("cx")) < 0) {
                asteroid.attr("cx", svg.clientWidth);
            }
            else if (Number(asteroid.attr("cx")) > svg.clientWidth) {
                asteroid.attr("cx", 0);
            }
            if (Number(asteroid.attr("cy")) < 0) {
                asteroid.attr("cy", svg.clientHeight);
            }
            else if (Number(asteroid.attr("cy")) > svg.clientHeight) {
                asteroid.attr("cy", 0);
            }
        });
    }
    function createBullet() {
        const bullet = new Elem(svg, 'rect')
            .attr('x', shipStats.x + 20 * Math.sin(shipStats.angle * Math.PI / 180))
            .attr('y', shipStats.y - 20 * Math.cos(shipStats.angle * Math.PI / 180))
            .attr('width', 2).attr('height', 2)
            .attr('fill', 'none')
            .attr("stroke", "white")
            .attr("stroke-width", "1")
            .attr("hit", "false")
            .attr("outside", "false")
            .attr("bulletAngle", String(shipStats.angle));
        return bullet;
    }
    function moveBullet(bullet) {
        gameTick.takeUntil(gameTick.filter(_ => bullet.attr("hit") === "true" || bullet.attr("outside") === "true"))
            .subscribe(() => {
            const currentAngle = Number(bullet.attr("bulletAngle"));
            const newX = Number(bullet.attr("x")) + gameRule.bulletSpeed * Math.sin(currentAngle * Math.PI / 180);
            const newY = Number(bullet.attr("y")) - gameRule.bulletSpeed * Math.cos(currentAngle * Math.PI / 180);
            bullet.attr("x", String(newX));
            bullet.attr("y", String(newY));
            if (newX <= 0 || newX >= svg.clientWidth || newY <= 0 || newY >= svg.clientHeight) {
                bullet.attr("outside", "true");
                bullet.elem.remove();
            }
        });
    }
    function bulletHit(asteroid, bullet) {
        if (Math.abs((Number(bullet.attr("x"))) - (Number(asteroid.attr("cx")))) < Number(asteroid.attr("r"))
            && Math.abs((Number(bullet.attr("y"))) - (Number(asteroid.attr("cy")))) < Number(asteroid.attr("r"))) {
            return true;
        }
        else {
            return false;
        }
    }
    function bulletHitEnemy(enemy, bullet) {
        if (Number(enemy.attr("x")) <= Number(bullet.attr("x")) && Number(bullet.attr("x")) <= Number(enemy.attr("x")) + Number(enemy.attr("width"))
            && Number(enemy.attr("y")) <= Number(bullet.attr("y")) && Number(bullet.attr("y")) <= Number(enemy.attr("y")) + Number(enemy.attr("height"))) {
            return true;
        }
        else {
            return false;
        }
    }
    function enemyBulletHit(bullet) {
        if (Math.abs((Number(bullet.attr("cx"))) - shipStats.x) < 15
            && Math.abs((Number(bullet.attr("cy"))) - shipStats.y) < 15) {
            return true;
        }
        else {
            return false;
        }
    }
    function breakAsteroid(asteroid) {
        if (Number(asteroid.attr("r")) <= 10) {
            return;
        }
        else {
            const newAsteroid1 = generateAsteroid(Math.floor((Number(asteroid.attr("r")) / 10) / 2), Number(asteroid.attr("cx")), Number(asteroid.attr("cy")));
            const newAsteroid2 = generateAsteroid(Math.floor((Number(asteroid.attr("r")) / 10) / 2), Number(asteroid.attr("cx")), Number(asteroid.attr("cy")));
            asteroidsArray.push(newAsteroid1);
            moveAsteroid(newAsteroid1);
            asteroidsArray.push(newAsteroid2);
            moveAsteroid(newAsteroid2);
        }
    }
    function shipNotCollide(asteroid) {
        if (Math.abs((shipStats.x) - (Number(asteroid.attr("cx")))) < Number(asteroid.attr("r"))
            && Math.abs((shipStats.y) - (Number(asteroid.attr("cy")))) < Number(asteroid.attr("r"))) {
            return false;
        }
        else {
            return true;
        }
    }
    function shipCollidePowerUp(powerUp) {
        if (Math.abs((shipStats.x) - (Number(powerUp.attr("cx")))) < Number(powerUp.attr("r"))
            && Math.abs((shipStats.y) - (Number(powerUp.attr("cy")))) < Number(powerUp.attr("r"))) {
            return true;
        }
        else {
            return false;
        }
    }
    function createExplosion(x, y, explosionSize = gameRule.explosionSize, explosionTime = gameRule.explosionTime) {
        const explosion = new Elem(svg, 'circle')
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", explosionSize / (explosionTime / 10))
            .attr("fill", "white")
            .attr("stroke", "white")
            .attr("stroke-width", "1")
            .attr("finished", "false");
        Observable.interval(10).takeUntil(Observable.interval(explosionTime)).subscribe(_ => {
            explosion.attr("r", String(Number(explosion.attr("r")) + gameRule.explosionSize / (explosionTime / 10)));
        });
        Observable.interval(explosionTime).subscribe(_ => {
            explosion.elem.remove();
        });
    }
    function spawnPowerUp() {
        const powerUpType = powerUpNames[randInt(0, powerUpNames.length - 1)];
        const x = randInt(0, svg.clientWidth);
        const y = randInt(0, svg.clientHeight);
        const powerUp = new Elem(svg, 'circle')
            .attr("powerType", String(powerUpType))
            .attr('cx', x).attr('cy', y)
            .attr("r", 20)
            .attr('fill', 'none')
            .attr("stroke", "white")
            .attr("stroke-width", "1")
            .attr("stroke-dasharray", "8")
            .attr("stroke-linejoin", "bevel")
            .attr("taken", "false");
        return powerUp;
    }
    function spawnEnemy() {
        const enemy = new Elem(svg, 'rect')
            .attr('x', randInt(0, svg.clientWidth))
            .attr('y', randInt(0, svg.clientHeight - 25))
            .attr('width', 30).attr('height', 25)
            .attr('fill', 'none')
            .attr("stroke", "white")
            .attr("stroke-width", "1")
            .attr("dead", "false")
            .attr("lastShot", "0");
        return enemy;
    }
    function moveEnemy(enemy) {
        gameTick.takeUntil(gameTick.filter(_ => enemy.attr("dead") === "true")).subscribe(() => {
            enemy.attr("x", Number(enemy.attr("x")) + gameRule.enemyMoveSpeed);
            if (Number(enemy.attr("x")) < 0 - Number(enemy.attr("width"))) {
                enemy.attr("x", svg.clientWidth);
            }
            else if (Number(enemy.attr("x")) > svg.clientWidth) {
                enemy.attr("x", 0 - Number(enemy.attr("width")));
            }
            if (Number(enemy.attr("y")) < 0 + Number(enemy.attr("height"))) {
                enemy.attr("y", svg.clientHeight - 25);
            }
            else if (Number(enemy.attr("y")) > svg.clientHeight) {
                enemy.attr("y", 0 - Number(enemy.attr("height")));
            }
        });
    }
    function getEnemyBulletAngle(enemy) {
        const x = Number(enemy.attr("x")) + (Number(enemy.attr("width"))) / 2;
        const y = Number(enemy.attr("y")) + (Number(enemy.attr("height"))) / 2;
        const dy = shipStats.y - y;
        const dx = shipStats.x - x;
        const atan = ((Math.atan2(dy, dx)) * 180 / Math.PI) + 90;
        if (atan < 0) {
            return (atan + 360);
        }
        else {
            return atan;
        }
    }
    function createEnemyBullet(enemy) {
        const bullet = new Elem(svg, 'circle')
            .attr('cx', Number(enemy.attr("x")) + (Number(enemy.attr("width"))) / 2)
            .attr('cy', Number(enemy.attr("y")) + (Number(enemy.attr("height"))) / 2)
            .attr('r', 4)
            .attr('fill', 'white')
            .attr("stroke", "white")
            .attr("stroke-width", "1")
            .attr("hit", "false")
            .attr("outside", "false")
            .attr("bulletAngle", String(getEnemyBulletAngle(enemy)));
        return bullet;
    }
    function fireEnemy(enemy) {
        gameTick.takeUntil(gameTick.filter(_ => enemy.attr("dead") === "true")).subscribe(({ currentTick }) => {
            if ((currentTick > Number(enemy.attr("lastShot")) + gameRule.enemyShootDelay) && shipStats.alive === true) {
                enemy.attr("lastShot", String(currentTick));
                const bullet = createEnemyBullet(enemy);
                enemiesBulletArray.push(bullet);
                gameTick.takeUntil(gameTick.filter(_ => bullet.attr("hit") === "true" || bullet.attr("outside") === "true")).subscribe(_ => {
                    const currentAngle = Number(bullet.attr("bulletAngle"));
                    const newX = Number(bullet.attr("cx")) + gameRule.enemyBulletSpeed * Math.sin(currentAngle * Math.PI / 180);
                    const newY = Number(bullet.attr("cy")) - gameRule.enemyBulletSpeed * Math.cos(currentAngle * Math.PI / 180);
                    bullet.attr("cx", String(newX));
                    bullet.attr("cy", String(newY));
                    if (newX <= 0 || newX >= svg.clientWidth || newY <= 0 || newY >= svg.clientHeight) {
                        bullet.attr("outside", "true");
                        bullet.elem.remove();
                    }
                });
            }
        });
    }
    const gameTick = Observable.interval(10).map(currentTick => ({ currentTick, gameRule, shipStats }));
    const keyUp = Observable.fromEvent(document, "keyup").map(e => ({ eUp: e }));
    const keyDown = Observable.fromEvent(document, "keydown").map(e => ({ eDown: e, gameRule, shipStats }));
    keyDown.filter(({ eDown }) => ((eDown.keyCode === 37) && eDown.repeat === false))
        .subscribe(({ gameRule, shipStats }) => {
        gameTick.takeUntil(keyUp.filter(({ eUp }) => eUp.keyCode === 37))
            .subscribe(_ => {
            shipStats.angle -= gameRule.rotateSpeed / gameRule.FPS;
            g.attr("transform", "translate(" + String(shipStats.x) + " " + String(shipStats.y) + ") rotate(" + String(shipStats.angle) + ")");
        });
    });
    keyDown.filter(({ eDown }) => ((eDown.keyCode === 39 && eDown.repeat === false)))
        .subscribe(({ shipStats }) => {
        gameTick.takeUntil(keyUp.filter(({ eUp }) => eUp.keyCode === 39))
            .subscribe(_ => {
            shipStats.angle += gameRule.rotateSpeed / gameRule.FPS;
            g.attr("transform", "translate(" + String(shipStats.x) + " " + String(shipStats.y) + ") rotate(" + String(shipStats.angle) + ")");
        });
    });
    keyDown.filter(({ eDown }) => ((eDown.keyCode === 38 && eDown.repeat === false)))
        .subscribe(({ gameRule, shipStats }) => {
        gameTick.takeUntil(keyUp.filter(({ eUp }) => eUp.keyCode === 38))
            .subscribe(_ => {
            shipStats.thrustX = gameRule.thrustSpeed * Math.sin(shipStats.angle * Math.PI / 180);
            shipStats.thrustY = gameRule.thrustSpeed * Math.cos(shipStats.angle * Math.PI / 180);
        });
    });
    keyDown.filter(({ eDown }) => ((eDown.keyCode === 32 && eDown.repeat === false)))
        .subscribe(({ gameRule, shipStats }) => {
        gameTick.takeUntil(keyUp.filter(({ eUp }) => eUp.keyCode === 32))
            .subscribe(({ currentTick }) => {
            if (shipStats.alive === true) {
                if (shipStats.isShooting === false) {
                    shipStats.lastShot = currentTick;
                    shipStats.isShooting = true;
                    const bullet = createBullet();
                    bulletArray.push(bullet);
                    moveBullet(bullet);
                }
                else {
                    if ((currentTick - shipStats.lastShot) >= gameRule.delayBetweenShots) {
                        shipStats.lastShot = currentTick;
                        const bullet = createBullet();
                        bulletArray.push(bullet);
                        moveBullet(bullet);
                    }
                }
            }
        });
    });
    keyUp.filter(({ eUp }) => eUp.keyCode === 32).subscribe(_ => {
        if (shipStats.isShooting === true) {
            shipStats.isShooting = false;
        }
    });
    keyDown.filter(({ eDown }) => (eDown.keyCode === 46 && eDown.repeat === false)).subscribe(_ => {
        const powerUp = spawnPowerUp();
        powerUpArray.push(powerUp);
    });
    keyDown.filter(({ eDown }) => (eDown.keyCode === 35 && eDown.repeat === false)).subscribe(_ => {
        const enemy = spawnEnemy();
        moveEnemy(enemy);
        fireEnemy(enemy);
        enemiesArray.push(enemy);
    });
    gameTick.subscribe(_ => {
        shipStats.x += shipStats.thrustX;
        shipStats.y -= shipStats.thrustY;
        shipStats.thrustX *= gameRule.frictionMultiplier;
        shipStats.thrustY *= gameRule.frictionMultiplier;
        g.attr("transform", "translate(" + String(shipStats.x) + " " + String(shipStats.y) + ") rotate(" + String(shipStats.angle) + ")");
    });
    gameTick.filter(({ shipStats }) => shipStats.x < 0)
        .subscribe(({ shipStats }) => {
        shipStats.x = svg.clientWidth;
    });
    gameTick.filter(({ shipStats }) => shipStats.x > svg.clientWidth)
        .subscribe(({ shipStats }) => {
        shipStats.x = 0;
    });
    gameTick.filter(({ shipStats }) => shipStats.y < 0)
        .subscribe(({ shipStats }) => {
        shipStats.y = svg.clientHeight;
    });
    gameTick.filter(({ shipStats }) => shipStats.y > svg.clientHeight)
        .subscribe(({ shipStats }) => {
        shipStats.y = 0;
    });
    const gameTickSubscribers = gameTick.subscribe(({ currentTick, gameRule, shipStats }) => {
        if ((currentTick % 2500 === 0) && (asteroidsArray.length < gameRule.asteroidsMaxCount) && (shipStats.alive === true)) {
            const newAsteroid = generateAsteroid();
            asteroidsArray.push(newAsteroid);
            moveAsteroid(newAsteroid);
        }
        if ((currentTick % 15000 === 0) && playerStats.gameEnd === false) {
            const powerUp = spawnPowerUp();
            powerUpArray.push(powerUp);
        }
        if ((currentTick % 10000 === 0) && playerStats.gameEnd === false) {
            const enemy = spawnEnemy();
            enemiesArray.push(enemy);
            moveEnemy(enemy);
            fireEnemy(enemy);
        }
        powerUpArray = powerUpArray.filter(function (power) {
            if (power.attr("taken") == "false") {
                return true;
            }
            else {
                return false;
            }
        });
        powerUpArray.forEach(function (powerUp) {
            if (shipCollidePowerUp(powerUp) === true && powerUp.attr("taken") === "false") {
                const powerUpType = powerUp.attr("powerType");
                powerUp.attr("taken", "true");
                if (powerUpType === "shield" && (shipPower.shield === false)) {
                    shipPower.shield = true;
                    shipPowerPickupTime.shield = currentTick;
                    const pickup = document.getElementById("powerpickup");
                    pickup.innerHTML = "POWER SHIELD";
                    Observable.interval(1500).subscribe(_ => {
                        const pickup = document.getElementById("powerpickup");
                        pickup.innerHTML = "";
                    });
                }
                else if (powerUpType === "life") {
                    playerStats.lives += 1;
                    const pickup = document.getElementById("powerpickup");
                    pickup.innerHTML = "EXTRA LIFE";
                    Observable.interval(1500).subscribe(_ => {
                        const pickup = document.getElementById("powerpickup");
                        pickup.innerHTML = "";
                    });
                }
                else if (powerUpType === "speed" && (shipPower.speed === false)) {
                    shipPower.speed = true;
                    gameRule.delayBetweenShots = gameRule.delayBetweenShots / 10;
                    shipPowerPickupTime.speed = currentTick;
                    const pickup = document.getElementById("powerpickup");
                    pickup.innerHTML = "RAPID FIRE";
                    Observable.interval(1500).subscribe(_ => {
                        const pickup = document.getElementById("powerpickup");
                        pickup.innerHTML = "";
                    });
                }
                else if (powerUpType === "laser" && shipPower.laser === false) {
                    shipPower.laser = true;
                    shipPowerPickupTime.laser = currentTick;
                    const pickup = document.getElementById("powerpickup");
                    pickup.innerHTML = "LASER SIGHT";
                    Observable.interval(1500).subscribe(_ => {
                        const pickup = document.getElementById("powerpickup");
                        pickup.innerHTML = "";
                    });
                }
                powerUp.elem.remove();
            }
        });
        if (shipPower.shield === true && shipStats.alive === true) {
            shipPowerSprite.shield.attr("stroke-width", "1");
        }
        else {
            shipPowerSprite.shield.attr("stroke-width", "0");
        }
        if (shipPower.laser === true && shipStats.alive === true) {
            shipPowerSprite.laser.attr("stroke-width", "1");
        }
        else {
            shipPowerSprite.laser.attr("stroke-width", "0");
        }
        if (shipPower.speed === true && shipStats.alive === true) {
            shipPowerSprite.speed.attr("stroke-width", "1");
        }
        else {
            shipPowerSprite.speed.attr("stroke-width", "0");
        }
        if (shipPower.shield === true && (currentTick - shipPowerPickupTime.shield === 10000)) {
            shipPower.shield = false;
            shipPowerSprite.shield.attr("stroke-width", "0");
        }
        if (shipPower.speed === true && (currentTick - shipPowerPickupTime.speed === 5000)) {
            shipPower.speed = false;
            gameRule.delayBetweenShots = gameRule.delayBetweenShots * 10;
            shipPowerSprite.speed.attr("stroke-width", "0");
        }
        if (shipPower.laser === true && (currentTick - shipPowerPickupTime.laser === 7500)) {
            shipPower.laser = false;
            shipPowerSprite.laser.attr("stroke-width", "0");
        }
        bulletArray.forEach(function (bullet) {
            asteroidsArray.forEach(function (asteroid) {
                if (bulletHit(asteroid, bullet) === true) {
                    playerStats.score += 1;
                    createExplosion(Number(asteroid.attr("cx")), Number(asteroid.attr("cy")));
                    asteroid.attr("destroyed", "true");
                    asteroid.elem.remove();
                    gameRule.asteroidsCount -= 1;
                    bullet.attr("hit", "true");
                    bullet.elem.remove();
                    breakAsteroid(asteroid);
                    if (playerStats.score === playerStats.level * 20 && shipStats.alive === true) {
                        playerStats.level += 1;
                        gameRule.asteroidsMaxSpeed *= 1.5;
                        gameRule.asteroidsMaxSize += 1;
                        gameRule.asteroidsMaxCount += 2;
                    }
                }
            });
        });
        enemiesBulletArray.forEach(bullet => {
            if (enemyBulletHit(bullet) === true) {
                if (shipPower.shield === true) {
                    shipPower.shield = false;
                    createExplosion(shipStats.x, shipStats.y);
                    bullet.attr("hit", "true");
                    bullet.elem.remove();
                }
                else {
                    bullet.attr("hit", "true");
                    bullet.elem.remove();
                    createExplosion(shipStats.x, shipStats.y, 1000, 800);
                    shipStats.x = 900;
                    shipStats.y = 900;
                    shipStats.alive = false;
                    playerStats.lives -= 1;
                    ship.attr("style", "fill:none;stroke:white; stroke-width:0");
                    shipStats.invulnerable = true;
                }
            }
        });
        bulletArray.forEach(function (bullet) {
            enemiesArray.forEach(function (enemy) {
                if (bulletHitEnemy(enemy, bullet) === true) {
                    playerStats.score += 1;
                    createExplosion(Number(enemy.attr("x")), Number(enemy.attr("y")));
                    enemy.attr("dead", "true");
                    enemy.elem.remove();
                    bullet.attr("hit", "true");
                    bullet.elem.remove();
                    if (playerStats.score === playerStats.level * 20 && shipStats.alive === true) {
                        playerStats.level += 1;
                        gameRule.asteroidsMaxSpeed *= 1.5;
                        gameRule.asteroidsMaxSize += 1;
                        gameRule.asteroidsMaxCount += 2;
                    }
                }
            });
        });
        bulletArray = bulletArray.filter(function (bullet) {
            if (bullet.attr("hit") === "false" && bullet.attr("outside") === "false") {
                return true;
            }
            else {
                return false;
            }
        });
        enemiesBulletArray = enemiesBulletArray.filter(function (bullet) {
            if (bullet.attr("hit") === "false" && bullet.attr("outside") === "false") {
                return true;
            }
            else {
                return false;
            }
        });
        asteroidsArray = asteroidsArray.filter(function (asteroid) {
            if (asteroid.attr("destroyed") === "false") {
                return true;
            }
            else {
                return false;
            }
        });
        asteroidsArray.forEach(asteroid => {
            if (shipStats.invulnerable === false) {
                if (shipNotCollide(asteroid) === false && shipStats.alive === true) {
                    if (shipPower.shield === true) {
                        shipPower.shield = false;
                        asteroid.attr("destroyed", "true");
                        asteroid.elem.remove();
                        gameRule.asteroidsCount -= 1;
                        createExplosion(Number(asteroid.attr("cx")), Number(asteroid.attr("cy")));
                        breakAsteroid(asteroid);
                    }
                    else {
                        createExplosion(shipStats.x, shipStats.y, 1000, 800);
                        shipStats.x = 900;
                        shipStats.y = 900;
                        shipStats.invulnerable = true;
                        shipStats.alive = false;
                        playerStats.lives -= 1;
                        ship.attr("style", "fill:none;stroke:white; stroke-width:0");
                    }
                }
            }
        });
        enemiesArray.forEach(enemy => {
            if (Number(enemy.attr("x")) <= shipStats.x && shipStats.x <= Number(enemy.attr("x")) + Number(enemy.attr("width"))
                && Number(enemy.attr("y")) <= shipStats.y && shipStats.y <= Number(enemy.attr("y")) + Number(enemy.attr("height"))) {
                if (shipPower.shield === true) {
                    shipPower.shield = false;
                    createExplosion(Number(enemy.attr("x")), Number(enemy.attr("y")));
                    enemy.attr("dead", "true");
                    enemy.elem.remove();
                }
                else {
                    createExplosion(shipStats.x, shipStats.y, 1000, 800);
                    shipStats.x = 900;
                    shipStats.y = 900;
                    shipStats.invulnerable = true;
                    shipStats.alive = false;
                    playerStats.lives -= 1;
                    ship.attr("style", "fill:none;stroke:white; stroke-width:0");
                }
            }
        });
        enemiesArray = enemiesArray.filter(function (enemy) {
            return (enemy.attr("dead") === "false");
        });
        if (playerStats.lives <= 0 && shipStats.alive === false) {
            bulletArray.forEach(bullet => { bullet.elem.remove(); bullet.attr("hit", "true"); });
            bulletArray.length = 0;
            asteroidsArray.forEach(asteroid => { asteroid.attr("destroyed", "true"); asteroid.elem.remove(); });
            asteroidsArray.length = 0;
            powerUpArray.forEach(powerUp => { powerUp.attr("taken", "true"); powerUp.elem.remove(); });
            powerUpArray.length = 0;
            enemiesArray.forEach(enemy => { enemy.attr("dead", "true"); enemy.elem.remove(); });
            enemiesArray.length = 0;
            enemiesBulletArray.forEach(bullet => { bullet.elem.remove(); bullet.attr("hit", "true"); });
            enemiesBulletArray.length = 0;
            playerStats.gameEnd = true;
        }
        else if (playerStats.lives > 0 && shipStats.alive === false) {
            Observable.interval(2000).takeUntil(gameTick.filter(_ => shipStats.alive === true)).subscribe(_ => {
                shipStats.x = originX;
                shipStats.y = originY;
                shipStats.thrustX = 0;
                shipStats.thrustY = 0;
                shipStats.angle = 0;
                ship.attr("style", "fill:none;stroke:white; stroke-width:1");
                shipStats.invulnerable = false;
                shipStats.alive = true;
            });
        }
        const score = document.getElementById("score");
        score.innerHTML = "Score: " + String(playerStats.score);
        const lives = document.getElementById("lives");
        lives.innerHTML = "Lives: " + String(playerStats.lives);
        const level = document.getElementById("level");
        level.innerHTML = "Level " + String(playerStats.level);
        if (playerStats.gameEnd === true) {
            const lives = document.getElementById("gameover");
            lives.innerHTML = "Game Over";
        }
    });
    const settingsSvg = document.getElementById("settings");
    const settingsRect = settingsSvg.getBoundingClientRect();
    function createSlider(yOffset) {
        const sliderBar = new Elem(settingsSvg, 'rect')
            .attr('x', 20).attr('y', yOffset)
            .attr('width', 300).attr('height', 20)
            .attr('fill', 'rgb(41, 41, 36)')
            .attr('stroke', 'white').attr('stroke-width', '1');
        const sliderButton = new Elem(settingsSvg, 'rect')
            .attr('x', 20).attr('y', yOffset)
            .attr('width', 30).attr('height', 20)
            .attr('fill', 'white')
            .attr('stroke', 'white').attr('stroke-width', '1');
        const mousemoveSlider = Observable.fromEvent(sliderBar.elem, 'mousemove');
        const mouseupSlider = Observable.fromEvent(settingsSvg, 'mouseup');
        sliderButton.observe('mousedown')
            .map(({ clientX }) => ({ xOffset: Number(sliderButton.attr('x')) - (clientX) }))
            .flatMap(({ xOffset }) => mousemoveSlider
            .takeUntil(mousemoveSlider.filter(({ clientX }) => (clientX - xOffset < settingsRect.left) || (clientX + xOffset > settingsRect.left + 320))).takeUntil(mouseupSlider)
            .map(({ clientX }) => ({ x: clientX + xOffset })))
            .subscribe(({ x }) => sliderButton.attr('x', x));
        return { sliderBar, sliderButton };
    }
    function getNewRuleIncrement(oldRule, button, slider, maxMult) {
        const newRule = oldRule + oldRule * maxMult * ((Number(button.attr('x')) - Number(slider.attr('x'))) /
            (Number(slider.attr('width')) - Number(button.attr('width'))));
        return newRule;
    }
    function getNewRuleDecrement(oldRule, button, slider, maxMult) {
        const newRule = oldRule - oldRule * maxMult * ((Number(button.attr('x')) - Number(slider.attr('x'))) /
            (Number(slider.attr('width')) - Number(button.attr('width'))));
        return newRule;
    }
    const slidersArray = [createSlider(20), createSlider(60), createSlider(100), createSlider(140), createSlider(180), createSlider(220), createSlider(260), createSlider(300),
        createSlider(340), createSlider(380), createSlider(420)];
    gameTick.subscribe(_ => {
        gameRule.thrustSpeed = getNewRuleIncrement(gameRuleDefault.thrustSpeed, slidersArray[0].sliderButton, slidersArray[0].sliderBar, 10);
        const thrustSpeed = document.getElementById("thrustspeed");
        thrustSpeed.innerHTML = "Thrust Speed:&emsp;" + String(Math.floor(gameRule.thrustSpeed)) + " px/s";
        gameRule.bulletSpeed = getNewRuleIncrement(gameRuleDefault.bulletSpeed, slidersArray[1].sliderButton, slidersArray[1].sliderBar, 10);
        const bulletSpeed = document.getElementById("bulletspeed");
        bulletSpeed.innerHTML = "Bullet Speed:&emsp;" + String(Math.floor(gameRule.bulletSpeed)) + " px/s";
        if (shipPower.speed === false) {
            gameRule.delayBetweenShots = getNewRuleDecrement(gameRuleDefault.delayBetweenShots, slidersArray[2].sliderButton, slidersArray[2].sliderBar, 0.9);
            const delayBetweenShots = document.getElementById("firingspeed");
            delayBetweenShots.innerHTML = "Firing Speed:&emsp;" + String(Math.floor(1000 / gameRule.delayBetweenShots)) + " shot/s";
        }
        gameRule.asteroidsMaxCount = getNewRuleIncrement(gameRuleDefault.asteroidsMaxCount, slidersArray[3].sliderButton, slidersArray[3].sliderBar, 10);
        const asteroidsMaxCount = document.getElementById("asteroidsmaxcount");
        asteroidsMaxCount.innerHTML = "Max Asteroids:&emsp;" + String(Math.floor(gameRule.asteroidsMaxCount)) + " asteroids";
        gameRule.asteroidsMaxSize = getNewRuleIncrement(gameRuleDefault.asteroidsMaxSize, slidersArray[4].sliderButton, slidersArray[4].sliderBar, 10);
        const asteroidsMaxSize = document.getElementById("asteroidsmaxsize");
        asteroidsMaxSize.innerHTML = "Max Asteroids Size:&emsp;" + String(Math.floor(gameRule.asteroidsMaxSize)) + " px";
        gameRule.asteroidsMaxSpeed = getNewRuleIncrement(gameRuleDefault.asteroidsMaxSpeed, slidersArray[5].sliderButton, slidersArray[5].sliderBar, 10);
        const asteroidsMaxSpeed = document.getElementById("asteroidsmaxspeed");
        asteroidsMaxSpeed.innerHTML = "Max Asteroids Speed:&emsp;" + String(Math.floor(gameRule.asteroidsMaxSpeed)) + " px/s";
        gameRule.frictionMultiplier = getNewRuleDecrement(gameRuleDefault.frictionMultiplier, slidersArray[6].sliderButton, slidersArray[6].sliderBar, 0.9);
        const frictionMultiplier = document.getElementById("frictionmultiplier");
        frictionMultiplier.innerHTML = "Friction:&emsp;-" + String(100 - Math.floor(gameRule.frictionMultiplier * 100)) + " %/s/s";
        gameRule.rotateSpeed = getNewRuleIncrement(gameRuleDefault.rotateSpeed, slidersArray[7].sliderButton, slidersArray[7].sliderBar, 4);
        const rotateSpeed = document.getElementById("rotatespeed");
        rotateSpeed.innerHTML = "Rotate Speed:&emsp;" + String(Math.floor(gameRule.rotateSpeed)) + " degree/s";
        gameRule.enemyMoveSpeed = getNewRuleIncrement(gameRuleDefault.enemyMoveSpeed, slidersArray[8].sliderButton, slidersArray[8].sliderBar, 10);
        const enemyMoveSpeed = document.getElementById("enemymovespeed");
        enemyMoveSpeed.innerHTML = "Enemy Speed:&emsp;" + String(gameRule.enemyMoveSpeed.toFixed(1)) + " px/s";
        gameRule.enemyShootDelay = getNewRuleDecrement(gameRuleDefault.enemyShootDelay, slidersArray[9].sliderButton, slidersArray[9].sliderBar, 0.9);
        const enemyShootDelay = document.getElementById("enemyshootdelay");
        enemyShootDelay.innerHTML = "Enemy Firing Speed:&emsp;" + String((1000 / gameRule.enemyShootDelay).toFixed(1)) + " shot/s";
        gameRule.enemyBulletSpeed = getNewRuleIncrement(gameRuleDefault.enemyBulletSpeed, slidersArray[10].sliderButton, slidersArray[10].sliderBar, 10);
        const enemyBulletSpeed = document.getElementById("enemybulletspeed");
        enemyBulletSpeed.innerHTML = "Enemy Bullet Speed:&emsp;" + String(Math.floor(gameRule.enemyBulletSpeed)) + " px/s";
    });
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map