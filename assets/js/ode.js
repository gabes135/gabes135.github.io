class ODEsolver {
    constructor(ode, y0, t0, t1) {
        this.ode = ode
        this.y0 = y0
        this.t0 = t0
        this.t1 = t1

        if(isNaN(this.t0))
            console.warn("invalid starting time");
    }



    rk4(resolution) {
        const h = (this.t1 - this.t0) / resolution
        var ts = Array.from(Array(resolution + 1), (_, k) => k * h + this.t0) //time series datapoints
        var ys = Array.from(Array(resolution + 1), () => Array(this.y0.length).fill(0))
        ys[0] = this.y0
        
        if(this.y0.includes(NaN))
            console.warn("y0 contains invalid starting value", this.y0)

        let lastIndex = resolution; 
        for (let i = 0; i < resolution; i++) {
            const k1 = this.ode(ys[i]) // f(t, y_n)

            const s1 = ys[i].map((y, j) => y + k1[j] * h / 2)
            const k2 = this.ode(s1) // f(t + h/2, y_n + k1*h/2)

            const s2 = ys[i].map((y, j) => y + k2[j] * h / 2)
            const k3 = this.ode(s2) // f(t + h/2, y_n + k2*h/2)

            const s3 = ys[i].map((y, j) => y + k3[j] * h)
            const k4 = this.ode(s3) // f(t + h, y_n + k3*h)
            ys[i + 1] = ys[i].map((x, j) => x + (k1[j] / 6 + k2[j] / 3 + k3[j] / 3 + k4[j] / 6) * h) //y_n+1 = y_n + (k1 +2*k2 + 2*k3 +k4)/6 *h
            
            if (ys[i + 1][1] < 0) {
                lastIndex = i + 1;
                break;
            }

        }


         return {
            ts: ts.slice(0, lastIndex + 1),
            ys: ys.slice(0, lastIndex + 1)
        };
    }

   
}

