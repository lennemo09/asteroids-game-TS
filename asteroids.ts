function asteroids() {


  const svg = document.getElementById("canvas")!;
  const svgRect = svg.getBoundingClientRect();

  ///// GAME RULE AND ASSETS:

  // Game rule constants
  // Default Settings
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
    explosionSize : 15,
    explosionTime: 400,
    delayBetweenShots: 500,
    enemyMoveSpeed: 0.5,
    enemyShootDelay: 1500,
    enemyBulletSpeed: 1
  };

  // Dynamic settings
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
    explosionSize : 15,
    explosionTime: 400,
    delayBetweenShots: 500,
    enemyMoveSpeed: 0.5,
    enemyShootDelay: 1500,
    enemyBulletSpeed: 1
  };

  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  const originX = svg.clientWidth / 2;
  const originY = svg.clientHeight / 2;

  let g = new Elem(svg,'g') // Marks center of ship (Ship(0,0) will be the current position of g)
    .attr("transform","translate(" + String(originX) + " " + String(originY) +") rotate(0)")

  // Stores current stats of player
  const playerStats = {
    score: 0,
    lives: 3,
    level: 1,
    gameEnd: false
  };

  // Stores current available types of power ups
  const powerUpNames : String[] = [
    "shield",
    "life",
    "speed",
    "laser"
  ];

  // Stores current state of ship
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

  // Stores states of active power ups on ship
  const shipPower = {
    shield: false,
    speed: false,
    laser: false
  };

  // Stores time when the ship picked up the previous power up of the same type (for cooldown and timer purposes)
  const shipPowerPickupTime = {
    shield: 0,
    speed: 0,
    laser: 0
  };

  // Stores the sprites of the power ups, which are just spires sharing the same parent as the ship being made invisible until power up is active
  const shipPowerSprite = {
    shield: new Elem(svg, 'circle', g.elem)
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 55)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", "0")
    .attr("stroke-dasharray", "8")
    .attr("stroke-linejoin","bevel"),
    laser: new Elem(svg, 'line', g.elem)
    .attr("x1", -35*Math.sin(shipStats.angle*Math.PI/180))
    .attr("y1", -35*Math.cos(shipStats.angle*Math.PI/180))
    .attr("x2", -600*Math.sin(shipStats.angle*Math.PI/180))
    .attr("y2", -600*Math.cos(shipStats.angle*Math.PI/180))
    .attr("stroke", "white")
    .attr("stroke-width", "0")
    .attr("stroke-dasharray", "20 50")
    .attr("stroke-linejoin","bevel"),
    speed: new Elem(svg, 'circle', g.elem)
    .attr("cx", 0)
    .attr("cy", 5*Math.cos(shipStats.angle*Math.PI/180))
    .attr("r", 5)
    .attr("fill","none")
    .attr("stroke","white")
    .attr("stroke-width","1")
  };


  // Stores current sprites on screen
  let asteroidsArray : Elem[]= [];
  let bulletArray : Elem[] = [];
  let powerUpArray : Elem[] = [];
  let enemiesArray: Elem[] = [];
  let enemiesBulletArray : Elem[] = [];

  // create a polygon shape for the space ship as a child of the transform group
  let ship = new Elem(svg, 'polygon', g.elem)
    .attr("points","-15,20 15,20 0,-20")
    .attr("style","fill:none;stroke:white; stroke-width:1")


  //// END OF GAME RULES AND ASSETS


  //// SUPPORTING FUNCTIONS:

  function randInt(x: number, y: number): number {
    // Random generator inspired by pong's helper.ts
    // This is not a pure function because it does not return the same result everytime with the same x and y
    return Math.floor(Math.random() * (Math.abs(x - y) + 1)) + x;
  }


  /// This function generates an asteroid with given coordinate and max size, if none are given they are randomly generated.
  function generateAsteroid(
    asteroidsMaxSize: number = randInt(1, gameRule.asteroidsMaxSize),
    asteroidNewX: number = randInt(0,svg.clientWidth),
    asteroidNewY: number = randInt(0, svg.clientHeight)): Elem {

    // This function is also not a pure function due to the need of random generation.

    let asteroidX = asteroidNewX + randInt(-20,20);
    let asteroidY = asteroidNewY + randInt(-20,20);
    const asteroidSize = 10*asteroidsMaxSize;
    const asteroidSpeedX = randInt(-(gameRule.asteroidsMaxSpeed), gameRule.asteroidsMaxSpeed)/10;
    const asteroidSpeedY = randInt(-(gameRule.asteroidsMaxSpeed), gameRule.asteroidsMaxSpeed)/10;

    // This helps but doesn't completely solve the problem of an asteroid spawning on the ship
    if (asteroidX === shipStats.x && asteroidY === shipStats.y) {
      asteroidX += randInt(10,10)
      asteroidY += randInt(10,10)
    }

    // Asteroid sprite
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

    // This is also a side effect as it increments the global counter inside the function
    gameRule.asteroidsCount += 1;

    return asteroidElem
  }

  function moveAsteroid(asteroid:Elem) {
    gameTick.takeUntil(gameTick.filter(_ => asteroid.attr("destroyed") === "true")).subscribe(() => {
      // This function moves the asteroid every gametick until it is destroyed

      // Moves Asteroid with constant speed
      asteroid.attr("cx", Number(asteroid.attr("cx")) + Number(asteroid.attr("xSpeed")))
      asteroid.attr("cy", Number(asteroid.attr("cy")) - Number(asteroid.attr("ySpeed")))


      if (Number(asteroid.attr("cx")) < 0) {
        asteroid.attr("cx", svg.clientWidth)
      } else if (Number(asteroid.attr("cx")) > svg.clientWidth) {
        asteroid.attr("cx", 0)
      }

      if (Number(asteroid.attr("cy")) < 0) {
        asteroid.attr("cy", svg.clientHeight)
      } else if (Number(asteroid.attr("cy")) > svg.clientHeight) {
        asteroid.attr("cy", 0)
      }
    })
  }

  function createBullet(): Elem {
    // This function simply calculates and create a bullet at the appropriate location with the appropriate angle
    const bullet = new Elem(svg, 'rect')
            .attr('x', shipStats.x + 20*Math.sin(shipStats.angle*Math.PI/180))
            .attr('y', shipStats.y - 20*Math.cos(shipStats.angle*Math.PI/180))
            .attr('width', 2).attr('height', 2)
            .attr('fill', 'none')
            .attr("stroke", "white")
            .attr("stroke-width", "1")
            .attr("hit", "false")
            .attr("outside", "false")
            .attr("bulletAngle", String(shipStats.angle));
    return bullet
  }

  function moveBullet(bullet:Elem) {
    gameTick.takeUntil(gameTick.filter(_ => bullet.attr("hit") === "true" || bullet.attr("outside") === "true"))
    .subscribe(() => {
      // This fucntion moves the bullet until it hit something or went out of bounds
      const currentAngle = Number(bullet.attr("bulletAngle"));
      const newX = Number(bullet.attr("x")) + gameRule.bulletSpeed*Math.sin(currentAngle*Math.PI/180);
      const newY = Number(bullet.attr("y")) - gameRule.bulletSpeed*Math.cos(currentAngle*Math.PI/180);
      bullet.attr("x",String(newX));
      bullet.attr("y",String(newY));

      // Out of bound checking
      if (newX <= 0 || newX >= svg.clientWidth || newY <= 0 || newY >= svg.clientHeight) {
        bullet.attr("outside","true");
        bullet.elem.remove();
      }
    })
  }

  function bulletHit(asteroid:Elem, bullet:Elem) {
    // This function checks if the bullet has hit an asteroid
    if (Math.abs((Number(bullet.attr("x"))) - (Number(asteroid.attr("cx")))) < Number(asteroid.attr("r"))
        && Math.abs((Number(bullet.attr("y"))) - (Number(asteroid.attr("cy") ))) < Number(asteroid.attr("r"))) {
      return true
    } else {
      return false
    }
  }

  function bulletHitEnemy(enemy:Elem, bullet:Elem) {
    // This function checks if the bullet has hit an enemy

    //  Enemy collision detection is basically checking if the bullet is in range x:[enemy.x, enemy.x + enemy.width], y:[enemy.y, enemy.y + enemy.height]
    if (Number(enemy.attr("x")) <= Number(bullet.attr("x")) && Number(bullet.attr("x")) <= Number(enemy.attr("x")) + Number(enemy.attr("width"))
    && Number(enemy.attr("y")) <= Number(bullet.attr("y")) && Number(bullet.attr("y")) <= Number(enemy.attr("y")) + Number(enemy.attr("height"))
    ) {
      return true
    } else {
      return false
    }
  }

  function enemyBulletHit(bullet:Elem) {
    // This function checks if an enemy bullet has hit the player
    if (Math.abs((Number(bullet.attr("cx"))) - shipStats.x) < 15
        && Math.abs((Number(bullet.attr("cy"))) - shipStats.y) < 15) {
      return true
    } else {
      return false
    }
  }

  function breakAsteroid(asteroid: Elem) {
    // This function triggered when an asteroid has been destroyed, generates smaller asteroids accordingly

    // This function is impure because it pushes items on to the global array
    if (Number(asteroid.attr("r")) <= 10) {
      return
    } else {
      const newAsteroid1 = generateAsteroid(Math.floor((Number(asteroid.attr("r"))/10)/2), Number(asteroid.attr("cx")), Number(asteroid.attr("cy")));
      const newAsteroid2 = generateAsteroid(Math.floor((Number(asteroid.attr("r"))/10)/2), Number(asteroid.attr("cx")), Number(asteroid.attr("cy")));
      asteroidsArray.push(newAsteroid1);    // This is a side effect
      moveAsteroid(newAsteroid1);
      asteroidsArray.push(newAsteroid2);    // This is a side effect
      moveAsteroid(newAsteroid2);
    }
  }

  function shipNotCollide(asteroid:Elem) {
    // This function checks if ship has collided with an asteroid
    if (Math.abs((shipStats.x) - (Number(asteroid.attr("cx")))) < Number(asteroid.attr("r"))
    && Math.abs((shipStats.y) - (Number(asteroid.attr("cy") ))) < Number(asteroid.attr("r"))) {
      return false
    } else {
      return true
    }
  }

  function shipCollidePowerUp(powerUp:Elem) {
    // This function checks if ship has collided with a power up sprite
    if (Math.abs((shipStats.x) - (Number(powerUp.attr("cx")))) < Number(powerUp.attr("r"))
    && Math.abs((shipStats.y) - (Number(powerUp.attr("cy") ))) < Number(powerUp.attr("r"))) {
      return true
    } else {
      return false
    }
  }

  // Generates an explosion sprite for 250ms
  function createExplosion(x:number,y:number, explosionSize: number = gameRule.explosionSize, explosionTime: number = gameRule.explosionTime) {
    const explosion = new Elem(svg, 'circle')
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", explosionSize/(explosionTime/10))
    .attr("fill", "white")
    .attr("stroke", "white")
    .attr("stroke-width", "1")
    .attr("finished", "false");

    // This animates the explosion until time out
    Observable.interval(10).takeUntil(Observable.interval(explosionTime)).subscribe(_=>{
      explosion.attr("r", String(Number(explosion.attr("r")) + gameRule.explosionSize/(explosionTime/10)));
    });
    Observable.interval(explosionTime).subscribe(_=>{
      explosion.elem.remove();
    });
  }

  function spawnPowerUp(): Elem {
    // This function creates a powerup sprite

    // This function is also not a pure function because it relies on random generation of location and power up type
    const powerUpType = powerUpNames[randInt(0, powerUpNames.length-1)] ;
    const x = randInt(0, svg.clientWidth);
    const y = randInt(0, svg.clientHeight);
    const powerUp = new Elem(svg, 'circle')
      .attr("powerType", String(powerUpType))
      .attr('cx', x)    .attr('cy', y)
      .attr("r", 20)
      .attr('fill', 'none')
      .attr("stroke", "white")
      .attr("stroke-width", "1")
      .attr("stroke-dasharray", "8")
      .attr("stroke-linejoin","bevel")
      .attr("taken","false")

    return powerUp
  }

  function spawnEnemy(): Elem {
    // This function spawns an enemy at a random location therefore it is also impure
    const enemy = new Elem(svg, 'rect')
      .attr('x', randInt(0,svg.clientWidth))
      .attr('y', randInt(0,svg.clientHeight-25))
      .attr('width', 30).attr('height', 25)
      .attr('fill', 'none')
      .attr("stroke", "white")
      .attr("stroke-width", "1")
      .attr("dead", "false")
      .attr("lastShot", "0")

    return enemy
  }

  function moveEnemy(enemy: Elem) {
    // This function simply moves the enemy and wrap them around the torus topology
    gameTick.takeUntil(gameTick.filter(_ => enemy.attr("dead") === "true")).subscribe(() => {
      enemy.attr("x", Number(enemy.attr("x")) + gameRule.enemyMoveSpeed)

      if (Number(enemy.attr("x")) < 0 - Number(enemy.attr("width"))) {
        enemy.attr("x", svg.clientWidth)
      } else if (Number(enemy.attr("x")) > svg.clientWidth) {
        enemy.attr("x", 0 - Number(enemy.attr("width")))
      }

      if (Number(enemy.attr("y")) < 0 + Number(enemy.attr("height"))) {
        enemy.attr("y", svg.clientHeight-25)
      } else if (Number(enemy.attr("y")) > svg.clientHeight) {
        enemy.attr("y", 0 - Number(enemy.attr("height")))
      }
    })
  }

  function getEnemyBulletAngle(enemy: Elem): number {
    // This function uses trigonometry to make enemy aim and shoot at the player
    const x = Number(enemy.attr("x")) + (Number(enemy.attr("width")))/2
    const y = Number(enemy.attr("y")) + (Number(enemy.attr("height")))/2

    const dy = shipStats.y - y;
    const dx =  shipStats.x - x;

    const atan = ((Math.atan2(dy, dx))*180/Math.PI) + 90; // Range(-PI,PI]
      // Convert to degrees (-180, 180]
      // Fix the origin axis to the Y (up) axis

      if (atan < 0) {
        return (atan + 360); // Expand range to [0, 360)
      } else {
        return atan;
      }
    }

  function createEnemyBullet(enemy: Elem): Elem {
    // This function just creates a bullet sprite on given enemy
    const bullet = new Elem(svg, 'circle')
      .attr('cx', Number(enemy.attr("x")) + (Number(enemy.attr("width")))/2 )
      .attr('cy', Number(enemy.attr("y")) + (Number(enemy.attr("height")))/2)
      .attr('r', 4)
      .attr('fill', 'white')
      .attr("stroke", "white")
      .attr("stroke-width", "1")
      .attr("hit", "false")
      .attr("outside", "false")
      .attr("bulletAngle", String(getEnemyBulletAngle(enemy)));
    return bullet
  }

  function fireEnemy(enemy: Elem) {
    // This function makes the enemy fire at the player until it is dead
    gameTick.takeUntil(gameTick.filter(_ => enemy.attr("dead") === "true")).subscribe(({currentTick}) => {

      // This checks if the enemy has fired recently until it surpasses the shoot delay, enemy won't shoot if player is dead
      // (I noticed that they immediately shoot at the player even before the ship respawns which was pretty unfair)
      if ((currentTick > Number(enemy.attr("lastShot")) + gameRule.enemyShootDelay) && shipStats.alive === true) {
        enemy.attr("lastShot",String(currentTick))
        const bullet = createEnemyBullet(enemy)

        // This is not pure, it pushes the bullet sprite to a global array
        enemiesBulletArray.push(bullet) // Side effect

        // This checks if the bullet has either hit the player or went out of bounds
        gameTick.takeUntil(gameTick.filter(_ => bullet.attr("hit") === "true" || bullet.attr("outside") === "true")).subscribe(_=>{
          const currentAngle = Number(bullet.attr("bulletAngle"));
          const newX = Number(bullet.attr("cx")) + gameRule.enemyBulletSpeed*Math.sin(currentAngle*Math.PI/180);
          const newY = Number(bullet.attr("cy")) - gameRule.enemyBulletSpeed*Math.cos(currentAngle*Math.PI/180);
          bullet.attr("cx",String(newX));
          bullet.attr("cy",String(newY));

          if (newX <= 0 || newX >= svg.clientWidth || newY <= 0 || newY >= svg.clientHeight) {
            bullet.attr("outside","true");
            bullet.elem.remove();
          }
        })
      }
    })
  }

  //// END OF SUPPORTING FUNCTIONS


  //// GAME LOGIC:

  // Game tick
  const gameTick = Observable.interval(10).map(currentTick=>({currentTick, gameRule, shipStats}));


  // Move ship: Ignore key repeats, only fire when first keydown until keyup. keyboardEvent.repeat === false
  // At first keydown, create interval until keyup. keydown.subscribe(gametick.takeuntil(keyup))
  // e.keyCode === 37: left, 38: up, 39: right
  const keyUp = Observable.fromEvent<KeyboardEvent>(document, "keyup").map(e => ({eUp: e}))
  const keyDown = Observable.fromEvent<KeyboardEvent>(document, "keydown").map(e => ({eDown: e, gameRule, shipStats}));

  // Rotate CCW
  keyDown.filter(({eDown}) => ((eDown.keyCode === 37) && eDown.repeat === false))
  .subscribe(({gameRule, shipStats}) => {
    gameTick.takeUntil(keyUp.filter(({eUp}) => eUp.keyCode === 37))
    .subscribe(_ => {
      shipStats.angle -= gameRule.rotateSpeed/gameRule.FPS
      g.attr("transform","translate("+String(shipStats.x)+" "+String(shipStats.y)+") rotate("+String(shipStats.angle)+")")
    })
  })

  // Rotate CW
  keyDown.filter(({eDown}) => ((eDown.keyCode === 39 && eDown.repeat === false)))
  .subscribe(({shipStats}) => {
    gameTick.takeUntil(keyUp.filter(({eUp}) => eUp.keyCode === 39))
    .subscribe(_ => {
      shipStats.angle += gameRule.rotateSpeed/gameRule.FPS
      g.attr("transform","translate("+String(shipStats.x)+" "+String(shipStats.y)+") rotate("+String(shipStats.angle)+")")
    })
  })

  // Thrust forward
  keyDown.filter(({eDown}) => ((eDown.keyCode === 38 && eDown.repeat === false)))
  .subscribe(({gameRule, shipStats}) => {
    gameTick.takeUntil(keyUp.filter(({eUp}) => eUp.keyCode === 38))
    .subscribe(_ => {
      shipStats.thrustX = gameRule.thrustSpeed*Math.sin(shipStats.angle*Math.PI/180)
      shipStats.thrustY = gameRule.thrustSpeed*Math.cos(shipStats.angle*Math.PI/180)

    })
  })

  // Shoot
  keyDown.filter(({eDown}) => ((eDown.keyCode === 32 && eDown.repeat === false)))
  .subscribe(({gameRule, shipStats}) => {
    gameTick.takeUntil(keyUp.filter(({eUp}) => eUp.keyCode === 32))
    .subscribe(({currentTick}) => {
      if (shipStats.alive === true ){
        if (shipStats.isShooting === false) { // Check if the player is already shooting (for repeated keypresses)
        shipStats.lastShot = currentTick;
        shipStats.isShooting = true

        const bullet = createBullet();
        bulletArray.push(bullet);
        moveBullet(bullet);
      } else {
        // Handles bullet spray (much like enemy shgot delay mechanic)
        if ((currentTick - shipStats.lastShot) >= gameRule.delayBetweenShots) {
          shipStats.lastShot = currentTick;
          const bullet = createBullet();
          bulletArray.push(bullet);
          moveBullet(bullet);
        }
      }}
    })
  })

  // Reset bullet spray checker
  keyUp.filter(({eUp}) => eUp.keyCode === 32).subscribe(_=>{
    if (shipStats.isShooting === true) {
      shipStats.isShooting = false
    }
  })

  //// CHEATS/DEVELOPER_SHORTCUTS (For debugging purposes)
  // Spawn power up (Delete Key)
  keyDown.filter(({eDown}) => (eDown.keyCode === 46 && eDown.repeat === false)).subscribe(_=>{
    const powerUp = spawnPowerUp()
    powerUpArray.push(powerUp)
  })
  // Spawn enemy (End Key)
  keyDown.filter(({eDown}) => (eDown.keyCode === 35 && eDown.repeat === false)).subscribe(_=>{
    const enemy = spawnEnemy()
    moveEnemy(enemy)
    fireEnemy(enemy)
    enemiesArray.push(enemy)
  })


  // Current ship coordinate (and the transform group) is originated at canvas top-left, which (0,0) is actually (svgRect.left, svgRect.top).
  // To do comparision, 2 coordinates must share origin, with global absolute coordinate (0,0) at top left of HTML page or top left of svg canvas
  // Or center of canvas.

  // Accelarate thruster
  gameTick.subscribe(_=>{
    shipStats.x += shipStats.thrustX
    shipStats.y -= shipStats.thrustY
    shipStats.thrustX *= gameRule.frictionMultiplier
    shipStats.thrustY *= gameRule.frictionMultiplier
    g.attr("transform","translate("+String(shipStats.x)+" "+String(shipStats.y)+") rotate("+String(shipStats.angle)+")")
  })


  /// Apply Torus Topology
  gameTick.filter(({shipStats}) => shipStats.x < 0)
  .subscribe(({shipStats}) => {
    shipStats.x = svg.clientWidth
  })

  gameTick.filter(({shipStats}) => shipStats.x > svg.clientWidth)
  .subscribe(({shipStats}) => {
    shipStats.x = 0
  })

  gameTick.filter(({shipStats}) => shipStats.y < 0)
  .subscribe(({shipStats}) => {
    shipStats.y = svg.clientHeight
  })

  gameTick.filter(({shipStats}) => shipStats.y > svg.clientHeight)
  .subscribe(({shipStats}) => {
    shipStats.y = 0
  })


  // Merge all mechanics that subscribes to game tick into one observer
  const gameTickSubscribers = gameTick.subscribe(({currentTick, gameRule, shipStats})=>{
    // Spawn a new asteroid every 2.5 seconds
    if ((currentTick % 2500 === 0) && (asteroidsArray.length < gameRule.asteroidsMaxCount) && (shipStats.alive === true))  {
      const newAsteroid = generateAsteroid();
      asteroidsArray.push(newAsteroid);
      moveAsteroid(newAsteroid);
    }

    // Spawn a new power up every 15 seconds
    if ((currentTick % 15000 === 0) && playerStats.gameEnd === false)  {
      const powerUp = spawnPowerUp()
      powerUpArray.push(powerUp)
    }

    // Spawn a new enemy every 10 seconds
    if ((currentTick % 10000 === 0) && playerStats.gameEnd === false)  {
      const enemy = spawnEnemy()
      enemiesArray.push(enemy)
      moveEnemy(enemy)
      fireEnemy(enemy)

    }

    // Clear the taken power up off of the array
    powerUpArray = powerUpArray.filter(function(power) {
      if (power.attr("taken") == "false") {
        return true
      } else {
        return false
      }
    })

    // Check if player touches the power up (multiple instances of the same power up do not stack)
    powerUpArray.forEach(function(powerUp) {
      if (shipCollidePowerUp(powerUp) === true && powerUp.attr("taken") === "false") {
        const powerUpType = powerUp.attr("powerType");
        powerUp.attr("taken","true")

        if (powerUpType === "shield" && (shipPower.shield === false)) {
          shipPower.shield = true;
          shipPowerPickupTime.shield = currentTick;
          // Power pick up text appears for 1.5s
          const pickup: HTMLElement = document.getElementById("powerpickup")!;
          pickup.innerHTML = "POWER SHIELD"
          Observable.interval(1500).subscribe(_=>{
            const pickup: HTMLElement = document.getElementById("powerpickup")!;
            pickup.innerHTML = ""
          })

        } else if (powerUpType === "life") {
          playerStats.lives += 1
          const pickup: HTMLElement = document.getElementById("powerpickup")!;
          pickup.innerHTML = "EXTRA LIFE"
          // Power pick up text appears for 1.5s
          Observable.interval(1500).subscribe(_=>{
            const pickup: HTMLElement = document.getElementById("powerpickup")!;
            pickup.innerHTML = ""
          })

        } else if (powerUpType === "speed" && (shipPower.speed === false)) {
          shipPower.speed = true
          gameRule.delayBetweenShots = gameRule.delayBetweenShots/10
          shipPowerPickupTime.speed = currentTick;
          const pickup: HTMLElement = document.getElementById("powerpickup")!;
          pickup.innerHTML = "RAPID FIRE"
          // Power pick up text appears for 1.5s
          Observable.interval(1500).subscribe(_=>{
            const pickup: HTMLElement = document.getElementById("powerpickup")!;
            pickup.innerHTML = ""
          })

        } else if (powerUpType === "laser" && shipPower.laser === false) {
          shipPower.laser = true
          shipPowerPickupTime.laser = currentTick;
          const pickup: HTMLElement = document.getElementById("powerpickup")!;
          pickup.innerHTML = "LASER SIGHT"
          // Power pick up text appears for 1.5s
          Observable.interval(1500).subscribe(_=>{
            const pickup: HTMLElement = document.getElementById("powerpickup")!;
            pickup.innerHTML = ""
          })
        }
        // Picked up, remove the sprite from screen
        powerUp.elem.remove()
      }
    })

    // Power up sprite render (checks if power up status is true and the player is alive), else make the sprite invisible
    if (shipPower.shield === true && shipStats.alive === true) {
      shipPowerSprite.shield.attr("stroke-width","1")
    } else {
      shipPowerSprite.shield.attr("stroke-width","0")
    }

    if (shipPower.laser === true && shipStats.alive === true) {
      shipPowerSprite.laser.attr("stroke-width","1")
    } else {
      shipPowerSprite.laser.attr("stroke-width","0")
    }

    if (shipPower.speed === true && shipStats.alive === true) {
      shipPowerSprite.speed.attr("stroke-width","1")
    } else {
      shipPowerSprite.speed.attr("stroke-width","0")
    }

    // Power up timer
    if (shipPower.shield === true && (currentTick - shipPowerPickupTime.shield === 10000)) {
      shipPower.shield = false
      shipPowerSprite.shield.attr("stroke-width","0")
    }

    if (shipPower.speed === true && (currentTick - shipPowerPickupTime.speed === 5000)) {
      shipPower.speed = false
      gameRule.delayBetweenShots = gameRule.delayBetweenShots*10
      shipPowerSprite.speed.attr("stroke-width","0")
    }

    if (shipPower.laser === true && (currentTick - shipPowerPickupTime.laser === 7500)) {
      shipPower.laser = false
      shipPowerSprite.laser.attr("stroke-width","0")
    }




    // Bullet hit detection
    bulletArray.forEach(function(bullet) {
      asteroidsArray.forEach(function (asteroid) {
        if (bulletHit(asteroid,bullet) === true) {
          // Player destroyed an asteroid +1 point
          playerStats.score += 1;
          // Create an explosion at impact
          createExplosion(Number(asteroid.attr("cx")), Number(asteroid.attr("cy")))
          // Remove the asteroid sprite
          asteroid.attr("destroyed","true"); asteroid.elem.remove();
          gameRule.asteroidsCount -= 1;
          bullet.attr("hit","true"); bullet.elem.remove();
          // Break the asteroid
          breakAsteroid(asteroid);

          // Leveling
          if (playerStats.score === playerStats.level*20 && shipStats.alive === true) {
            playerStats.level += 1

            gameRule.asteroidsMaxSpeed *= 1.5
            gameRule.asteroidsMaxSize += 1
            gameRule.asteroidsMaxCount += 2
          }
        }
      })
    })

    enemiesBulletArray.forEach(bullet => {
      // Check if any enemy bullet has hit the player
      if (enemyBulletHit(bullet) === true) {
        if (shipPower.shield === true) {
          // If player has a shield, destroy enemy and removes the shield
          shipPower.shield = false
          createExplosion(shipStats.x, shipStats.y)
          bullet.attr("hit","true"); bullet.elem.remove();

        } else {
          bullet.attr("hit","true"); bullet.elem.remove();
          createExplosion(shipStats.x, shipStats.y, 1000, 800)
          shipStats.x = 900
          shipStats.y = 900
          shipStats.alive = false;
          playerStats.lives -= 1;
          ship.attr("style","fill:none;stroke:white; stroke-width:0");
          shipStats.invulnerable = true;
        }
    }})

    bulletArray.forEach(function(bullet) {
      // Same mechanic as checking for a bullet hitting an asteroid
      enemiesArray.forEach(function (enemy) {
        if (bulletHitEnemy(enemy,bullet) === true) {
          playerStats.score += 1;
          createExplosion(Number(enemy.attr("x")), Number(enemy.attr("y")))
          enemy.attr("dead","true"); enemy.elem.remove();
          bullet.attr("hit","true"); bullet.elem.remove();

          if (playerStats.score === playerStats.level*20 && shipStats.alive === true) {
            playerStats.level += 1

            gameRule.asteroidsMaxSpeed *= 1.5
            gameRule.asteroidsMaxSize += 1
            gameRule.asteroidsMaxCount += 2
          }
        }
      })
    })


    // Removes unnecessary bullets and asteroids
    bulletArray = bulletArray.filter(function(bullet) {
      if (bullet.attr("hit") === "false" && bullet.attr("outside") === "false") {
        return true
      } else {
        return false
      }
    })

    enemiesBulletArray = enemiesBulletArray.filter(function(bullet) {
      if (bullet.attr("hit") === "false" && bullet.attr("outside") === "false") {
        return true
      } else {
        return false
      }
    })

    asteroidsArray = asteroidsArray.filter(function(asteroid) {
      if (asteroid.attr("destroyed") === "false") {
        return true
      } else {
        return false
      }})


    // Ship collision detection
    asteroidsArray.forEach(asteroid => {
      if (shipStats.invulnerable === false) {
        if (shipNotCollide(asteroid) === false && shipStats.alive === true) {
          if (shipPower.shield === true) {
            shipPower.shield = false
            asteroid.attr("destroyed","true"); asteroid.elem.remove();
            gameRule.asteroidsCount -= 1;
            createExplosion(Number(asteroid.attr("cx")), Number(asteroid.attr("cy")))
            breakAsteroid(asteroid);
          } else {
            createExplosion(shipStats.x, shipStats.y, 1000, 800)
            shipStats.x = 900
            shipStats.y = 900
            shipStats.invulnerable = true;
            shipStats.alive = false;
            playerStats.lives -= 1;
            ship.attr("style","fill:none;stroke:white; stroke-width:0");
          }
        }
      }
    })

    // Checks if player collided with enemy (same as previous collision detection mechanics)
    enemiesArray.forEach(enemy => {
      if (Number(enemy.attr("x")) <= shipStats.x && shipStats.x <= Number(enemy.attr("x")) + Number(enemy.attr("width"))
      && Number(enemy.attr("y")) <= shipStats.y && shipStats.y <= Number(enemy.attr("y")) + Number(enemy.attr("height"))) {
        if (shipPower.shield === true) {
          shipPower.shield = false
          createExplosion(Number(enemy.attr("x")), Number(enemy.attr("y")))
          enemy.attr("dead","true"); enemy.elem.remove();
        } else {
          createExplosion(shipStats.x, shipStats.y, 1000, 800)
          // Shift the player out of bounds immediate to avoid player being killed repeatedly everytick before the enemy sprite has been removed
          shipStats.x = 900
          shipStats.y = 900
          shipStats.invulnerable = true;
          shipStats.alive = false;
          playerStats.lives -= 1;
          ship.attr("style","fill:none;stroke:white; stroke-width:0");
        }
    }})

    // Removes dead enemies
    enemiesArray = enemiesArray.filter(function(enemy) {
      return (enemy.attr("dead") === "false")
    })

    // Game over, clear all sprites
    if (playerStats.lives <= 0 && shipStats.alive === false) {
      bulletArray.forEach(bullet => {bullet.elem.remove(); bullet.attr("hit","true")});
      bulletArray.length = 0;
      asteroidsArray.forEach(asteroid => {asteroid.attr("destroyed","true"); asteroid.elem.remove();});
      asteroidsArray.length = 0;

      powerUpArray.forEach(powerUp => {powerUp.attr("taken","true"); powerUp.elem.remove()});
      powerUpArray.length = 0;

      enemiesArray.forEach(enemy => {enemy.attr("dead","true"); enemy.elem.remove();});
      enemiesArray.length = 0;

      enemiesBulletArray.forEach(bullet => {bullet.elem.remove(); bullet.attr("hit","true")});
      enemiesBulletArray.length = 0;

      playerStats.gameEnd = true;

    } else if (playerStats.lives > 0 && shipStats.alive === false){
      // 2 Seconds respawn time
      Observable.interval(2000).takeUntil(gameTick.filter(_ => shipStats.alive === true)).subscribe(_=>{
        shipStats.x = originX;
        shipStats.y = originY;
        shipStats.thrustX = 0;
        shipStats.thrustY = 0;
        shipStats.angle = 0;
        ship.attr("style","fill:none;stroke:white; stroke-width:1");
        shipStats.invulnerable = false;
        shipStats.alive = true;
      })
    }

    // UI Info Update
    const score: HTMLElement = document.getElementById("score")!;
    score.innerHTML = "Score: " + String(playerStats.score)

    const lives: HTMLElement = document.getElementById("lives")!;
    lives.innerHTML = "Lives: " + String(playerStats.lives)

    const level: HTMLElement = document.getElementById("level")!;
    level.innerHTML = "Level " + String(playerStats.level)

    // Game over
    if (playerStats.gameEnd === true) {
      const lives: HTMLElement = document.getElementById("gameover")!;
      lives.innerHTML = "Game Over"
    }
  })
  ///// End of Game Logic


  //// Game settings sliders
  // Uses the same mechanics that was implemented in Week 4 Observable Examples for DragRect except it only changes the x value of the rect.
  const settingsSvg = document.getElementById("settings")!;
  const settingsRect = settingsSvg.getBoundingClientRect();

  // Slider object
  interface Slider {
    sliderBar: Elem,
    sliderButton: Elem
  }

  // Creating the sliders
  function createSlider(yOffset: number): Slider {
    const sliderBar = new Elem(settingsSvg, 'rect')
          .attr('x', 20)    .attr('y', yOffset)
          .attr('width', 300).attr('height', 20)
          .attr('fill', 'rgb(41, 41, 36)')
          .attr('stroke','white').attr('stroke-width','1');

    const sliderButton = new Elem(settingsSvg, 'rect')
            .attr('x', 20)    .attr('y', yOffset)
            .attr('width', 30).attr('height', 20)
            .attr('fill', 'white')
            .attr('stroke','white').attr('stroke-width','1');

    const mousemoveSlider = Observable.fromEvent<MouseEvent>(sliderBar.elem, 'mousemove');

    // This is to handle the bug where if the mouseup happened outside of the slider, the observer never stops so it checks for mouse up on the entire canvas instead of just the slider.
    const mouseupSlider = Observable.fromEvent<MouseEvent>(settingsSvg, 'mouseup');
    sliderButton.observe<MouseEvent>('mousedown')
    .map(({clientX}) => ({ xOffset: Number(sliderButton.attr('x')) - (clientX)}))
    .flatMap(({xOffset}) =>
    mousemoveSlider
        .takeUntil(mousemoveSlider.filter(({clientX}) => (clientX - xOffset < settingsRect.left) || (clientX + xOffset > settingsRect.left + 320))).takeUntil(mouseupSlider)
        .map(({clientX}) => ({ x: clientX + xOffset})))
    .subscribe(({x}) =>
    sliderButton.attr('x', x));

    // Returns a Slider object
    return {sliderBar, sliderButton}
  }


  // Math for slider to modify game rule:
  // dx : distance button travelled = button.x - slider.x
  // d : max distance for button to travel = slider.width - button.width
  // multiplier = 10*(dx/d)
  // new_rule = old_rule + multipler*old_rule
  function getNewRuleIncrement(oldRule: number, button: Elem, slider: Elem, maxMult: number): number {
    const newRule = oldRule + oldRule*maxMult*(
      (Number(button.attr('x')) - Number(slider.attr('x')))/
      (Number(slider.attr('width')) - Number(button.attr('width'))))
    return newRule
  }

  function getNewRuleDecrement(oldRule: number, button: Elem, slider: Elem, maxMult: number): number {
    const newRule = oldRule - oldRule*maxMult*(
      (Number(button.attr('x')) - Number(slider.attr('x')))/
      (Number(slider.attr('width')) - Number(button.attr('width'))))
    return newRule
  }

  const slidersArray = [createSlider(20), createSlider(60), createSlider(100), createSlider(140), createSlider(180), createSlider(220), createSlider(260), createSlider(300),
                        createSlider(340), createSlider(380), createSlider(420)]


  gameTick.subscribe(_=>{

      // Turn it up to 11 !!! (Maximum multiplier is 11 times the original gameRule)
      // Slider 1: Thrust Speed
      gameRule.thrustSpeed = getNewRuleIncrement(gameRuleDefault.thrustSpeed, slidersArray[0].sliderButton, slidersArray[0].sliderBar, 10);
      const thrustSpeed: HTMLElement = document.getElementById("thrustspeed")!;
      thrustSpeed.innerHTML = "Thrust Speed:&emsp;" + String(Math.floor(gameRule.thrustSpeed)) + " px/s"

      // Slider 2: Bullet Speed
      gameRule.bulletSpeed = getNewRuleIncrement(gameRuleDefault.bulletSpeed, slidersArray[1].sliderButton, slidersArray[1].sliderBar, 10);
      const bulletSpeed: HTMLElement = document.getElementById("bulletspeed")!;
      bulletSpeed.innerHTML = "Bullet Speed:&emsp;" + String(Math.floor(gameRule.bulletSpeed)) + " px/s"

      // Slider 3: Firing Speed
      if (shipPower.speed === false) {
        gameRule.delayBetweenShots = getNewRuleDecrement(gameRuleDefault.delayBetweenShots, slidersArray[2].sliderButton, slidersArray[2].sliderBar, 0.9)
        const delayBetweenShots: HTMLElement = document.getElementById("firingspeed")!;
        delayBetweenShots.innerHTML = "Firing Speed:&emsp;" + String(Math.floor(1000/gameRule.delayBetweenShots)) + " shot/s"
      }

      // Slider 4: Asteroid Max Count
      gameRule.asteroidsMaxCount = getNewRuleIncrement(gameRuleDefault.asteroidsMaxCount, slidersArray[3].sliderButton, slidersArray[3].sliderBar, 10);
      const asteroidsMaxCount: HTMLElement = document.getElementById("asteroidsmaxcount")!;
      asteroidsMaxCount.innerHTML = "Max Asteroids:&emsp;" + String(Math.floor(gameRule.asteroidsMaxCount)) + " asteroids"

      // Slider 5: Asteroid Max Size
      gameRule.asteroidsMaxSize = getNewRuleIncrement(gameRuleDefault.asteroidsMaxSize, slidersArray[4].sliderButton, slidersArray[4].sliderBar, 10);
      const asteroidsMaxSize: HTMLElement = document.getElementById("asteroidsmaxsize")!;
      asteroidsMaxSize.innerHTML = "Max Asteroids Size:&emsp;" + String(Math.floor(gameRule.asteroidsMaxSize)) + " px"

      // Slider 6: Asteroid Max Speed
      gameRule.asteroidsMaxSpeed = getNewRuleIncrement(gameRuleDefault.asteroidsMaxSpeed, slidersArray[5].sliderButton, slidersArray[5].sliderBar, 10);
      const asteroidsMaxSpeed: HTMLElement = document.getElementById("asteroidsmaxspeed")!;
      asteroidsMaxSpeed.innerHTML = "Max Asteroids Speed:&emsp;" + String(Math.floor(gameRule.asteroidsMaxSpeed)) + " px/s"

      // Slider 7: Friction Multiplier
      gameRule.frictionMultiplier = getNewRuleDecrement(gameRuleDefault.frictionMultiplier, slidersArray[6].sliderButton, slidersArray[6].sliderBar, 0.9);
      const frictionMultiplier: HTMLElement = document.getElementById("frictionmultiplier")!;
      frictionMultiplier.innerHTML = "Friction:&emsp;-" + String(100-Math.floor(gameRule.frictionMultiplier*100)) + " %/s/s"

      // Slider 8: Rotate Speed
      gameRule.rotateSpeed = getNewRuleIncrement(gameRuleDefault.rotateSpeed, slidersArray[7].sliderButton, slidersArray[7].sliderBar, 4);
      const rotateSpeed: HTMLElement = document.getElementById("rotatespeed")!;
      rotateSpeed.innerHTML = "Rotate Speed:&emsp;" + String(Math.floor(gameRule.rotateSpeed)) + " degree/s"

      // Slider 9: Enemy Move Speed
      gameRule.enemyMoveSpeed = getNewRuleIncrement(gameRuleDefault.enemyMoveSpeed, slidersArray[8].sliderButton, slidersArray[8].sliderBar, 10);
      const enemyMoveSpeed: HTMLElement = document.getElementById("enemymovespeed")!;
      enemyMoveSpeed.innerHTML = "Enemy Speed:&emsp;" + String(gameRule.enemyMoveSpeed.toFixed(1)) + " px/s"

      // Slider 10: Enemy Shoot Delay
      gameRule.enemyShootDelay = getNewRuleDecrement(gameRuleDefault.enemyShootDelay, slidersArray[9].sliderButton, slidersArray[9].sliderBar, 0.9);
      const enemyShootDelay: HTMLElement = document.getElementById("enemyshootdelay")!;
      enemyShootDelay.innerHTML = "Enemy Firing Speed:&emsp;" + String((1000/gameRule.enemyShootDelay).toFixed(1)) + " shot/s"

      // Slider 11: Enemy Bullet Speed
      gameRule.enemyBulletSpeed = getNewRuleIncrement(gameRuleDefault.enemyBulletSpeed, slidersArray[10].sliderButton, slidersArray[10].sliderBar, 10);
      const enemyBulletSpeed: HTMLElement = document.getElementById("enemybulletspeed")!;
      enemyBulletSpeed.innerHTML = "Enemy Bullet Speed:&emsp;" + String(Math.floor(gameRule.enemyBulletSpeed)) + " px/s"

  })

}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
}
