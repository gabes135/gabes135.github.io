function crossVectors(v1, v2) {
    // console.log("v1:", v1); // Debug log
    // console.log("v2:", v2); // Debug log
    return [
        v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0],
    ];
}
function  addVectors(v1, v2) {
    return v1.map((val, i) => val + v2[i]);
}

function dotVectors(v1, v2) {
    return v1.reduce((sum, val, i) => sum + val * v2[i], 0);
}



class PitchState {
    constructor(row, f_L = 1) {

        this.ft_to_m = 0.3048
        this.rpm_to_rad = 0.10472
        this.deg_to_rad = np.pi/180

        this.g = 9.81;
        this.m = 0.1453;  // kg
        this.rho_air = 1.19;  // kg/m^3
        this.R = 0.0369;  // m
        this.Area = Math.PI * (this.R ** 2);  // m^2
        this.y_home = 1.417 * this.ft_to_m;  // m
        this.y_50 = 50 * this.ft_to_m;  // m
        this.K = 0.5 * this.rho_air * this.Area / this.m;


        
        // Example of how to handle `df` here, as it's not specified in JS
    
    

        this.state = [
          parseFloat(row['release_pos_x']),
          parseFloat(row['release_pos_y']),
          parseFloat(row['release_pos_z']),
          parseFloat(row['vx0']),
          parseFloat(row['vy0']),
          parseFloat(row['vz0']),
          parseFloat(row['ax']),
          parseFloat(row['ay']),
          parseFloat(row['az']),
          parseFloat(row['release_spin_rate'])
        ];

        this.state = this.state.map(v => v * this.ft_to_m);
        this.state[9] = this.state[9] * (this.rpm_to_rad / this.ft_to_m);

        let vy_f = -Math.sqrt(this.state[4] ** 2 + 2 * (this.state[7] * (this.y_home-this.state[1])));
        this.t_f =  (vy_f - this.state[4]) / this.state[7];
   
        this.N_t = 100000
        this.get_release_velo();
        this.get_coeffs();
        
        this.C_L *= f_L;

        

        this.traj = new Array(3).fill(0).map(() => new Array(this.N_t).fill(0));
        this.traj[0] = this.state.slice(0, 3);

        this.initial_conditions = this.state.slice(0, 6);
        this.accel0 = this.state.slice(6, 9);
    }

    get_release_velo() {
        let vy_rel = -Math.sqrt(this.state[4] ** 2 + (2 * this.state[7] * (this.state[1] - this.y_50)));
        let delta_t = (this.state[4] - vy_rel) / this.state[7];
        let vx_rel = this.state[3] - (this.state[6] * delta_t);
        let vz_rel = this.state[5] - (this.state[8] * delta_t);
        
        this.state[3] = vx_rel;
        this.state[4] = vy_rel;
        this.state[5] = vz_rel;
    }

    get_coeffs() {
        const state = this.state;

        const A = 0.336;
        const B = 6.041;

        let v0 = state.slice(3, 6);
        let v0_mag = Math.hypot(...v0);
        let v0_hat = v0.map(val => val / v0_mag);

        // let vfx =  v0[0] + this.t_f * state[6]
        // let vfy =  v0[1] + this.t_f * state[7]
        // let vfz =  v0[2] + this.t_f * state[8]
        // let vbar = [(v0[0] + vfx)/2, (v0[1] + vfy)/2, (v0[2] + vfz)/2]
        // let vbar_mag = Math.hypot(...vbar)
        // let vbar_hat = vbar.map(val => val / vbar_mag);

        let a_g = [0, 0, -this.g];
        let a_star = state.slice(6, 9).map((val, i) => val - a_g[i]);

   
        let a_D_mag = Math.abs(dotVectors(a_star, v0_hat));
        let a_D = v0_hat.map((val, i) => -a_D_mag * val);
        
        
        let a_M = a_star.map((val, i) => val - a_D[i]);
        let a_M_mag = Math.hypot(...a_M);
        let a_M_hat = a_M.map(val => val / a_M_mag);

        let C_D = a_D_mag / (this.K * v0_mag ** 2);
        let C_L = a_M_mag / (this.K * v0_mag ** 2);
    

        let S = (1 / B) * Math.log(A / (A - C_L));
        let omega_T_mag = (v0_mag / this.R) * S;
      
        let omega_T_hat = crossVectors(v0_hat, a_M_hat);
     
        let omega_G_mag = 0;
        if (state[9] > omega_T_mag) {
            omega_G_mag = Math.sqrt(state[9] ** 2 - omega_T_mag ** 2);
        }

        this.omega_T = omega_T_hat.map(v => omega_T_mag * v);
        this.omega_G = v0_hat.map(v => omega_G_mag * v);

        this.omega_T_hat = omega_T_hat
        this.omega_G_hat = v0_hat

        

        let omega = addVectors(this.omega_T, this.omega_G);
        let omega_mag = Math.hypot(...omega);
        let omega_hat = omega.map(val => val / omega_mag);

        this.C_D = C_D;
        this.C_L = C_L;
        this.omega_hat = omega_hat;
        this.omega_mag = omega_mag;

        this.v = v0_mag
        this.omega_T_mag = omega_T_mag
        this.omega_G_mag = omega_G_mag

        this.S = S
    }


    // Helper function for vector addition
  

    // Continue implementing other functions similarly...


    derivs(y) {
      // let dampening = getSliderValue("gammaSlid");
      // let resonance = getSliderValue("deltaSlid");

      let pos = y.slice(0, 3);
      let vel = y.slice(3, 6);

      let vel_mag = Math.hypot(...vel);
      let vel_hat = vel.map(val => val / vel_mag);

      let a_g = [0, 0, -this.g]

      let a_D = vel_hat.map(val => - this.C_D * this.K * (vel_mag ** 2) * val) 

      let omega_cross_v = crossVectors(this.omega_hat, vel_hat);
      let omega_cross_v_mag = Math.hypot(...omega_cross_v)
      let a_M = omega_cross_v.map(val =>  this.C_L * this.K * (vel_mag ** 2) * val / omega_cross_v_mag) 
     
      let a = addVectors(a_g, a_D)
      a = addVectors(a, a_M)
    
      return [vel[0], vel[1], vel[2], a[0], a[1], a[2]];
    }

}






