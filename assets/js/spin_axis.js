
function dotVectors(v1, v2) {
    return v1.reduce((sum, val, i) => sum + val * v2[i], 0);
}


let x_sph = [];
let y_sph = [];
let z_sph = [];

let x_seam = [];
let y_seam = [];
let z_seam = [];

let theta = Math.PI / 80

let axis_x = []
let axis_y = []
let axis_z = []

let dx
let dy
let dz

let currentOmega = [0, 0, 1]; // default axis
let animationRunning = false;


function generateSphere(x_center, y_center, z_center, radius, resolution) {
    const u = Array.from({ length: resolution * 2 }, (_, i) => (i / (resolution * 2 - 1)) * 2 * Math.PI);
    const v = Array.from({ length: resolution }, (_, i) => (i / (resolution - 1)) * Math.PI);

    x_sph = []
    y_sph = []
    z_sph = []

    for (let i = 0; i < u.length; i++) {
        const rowX = [];
        const rowY = [];
        const rowZ = [];
        for (let j = 0; j < v.length; j++) {
            rowX.push(radius * Math.cos(u[i]) * Math.sin(v[j]) + x_center);
            rowY.push(radius * Math.sin(u[i]) * Math.sin(v[j]) + y_center);
            rowZ.push(radius * Math.cos(v[j]) + z_center);
        }
        x_sph.push(rowX);
        y_sph.push(rowY);
        z_sph.push(rowZ);
    }
    // return { X, Y, Z };
    // console.log('sphere 0', x_sph[0][0], y_sph[0][0],z_sph[0][0] )
}

function generateStich(radius, resolution) {
    const v = Array.from({ length: resolution }, (_, i) => (i / (resolution - 1)) * Math.PI);
    
    // poleX = [];
    // poleY = [];
    // poleZ = [];

    // for (let j = 0; j < 50; j++) {
    //     const v = (j / (50 - 1)) * Math.PI;
    //     poleX.push(radius * Math.cos(0) * Math.sin(v)); // cos(0) = 1
    //     poleY.push(radius * Math.sin(0) * Math.sin(v)); // sin(0) = 0
    //     poleZ.push(radius * Math.cos(v));
    // }


    const t = Array.from({length: resolution}, (_, i) => -Math.PI + 2 * Math.PI * i / (resolution-1));

    // Seam 1
    x_seam = [], y_seam = [], z_seam = [];
    t.forEach(tt => {
        let phi = (Math.PI / 2) * Math.cos(tt);
        x_seam.push(radius * Math.sin(tt) * Math.cos(phi));
        y_seam.push(radius * Math.sin(tt) * Math.sin(phi));
        z_seam.push(radius * Math.cos(tt));
    });
}

function rotateVec(vec, k, theta) {
    cosTheta = Math.cos(theta)
    sinTheta = Math.sin(theta)

    let temp_x = vec[0];
    let temp_y = vec[1];
    let temp_z = vec[2];

    let dot = dotVectors(k, [temp_x, temp_y, temp_z]);

    let crossX = k[1]*temp_z - k[2]*temp_y;
    let crossY = k[2]*temp_x - k[0]*temp_z;
    let crossZ = k[0]*temp_y - k[1]*temp_x;

    vec[0] = temp_x*cosTheta + crossX*sinTheta + k[0]*dot*(1-cosTheta);
    vec[1] = temp_y*cosTheta + crossY*sinTheta + k[1]*dot*(1-cosTheta);
    vec[2] = temp_z*cosTheta + crossZ*sinTheta + k[2]*dot*(1-cosTheta);

    return vec
    
}

function alignSphere(omega_hat){

    
    // 180/Math.PI 

    // console.log("omega_hat= ", omega_hat)
    let alpha = [-omega_hat[1], omega_hat[0], 0]
    let norm = Math.hypot(...alpha);
    if (norm == 0) {
        return
    }
    alpha = alpha.map(v => v / norm);

    let phi = Math.acos(omega_hat[2])

    let new_vec = []
    for (let i = 0; i < x_sph.length; i++) {
      for (let j = 0; j < x_sph[i].length; j++) {

          new_vec = rotateVec([x_sph[i][j], y_sph[i][j], z_sph[i][j]], alpha, phi)
          
          x_sph[i][j] = new_vec[0]
          y_sph[i][j] = new_vec[1]
          z_sph[i][j] = new_vec[2]
      }
    }

    for (let i = 0; i < x_seam.length; i++) {

        new_vec = rotateVec([x_seam[i], y_seam[i], z_seam[i]], alpha, phi)

        x_seam[i] = new_vec[0]
        y_seam[i] = new_vec[1]
        z_seam[i] = new_vec[2]
        }

    axis_x = [-omega_hat[0]*1.2, omega_hat[0]*1.2]
    axis_y = [-omega_hat[1]*1.2, omega_hat[1]*1.2]
    axis_z = [-omega_hat[2]*1.2, omega_hat[2]*1.2]

    dx = axis_x[1]
    dy = axis_y[1]
    dz = axis_z[1];
    let mag = Math.sqrt(dx*dx + dy*dy + dz*dz);
    let scale = 0.1;
    dx = (dx/mag) * scale;
    dy = (dy/mag) * scale;
    dz = (dz/mag) * scale;
}

function rotateSphere(omega_hat){
    // console.log('Theta:', theta)
    // cosTheta = Math.cos(theta)
    // sinTheta = Math.sin(theta)
    let new_vec = []
    // for (let i = 0; i < x_sph.length; i++) {
    //   for (let j = 0; j < x_sph[i].length; j++) {

    //       new_vec = rotateVec([x_sph[i][j], y_sph[i][j], z_sph[i][j]], omega_hat, theta)
          
    //       x_sph[i][j] = new_vec[0]
    //       y_sph[i][j] = new_vec[1]
    //       z_sph[i][j] = new_vec[2]
    //   }
    // }
    
    for (let i = 0; i < x_seam.length; i++) {

        new_vec = rotateVec([x_seam[i], y_seam[i], z_seam[i]], omega_hat, theta)

        x_seam[i] = new_vec[0]
        y_seam[i] = new_vec[1]
        z_seam[i] = new_vec[2]
        }

    for (let i = 0; i < axis_x.length; i++) {

        new_vec = rotateVec([axis_x[i], axis_y[i], axis_z[i]], omega_hat, theta)

        axis_x[i] = new_vec[0]
        axis_y[i] = new_vec[1]
        axis_z[i] = new_vec[2]
        }
    
}



function update() {
    rotateSphere(currentOmega);

    // Compute arrow vector
    

    Plotly.restyle('spin_axis_plot', {
        x: [x_sph, x_seam, axis_x, [axis_x[1]]],
        y: [y_sph, y_seam, axis_y, [axis_y[1]]],
        z: [z_sph, z_seam, axis_z, [axis_z[1]]],
        u: [[dx]],
        v: [[dy]],
        w: [[dz]]
    });

    animationFrameId = requestAnimationFrame(update);
}


function animatePitch(omega_hat, omega_mag){
    // omega_hat = [1/Math.sqrt(2), 0, 1/Math.sqrt(2)]
    theta = ((omega_mag * 0.10472)  / 60) * .04
    currentOmega = omega_hat; // overwrite global axis

    // const { X, Y, Z } = 
    generateSphere(0, 0, 0, 1, 20); // Center (0,0,0), radius 1, resolution 50
    generateStich(1.01, 50)
    alignSphere([0, 0, 1])
    alignSphere(currentOmega)

    const sphere = {
        type: 'surface',
        x: x_sph,
        y: y_sph,
        z: z_sph,
        opacity: .9,
        showscale: false,
        hoverinfo: 'none',
        colorscale: [[0, '#FFFFFA'], [1, '#FFFFFA']], // solid white
        cmin: 0,
        cmax: 1,
        lighting: {
            // Ambient light with no shadows
            ambient: .8, 
            diffuse: .3,
            fresnel: .1,
            specular: 0,
            roughness: 0
          }
        // Optional: set a colorscale
    };

    const seamLine = {
        type: 'scatter3d',
        mode: 'lines',
        x: x_seam,
        y: y_seam,
        z: z_seam,
        line: { color: 'red', width: 4 }, // make it visible
        hoverinfo: 'none'
    };

    const spinAxisVec = {
        type: 'scatter3d',
        mode: 'lines',
        x: axis_x,
        y: axis_y,
        z: axis_z,
        line: { color: 'black', width: 6 }, // make it visible
        hoverinfo: 'none'
    };

    dx = axis_x[1];
    dy = axis_y[1];
    dz = axis_z[1];

    // normalize
    let mag = Math.sqrt(dx*dx + dy*dy + dz*dz);
    dx /= mag;
    dy /= mag;
    dz /= mag;

    // scale by fixed arrowhead length (say 0.3)
    let scale = 0.1;
    dx *= scale;
    dy *= scale;
    dz *= scale;

    const arrowHead = {
        type: "cone",
        x: [axis_x[1]],
        y: [axis_y[1]],
        z: [axis_z[1]],              // base of cone at the tip of axis
        u: [dx],
        v: [dy],
        w: [dz],            // direction (pointing +z)
        anchor: "tail",
        showscale: false,
        sizemode: "absolute",
        sizeref: .25,
        colorscale: [[0, "black"], [1, "black"]]
      };

    const axisSettings = {
          showgrid: false,
          showline: false,
          zeroline: false,
          showticks: false,
          showticklabels: false,
          visible: false
        };

    const layout = {
        margin: {
            l: 0,  // left
            r: 0,  // right
            t: 0,  // top
            b: 0   // bottom
        },
        showlegend : false,
        scene: {
            xaxis: { ...axisSettings, range: [1.3, -1.3]},
            yaxis: { ...axisSettings, range: [1.3, -1.3]},
            zaxis: { ...axisSettings, range: [-1.3, 1.3]},
            aspectmode: 'cube', // Ensures equal scaling for axes
            camera: {
            eye: {x: 0, y: 2, z: 0},   // move the camera along +Y
            up: {x: 0, y: 0, z: 1}     // Z points up
        }
        }
    };


    Plotly.newPlot('spin_axis_plot', [sphere, seamLine, spinAxisVec, arrowHead], layout);
    // Plotly.newPlot('spin_axis', [...sphere, ...poleLine], layout);

    if (!animationRunning) {
        animationRunning = true;
        requestAnimationFrame(update);
    }

}










