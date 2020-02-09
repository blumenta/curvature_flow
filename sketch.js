let chains = [];
let newCurveButton;
let creatingCurve = false;
let points = [];
let next = 0;

function setup () {
    newCurveButton = createButton('new curve');
    newCurveButton.mousePressed(newCurve);
    createCanvas(800, 800);
    chains.push(new ClosedChain());
}

function draw () {
    background(250);
    if (!creatingCurve) {
        chains[0].stepCrane(0.005);
        chains[0].show();
    } else {
        if (mouseIsPressed === true && millis()>next) {
            points.push(createVector(mouseX, mouseY));
            next = millis() + 200;
        }
        for (let p of points) {
            strokeWeight(10);
            stroke(128);
            point(p.x, p.y);
        }
    }
    
}

function newCurve() {
    creatingCurve = true;
    points = [];
}

function keyPressed() {
    if (keyCode == ENTER){
        creatingCurve = false;
        points.shift();
        chains[0] = new ClosedChain(points);
    }
}