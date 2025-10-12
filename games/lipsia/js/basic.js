const $fullscreenTrigger = document.querySelector('.heraldic-shield > img');
const $dialog = document.createElement('dialog');
document.querySelector('main').appendChild($dialog);
$dialog.showModal();
$dialog.style.blockSize = '90%';
$dialog.style.inlineSize = '90%';
$dialog.style.position = 'relative';
const Petridish = {
    tickDelay: 1000,
    map: new Map(),
    maxX: 1920,
    maxY: 1080,
    boundElement: null,
    bindTo: function (element) {
        this.boundElement = element;
        this.maxX = element.clientWidth;
        this.maxY = element.clientHeight;
    },
    getPositionKey: function(x, y) {
        return x + '-' + y;
    },
    getTenantsInTargetArea(x,y, areaRadius) {
        let currentX = Math.max(0, x - areaRadius);
        let currentY = Math.max(0, y - areaRadius);
        let maxX = Math.min(this.maxX, x + areaRadius);
        let maxY = Math.min(this.maxY, y + areaRadius);
        let positions = [];
        
        for(currentX; currentX < maxX; currentX++) {
            for(currentY; currentY < maxY; currentY++) {
                let position = [currentX, currentY];
                
                if(!this.map.has(this.getPositionKey(currentX, currentY))) {
                    positions.push(position);
                }
            }
        }
        
        return positions;
    },
    /**
     * 
     * @param {Bacterion} newborn
     * @returns {void}
     */
    placeNewborn: function (newborn) {
        let areaRadius = (newborn.parent === null) ? 3 : newborn.parent.size;
        let positions = this.getTenantsInTargetArea(newborn.x, newborn.y, areaRadius);
        
        if(positions.length === 0) {
            return newborn.die('stillbornness');
        }
        
        let position = positions[Math.floor(Math.random() * positions.length)];
        newborn.x = position[0];
        newborn.y = position[1];
        this.map.set(this.getPositionKey(newborn.x, newborn.y), newborn);
    },
    /**
     * 
     * @param {Bacterion} tenant
     * @returns {undefined}
     */
    placeMover: function(tenant) {
        let targetX = Math.floor(tenant.x + tenant.vectorX);
        let targetY = Math.floor(tenant.y + tenant.vectorY);
        let areaRadius = tenant.size;
        let positions = this.getTenantsInTargetArea(targetX, targetY, areaRadius);
        
        if(positions.length === 0) return console.warn(`cannot move to target-area ${targetX}-${targetY}`, tenant);
        
        let position = positions[Math.floor(Math.random() * positions.length)];
        let oldPositionKey = this.getPositionKey(tenant.x, tenant.y);
        let newPositionKey = this.getPositionKey(position[0], position[1]);
        tenant.x = position[0];
        tenant.y = position[1];
        this.map.set(newPositionKey, tenant);
        this.map.delete(oldPositionKey, tenant);
    },
    /**
     * 
     * @param {Bacterion} tenant
     * @param {int} distance
     * @returns {Array}
     */
    getNeighbourhood: function({x,y}, distance = 1) {
        let currentX = Math.max(0, x - distance);
        let currentY = Math.max(0, y - distance);
        let maxX = Math.min(this.maxX, x + distance);
        let maxY = Math.min(this.maxY, y + distance);
        let positions = [];
        
        for(currentX; currentX < maxX; currentX++) {
            positions[currentX] = [];
            
            for(currentY; currentY < maxY; currentY++) {
                let positionKey = this.getPositionKey(currentX, currentY);
                
                if(this.map.has(positionKey)) {
                    positions[currentX].push(this.map.get(positionKey));
                } else {
                    positions[currentX].push(null);
                }
            }
        }
        
        return positions;
    },
    removeDied(tenant) {
        this.map.delete(this.getPositionKey(tenant.x, tenant.y));
    },
    spawn(number = 20) {
        while(number-- > 0) {
            let x = Math.floor(Math.random() * this.maxX);
            let y = Math.floor(Math.random() * this.maxY);
            
            new Bacterion(x, y);
        }
    }
};
Petridish.bindTo($dialog);

class Bacterion {
    static SEX_MALE = 'male';
    static SEX_FEMALE = 'female';
    static SEX_HERMAPHRODITE = 'hermaphrodite';
    static AGE_OF_MATURITY = 16;
    static NEWBORN_HEALTH = 255;
    static PROCREATION_FACTOR = 2;
    size = 1;
    age = 0;
    health;
    sex;
    x;
    y;
    tickTimeout;
    img;
    parent;
    isDead = false;
    neighbourhood;
    momentum = 0;
    vectorX = 0;
    vectorY = 0;
    
    constructor(x, y, parent = null) {
        this.health = Bacterion.NEWBORN_HEALTH;
        this.sex = Bacterion.SEX_HERMAPHRODITE;
        this.x = x;
        this.y = y;
        this.parent = parent;
        console.log(`newborn`, this);
        this.img = document.createElement('img');
        Petridish.boundElement.appendChild(this.img);
        this.img.style.position = 'absolute';
        this.repaint();
        this.checkNeighbourhood();
        Petridish.placeNewborn(this);
        this.tickTimeout = window.setTimeout(() => this.lifeTick(), Petridish.tickDelay);
    }
    
    getColor(alpha = 1) {
        if(this.sex === Bacterion.SEX_FEMALE) return 'rgba('+this.health+', 0, 0, 0.66)';
        if(this.sex === Bacterion.SEX_MALE) return 'rgba(0, '+this.health+', 0, 0.66)';
        
        return 'rgba(0, 0, '+this.health+', '+alpha+')';
    }
    
    repaint() {
        this.img.style.width = this.size+'px';
        this.img.style.height = this.size+'px';
        this.img.style.left = this.x - Math.floor((this.size - 1) / 2)+'px';
        this.img.style.top = this.y - Math.floor((this.size - 1) / 2)+'px';
        this.img.style.borderRadius = Math.floor(this.size/ 2)+'px';
        this.img.style.backgroundImage = 'radial-gradient('+this.getColor()+', transparent)';
    }
    
    lifeTick() {
        window.clearTimeout(this.tickTimeout);
        this.move();
        if(!this.breath()) return this.die('asphixiation');
        this.grow();
        this.repaint();
        this.procreate();
        if(!this.progressAge()) return this.die('old-age');
        this.tickTimeout = window.setTimeout(() => this.lifeTick(), Petridish.tickDelay);
    }
    
    checkNeighbourhood() {
        this.neighbourhood = Petridish.getNeighbourhood(this, this.size);
    }
    
    breath() {
        let numberFreeSpaces = this.neighbourhood.flat().filter(item => item === null).length;
        let breathingRoomOccupied = Math.floor(this.neighbourhood.flat().filter(item => item !== null)
                .reduce((carry,tenant) => carry + tenant.size, 0) / 4);
        
        return numberFreeSpaces - breathingRoomOccupied >= this.size;
    }
    
    move() {
        if(Math.abs(this.vectorX) > 1 || Math.abs(this.vectorY) > 1) {
            Petridish.placeMover(this);
        }
        
        this.checkNeighbourhood();
        let nearbyPopulation = this.neighbourhood.flat().filter(item => item !== null).length;
        this.momentum = Math.max(0,this.momentum - 1);
        this.momentum += nearbyPopulation - this.size;
        let vectorX = 10 * this.momentum * Math.random();
        let vectorY = 10 * this.momentum * Math.random();
        let lowestPopulation = [0, 0, nearbyPopulation];
        [[-1,-1], [-1,1], [1,-1], [1,1]].forEach(([xFactor, yFactor]) => {
            let x = this.x + xFactor * vectorX;
            let y = this.y + yFactor * vectorY;
            let targetPopulation = Petridish.getNeighbourhood({x,y}, this.size).flat().filter(item => item === null).length;
            
            if(lowestPopulation.length === 0 || lowestPopulation[2] > targetPopulation) {
                lowestPopulation = [x, y, targetPopulation];
            }
        });
        this.vectorX = lowestPopulation[0];
        this.vectorY = lowestPopulation[1];
    }
    
    grow() {
        this.size++;
    }
    
    roleSex() {
        this.sex = [Bacterion.SEX_FEMALE, Bacterion.SEX_MALE][Math.floor(Math.random() * 2)];
    }
    
    progressAge() {
        if(++this.age === Bacterion.AGE_OF_MATURITY) this.roleSex();
        return --this.health > 0;
    }
    
    procreate() {
        if(this.age < Bacterion.AGE_OF_MATURITY) return;
        if(this.sex !== Bacterion.SEX_FEMALE) return;
        let maleNeighbourhood = Petridish.getNeighbourhood(this, this.size).flat().filter(position => position !== null)
                .filter(bacterion => bacterion.sex === Bacterion.SEX_MALE);
        
        if(maleNeighbourhood.length === 0) return;
        console.log(`num of elligible males: ${maleNeighbourhood.length}`);
        
        let overallHealth = maleNeighbourhood.reduce((carry, bacterion) => carry + bacterion.health, this.health);
        //console.log(`overallHealth`, overallHealth);
        let numberChildren = Math.floor(overallHealth * Bacterion.PROCREATION_FACTOR / Bacterion.NEWBORN_HEALTH);
        
        if(numberChildren <= 0) return;
        
        console.log(`Spawning ${numberChildren} children...`, this);
        
        while(numberChildren-- > 0) {
            new Bacterion(this.x, this.y);
        }
    }
    
    die(reason = 'unknown') {
        if(this.isDead) return;
        this.isDead = true;
        console.warn(`Died of "${reason}" at ${this.x}-${this.y}`, this);
        window.clearTimeout(this.tickTimeout);
        Petridish.boundElement.removeChild(this.img);
        Petridish.removeDied(this);
    }
}

function actuateSlider($sliderButton) {
    let $slider = $sliderButton.closest('.slider');
    let status = $slider.dataset.sliderStatus;
    
    if(status === 'out') {
        $sliderButton.classList.replace('slider-position-out', 'slider-position-in');
        $slider.classList.add('slider-in');
        $slider.dataset.sliderStatus = 'in';
    } else {
        $sliderButton.classList.replace('slider-position-in', 'slider-position-out');
        $slider.classList.remove('slider-in');
        $slider.dataset.sliderStatus = 'out';
    }
}

$fullscreenTrigger.addEventListener('click', async event => {
    if(event.target.dataset.fullscreenTriggerStatus === 'off') {
        document.body.requestFullscreen().then(data => {
            event.target.dataset.fullscreenTriggerStatus = 'on';
            return screen.orientation.lock('landscape-primary').catch(error => {console.warn(error);});
        });
    } else {
        document.exitFullscreen().then(data => {
            event.target.dataset.fullscreenTriggerStatus = 'off';
            screen.orientation.unlock();
        });
    }
});

document.body.addEventListener('click', event => {
    if(event.target.matches('.slider-button')) return actuateSlider(event.target);
});

