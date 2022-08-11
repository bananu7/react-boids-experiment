import {createRealtimeUpdate} from "./realtime";
import {
    Boid,
    collideAndBounceOffCanvas,
    collideAndBounceOffOtherBoid,
    createRandomlyOnACanvas,
    update,
    randomizeVelocityDirection
} from "./boid";
import {blendRGB, colours, rgbToHex} from "./colour";
import {Cell, generateGridFromCanvas, renderGridLines, renderTiles} from "./grid";

const CELL_SIZE = 80;

/**
 * A simulation that can have a number of circle 'boids' moving about a 2d html canvas
 * in realtime.
 *
 * The boids will bounce off the canvas edges and each other with correct collision detection
 * and physics as well as indicate when a collision has happened.
 *
 * You can decide to render a 2D grid, show the FPS and swap between a low/high performance mode
 * in realtime as well as add/remove boids from the sim.
 */
class Sim {
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    showGrid: boolean;
    showFPS: boolean;
    enablePerformanceMode: boolean;
    boids: Boid[];
    grid: Cell[][];

    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.showGrid = false;
        this.showFPS = false;
        this.enablePerformanceMode = false;
        this.boids = [];
        this.grid = [];
    }

    init(canvas: HTMLCanvasElement): void {
        if (this.canvas) {
            console.error('Cannot re-initialise the simulation');
            return;
        }

        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d")!;

        this.grid = generateGridFromCanvas(canvas, 64, '#ffe282');

        createRealtimeUpdate(60, window, this.update.bind(this));
    }

    hasInit(): boolean {
        return this.canvas !== null;
    }

    spawn(amount: number): void {
        if (!this.canvas) {
            console.error('Simulation has not been initialised');
            return;
        }

        //Todo: Clear spatial caches

        for (let i = 0; i < amount; i++) {
            const boid: Boid = createRandomlyOnACanvas(this.canvas, 4, 8, '#FFFFFFFF', 32);
            randomizeVelocityDirection(boid);
            this.boids.push(boid);
        }

        //Todo: Regenerate spatial caches
    }

    clear(): void {
        if (!this.canvas) {
            console.error('Simulation has not been initialised');
            return;
        }

        //Todo: Clear spatial caches

        this.boids.length = 0;
    }

    setShowGrid(on: boolean): void {
        if (!this.canvas) {
            console.error('Simulation has not been initialised');
            return;
        }
        this.showGrid = on;
    }

    setPerformanceMode(on: boolean): void {
        if (!this.canvas) {
            console.error('Simulation has not been initialised');
            return;
        }
        this.enablePerformanceMode = on;
    }

    setShowFPS(on: boolean): void {
        if (!this.canvas) {
            console.error('Simulation has not been initialised');
            return;
        }
        this.showFPS = on;
    }


    private update(dt: number): void {

        if (!this.ctx || !this.canvas) return;

        //Low performance n^2 boid v boid collision + response

        for (let i = 0; i < this.boids.length; i++) {
            const a: Boid = this.boids[i];

            for (let k = 0; k < this.boids.length; k++) {

                //same boid
                if (k === i) continue;

                const b: Boid = this.boids[k];

                const avb = collideAndBounceOffOtherBoid(a, b);

                if (avb) {

                    const bva = collideAndBounceOffOtherBoid(b, a);

                    a.pos = avb.newPos;
                    a.vel = avb.newVelocity;
                    a.collisionCoolDownSeconds = 1;

                    //Technically bva won't ever be null as avb wasn't but this pleases my brain :)
                    if (bva) {
                        b.pos = bva.newPos;
                        b.vel = bva.newVelocity;
                        b.collisionCoolDownSeconds = 1;
                    }
                }
            }
        }


        for (let i = 0; i < this.boids.length; i++) {
            const boid: Boid = this.boids[i];
            const collision = collideAndBounceOffCanvas(boid, this.canvas);

            if (collision) {
                boid.pos = collision.newPos;
                boid.vel = collision.newVelocity;
            }

            update(boid, dt);
        }

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.showGrid) {
            renderTiles(ctx, this.grid, CELL_SIZE);
            renderGridLines(this.grid, CELL_SIZE, ctx, 0.25);
        }

        this.renderBoids();
    }


    renderBoids() {

        if (!this.ctx) return;

        const ctx = this.ctx;

        const normalBoidColour = colours.white();
        const collidedBoidColour = colours.red();

        for (let i: number = 0; i < this.boids.length; i++) {
            const boid: Boid = this.boids[i];
            boid.colourHEX = rgbToHex(blendRGB(normalBoidColour, collidedBoidColour, boid.collisionCoolDownSeconds));
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.arc(boid.pos.x, boid.pos.y, boid.radius, 0, 2 * Math.PI);
            ctx.fillStyle = boid.colourHEX;
            ctx.fill();
            ctx.stroke();
        }
    }
}

export default Sim;