function circle_points(n) {
    let dtheta = TWO_PI/n;
    let points = [];
    let x0 = width/2;
    let y0 = height/2;
    let rad = height/4;
    for (let i = 0; i < n; i++) {
        points.push(createVector(x0 + rad*Math.cos(dtheta*i), y0 + rad*Math.sin(dtheta*i)).add(p5.Vector.random2D().mult(20)))
    }
    return points;
}

class ClosedChain {

    constructor (points = circle_points(20)) {
        this.num_points = points.length;
        this.positions = points;
        this.lengths = [];
        this.computeLengths();
        this.curvature = this.computeCurvature();
    }

    computeLengths() {
        for (let i = 0; i< this.num_points; i++) {
            let a = this.positions[i];
            let b = this.positions[(i+1) % this.num_points];
            this.lengths[i] = a.dist(b);
        }
    }

    computeCurvature() {
        let curvature = [];
        for (let i = 1; i <= this.num_points; i++) {
            let prev = this.positions[i-1];
            let curr = this.positions[i% this.num_points];
            let next = this.positions[(i+1) % this.num_points];
            let e1 = p5.Vector.sub(curr, prev);
            let e2 = p5.Vector.sub(next, curr);
            let psi = e1.angleBetween(e2);
            let l1 = this.lengths[i-1];
            let l2 = this.lengths[i % this.num_points];
            let kappa = 2*psi / (l1+l2);
            curvature[i % this.num_points] = kappa;
        }
        return curvature;
    }

    reconstructCurve(curvature) {
        let r0 = this.positions[0];
        let r1 = this.positions[1];
        let angle = p5.Vector.sub(r1,r0).heading();
        for (let i = 1; i < this.num_points; i++) {
            let l1 = this.lengths[i-1];
            let l2 = this.lengths[i % this.num_points];
            this.positions[i] = p5.Vector.add(this.positions[i-1], createVector(Math.cos(angle), Math.sin(angle)).mult(l1));
            angle += (l1+l2)/2 * curvature[i % this.num_points];
        }
    }

    projectOnConstraints(f) {
        let e2 = [];
        let e3 = [];
        for (let i = 0; i < this.num_points; i++){
          e2[i] = this.positions[i].x;
          e3[i] = this.positions[i].y;
        }
        let x1 = tf.ones([this.num_points]);
        let x2 = tf.tensor(e2);
        let x3 = tf.tensor(e3);
        let b = tf.tensor(f);
        let A = tf.stack([x1,x2,x3]);
        let y = tf.unstack(tf.linalg.gramSchmidt(A));
        let res = tf.zerosLike(b);
        for(let i = 0; i <3; i++) {
            res = tf.add( res, tf.mul(y[i].dot(b),y[i]) )
        }
        res = tf.sub(b,res);
        return res.arraySync();
    }

    stepCrane(stepSize) {
        let kappa = this.computeCurvature();
        let f = [];
        for (let i = 0; i < this.num_points; i++){
          f[i] = -kappa[i];
        }
        let projected_speed = this.projectOnConstraints(f);
        let kappaNext = [];
        for (let i = 0; i < this.num_points; i++){
            kappaNext[i] = kappa[i] + stepSize * projected_speed[i];
        }
        this.reconstructCurve(kappaNext);
    }

    step (stepSize) {
        let kappa = this.computeCurvature();
        for (let i = 1; i <= this.num_points; i++) {
            let prev = this.positions[i-1];
            let curr = this.positions[i% this.num_points];
            let next = this.positions[(i+1) % this.num_points];
            let e1 = p5.Vector.sub(curr, prev).normalize();
            e1.rotate(HALF_PI); 
            let e2 = p5.Vector.sub(next, curr).normalize();
            e2.rotate(HALF_PI);
            let normal = p5.Vector.lerp(e1,e2, Math.random());
            normal.normalize();
            normal.mult(-stepSize*kappa[i % this.num_points]);
            this.positions[i%this.num_points].add(normal);
            
        }
    }

    show() {
        for (let i = 0; i< this.num_points; i++) {
            let a = this.positions[i];
            let b = this.positions[(i+1) % this.num_points];    
            strokeWeight(10);
            let kappa = Math.abs(this.curvature[i]);
            stroke(128);
            point(a.x, a.y);
            strokeWeight(2);
            stroke(0);
            line(a.x, a.y , b.x, b.y);
        }
    }

}