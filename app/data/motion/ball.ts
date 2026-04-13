export function govern_x(x) {
    const vx = 0;        // no horizontal force, ball falls straight down
    const dt = 0.016;    // seconds per frame (~60fps)
    return x + vx * dt;
}

// call govern_y repeatedly each frame — it holds its own state internally
export const govern_y = (function () {
    let vy = 0;          // current vertical velocity (px/s), starts at rest
    const g = 9.8;       // gravitational acceleration (px/s²), scaled to canvas
    const dt = 0.016;    // seconds per frame (~60fps)
    const r = 18;        // ball radius in px
    const GROUND_Y = 500 - r; // y-coordinate ball centre cannot exceed

    return function govern_y(y) {
        vy += g * dt;
        let next_y = y + vy * dt;
        if (next_y >= GROUND_Y) {
            next_y = GROUND_Y;
            vy = -vy * 1.0;  // e = 1.0, perfectly elastic, flip velocity
        }
        return next_y;
    };
})();

