class BootScene extends Phaser.Scene {
    preload() {
        // Load assets here if any
        // For now, using simple shapes
    }

    create() {
        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    create() {
        this.add.text(400, 300, 'Space Contra', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 350, 'Press SPACE to Start', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        // Mobile start button
        const startBtn = this.add.text(400, 400, 'Tap to Start', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.player = null;
        this.enemies = null;
        this.bullets = null;
        this.enemyBullets = null;
        this.powerups = null;
        this.cursors = null;
        this.spaceKey = null;
        this.upKey = null;
    }

    preload() {
        // Load SVG textures as data URLs
        this.load.image('player', 'data:image/svg+xml;base64,' + btoa('<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" fill="#00ff00"/></svg>'));
        this.load.image('enemy', 'data:image/svg+xml;base64,' + btoa('<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" fill="#ff0000"/></svg>'));
        this.load.image('bullet', 'data:image/svg+xml;base64,' + btoa('<svg width="8" height="4" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="4" fill="#ffff00"/></svg>'));
        this.load.image('enemyBullet', 'data:image/svg+xml;base64,' + btoa('<svg width="8" height="4" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="4" fill="#ff00ff"/></svg>'));
        this.load.image('powerup', 'data:image/svg+xml;base64,' + btoa('<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="8" fill="#0000ff"/></svg>'));
        this.load.image('platform', 'data:image/svg+xml;base64,' + btoa('<svg width="200" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="32" fill="#666666"/></svg>'));
    }

    create() {
        // Set up world bounds
        this.physics.world.setBounds(0, 0, 800, 600);

        // Create player
        this.player = this.physics.add.sprite(100, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(300);

        // Create groups
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.powerups = this.physics.add.group();

        // Platforms for level
        this.platforms = this.physics.add.staticGroup();
        this.createLevel();

        // Colliders
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

        // Mobile controls
        this.setupMobileControls();

        // Spawn enemies
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Spawn powerups occasionally
        this.time.addEvent({
            delay: 5000,
            callback: this.spawnPowerup,
            callbackScope: this,
            loop: true
        });

        // Update UI
        this.updateUI();
    }

    update() {
        // Player movement
        if (this.cursors.left.isDown || this.mobileLeft) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown || this.mobileRight) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }

        if ((this.cursors.up.isDown || this.upKey.isDown || this.mobileJump) && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
            this.mobileJump = false; // Reset after jump
        }

        // Shooting
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.mobileShoot) {
            this.shootBullet();
            this.mobileShoot = false; // Reset after shoot
        }

        // Scroll camera
        this.cameras.main.scrollX = this.player.x - 400;

        // Check level end
        if (this.player.x > 2400) { // End of level
            this.nextLevel();
        }
    }

    createLevel() {
        // Simple level with platforms
        this.platforms.create(400, 568, 'platform').setScale(4, 1).refreshBody();
        this.platforms.create(600, 400, 'platform').setScale(1, 1).refreshBody();
        this.platforms.create(1000, 300, 'platform').setScale(1, 1).refreshBody();
        this.platforms.create(1400, 500, 'platform').setScale(1, 1).refreshBody();
        this.platforms.create(1800, 400, 'platform').setScale(1, 1).refreshBody();
        this.platforms.create(2200, 568, 'platform').setScale(2, 1).refreshBody();
    }

    spawnEnemy() {
        const x = this.player.x + 800;
        const y = Phaser.Math.Between(200, 500);
        const enemy = this.enemies.create(x, y, 'enemy');
        enemy.setVelocityX(-100);
        enemy.body.setGravityY(300);

        // Enemy shoots occasionally
        this.time.addEvent({
            delay: Phaser.Math.Between(1000, 3000),
            callback: () => {
                if (enemy.active) {
                    this.enemyShoot(enemy);
                }
            },
            callbackScope: this
        });
    }

    spawnPowerup() {
        const x = this.player.x + 800;
        const y = Phaser.Math.Between(200, 500);
        const powerup = this.powerups.create(x, y, 'powerup');
        powerup.setVelocityX(-50);
        powerup.body.setGravityY(100);
    }

    shootBullet() {
        const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
        bullet.setVelocityX(300);
        bullet.body.allowGravity = false;
    }

    enemyShoot(enemy) {
        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
        bullet.setVelocityX(-200);
        bullet.body.allowGravity = false;
    }

    hitEnemy(bullet, enemy) {
        bullet.destroy();
        enemy.destroy();
        this.score += 10;
        this.updateUI();
    }

    hitPlayer(player, bullet) {
        bullet.destroy();
        this.lives--;
        this.updateUI();
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    collectPowerup(player, powerup) {
        powerup.destroy();
        this.score += 50;
        this.lives = Math.min(this.lives + 1, 5); // Max 5 lives
        this.updateUI();
    }

    nextLevel() {
        this.level++;
        this.player.x = 100;
        this.player.y = 300;
        this.cameras.main.scrollX = 0;
        this.enemies.clear(true, true);
        this.bullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.powerups.clear(true, true);
        this.createLevel();
        this.updateUI();
    }

    gameOver() {
        this.scene.pause();
        this.add.text(400, 300, 'Game Over', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
    }

    setupMobileControls() {
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        const jumpBtn = document.getElementById('jump-btn');
        const shootBtn = document.getElementById('shoot-btn');

        leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.mobileLeft = true; });
        leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.mobileLeft = false; });
        rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.mobileRight = true; });
        rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.mobileRight = false; });
        jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.mobileJump = true; });
        shootBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.mobileShoot = true; });
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
    render: {
        pixelArt: false,
        willReadFrequently: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene]
};

const game = new Phaser.Game(config);