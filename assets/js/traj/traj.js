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
        this.deg_to_rad = Math.PI/180

        this.g = 9.81;
        this.a_G = [0, 0, -this.g];
        this.m = 0.1453;  // kg
        this.rho_air = 1.19;  // kg/m^3
        this.R = 0.0369;  // m
        this.Area = Math.PI * (this.R ** 2);  // m^2
        this.y_home = 1.417 * this.ft_to_m;  // m
        this.y_50 = 50 * this.ft_to_m;  // m
        this.K = 0.5 * this.rho_air * this.Area / this.m;


        
    

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
        ];


        this.state = this.state.map(v => v * this.ft_to_m);
        this.omega = parseFloat(row['release_spin_rate']) * this.rpm_to_rad;
        this.phi = parseFloat(row['spin_axis']) * this.deg_to_rad;

        this.hand = (row['p_throws'] === 'R') ? 1 : -1;
        this.pitch_type = row['pitch_type']
        this.eta_bar = parseFloat(row[`eta_${this.pitch_type}`])

        
        let vy_f = -Math.sqrt(this.state[4] ** 2 + 2 * (this.state[7] * (this.y_home-this.state[1])));
        this.t_f =  (vy_f - this.state[4]) / this.state[7];
   
       
        this.get_release_velo();
        this.get_coeffs();
        
        this.C_L *= f_L
        this.C_S *= f_L

        
        this.N_t = 100000
        this.traj = new Array(3).fill(0).map(() => new Array(this.N_t).fill(0));
        for (let i = 0; i < 3; i++) {
            this.traj[i][0] = this.state[i]; // copy x,y,z at t=0
        }

        this.initial_conditions = this.state.slice(0, 6);
        this.constant_a = false
        this.accel0 = this.state.slice(6, 9);

        this.x_sc = parseFloat(row['plate_x'])
        this.z_sc = parseFloat(row['plate_z'])
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

        // Average velo over trajectory
        let v_init = state.slice(3, 6);
        let vfx =  v_init[0] + this.t_f * state[6]
        let vfy =  v_init[1] + this.t_f * state[7]
        let vfz =  v_init[2] + this.t_f * state[8]

        let v0 = [(v_init[0] + vfx)/2, (v_init[1] + vfy)/2, (v_init[2] + vfz)/2]
        let v0_mag = Math.hypot(...v0);
        let v0_hat = v0.map(val => val / v0_mag);

        
        let a_star = state.slice(6, 9).map((val, i) => val - this.a_G[i]);

        let a_D_mag = Math.abs(dotVectors(a_star, v0_hat));
        let a_D = v0_hat.map((val, i) => -a_D_mag * val);


        let a_T = a_star.map((val, i) => val - a_D[i]);
        let a_T_mag = Math.hypot(...a_T);
        let a_T_hat = a_T.map(val => val / a_T_mag);


        let C_D = a_D_mag / (this.K * v0_mag ** 2);
        let C_T = a_T_mag / (this.K * v0_mag ** 2);

        
        let costheta_s = Math.sqrt(1-this.eta_bar ** 2)
        let alpha = v0_hat[0] * Math.cos(this.phi) + v0_hat[2] * Math.sin(this.phi)
        let beta = v0_hat[1]
        let gamma = this.hand * costheta_s
        let rho = Math.sqrt(alpha ** 2 + beta ** 2)
        let chi = Math.atan2(beta, alpha)
        let theta = Math.asin(gamma/rho) - chi

        let omega_hat = [Math.sin(theta)*Math.cos(this.phi), Math.cos(theta), Math.sin(theta)*Math.sin(this.phi)]
        let eta = Math.hypot(...crossVectors(omega_hat, v0_hat))

        let a_L_hat = crossVectors(omega_hat, v0_hat).map(val => val / eta);
    
        let sgn = Math.sign(crossVectors(a_T_hat, a_L_hat)[1])

        let a_S_hat = crossVectors(v0_hat, crossVectors(omega_hat, v0_hat)).map(val => val / (sgn * eta));



        let theta_TL = Math.acos(dotVectors(a_L_hat, a_T_hat))

        let C_L = C_T * Math.cos(theta_TL)
        let C_S = C_T * Math.sin(theta_TL)

       

        this.C_T = C_T;
        this.C_D = C_D;
        this.C_L = C_L;
        this.C_S = C_S;

        this.omega_hat = omega_hat;
        this.sgn = sgn;
        this.theta = theta;
        this.eta = eta;

        this.v0_hat = v0_hat;
    }


    // Helper function for vector addition
  

    // Continue implementing other functions similarly...


     derivs(y) {


        let pos = y.slice(0, 3);
        let vel = y.slice(3, 6);

        if (this.constant_a) {
            return [vel[0], vel[1], vel[2], this.accel0[0], this.accel0[1], this.accel0[2]];
        }

        let v_mag = Math.hypot(...vel);
        let v_hat = vel.map(val => val / v_mag);

        let omega_cross_v = crossVectors(this.omega_hat, v_hat)
        let eta = Math.hypot(...omega_cross_v)
        let v_cross_omega_cross_v = crossVectors(v_hat, omega_cross_v).map(val => this.sgn * val)


        let a_D = v_hat.map(val => - val * this.C_D * this.K * (v_mag ** 2)) 
        let a_L = omega_cross_v.map(val => val *this.C_L * this.K * (v_mag ** 2) / eta)
        let a_S = v_cross_omega_cross_v.map(val => val * this.C_S * this.K * (v_mag ** 2) / eta)

        let a = addVectors(this.a_G, a_D)
        a = addVectors(a, a_L)
        a = addVectors(a, a_S)

        return [vel[0], vel[1], vel[2], a[0], a[1], a[2]];
    }

}






