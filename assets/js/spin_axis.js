
function dotVectors(v1, v2) {
    return v1.reduce((sum, val, i) => sum + val * v2[i], 0);
}


let x_sph = [];
let y_sph = [];
let z_sph = [];

let poleX = [];
let poleY = [];
let poleZ = [];

let theta = Math.PI / 80

let axis_x = []
let axis_y = []
let axis_z = []

let currentOmega = [0, 0, 1]; // default axis


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
    console.log('sphere 0', x_sph[0][0], y_sph[0][0],z_sph[0][0] )
}

function generateStich(x_center, y_center, z_center, radius, resolution) {
    const v = Array.from({ length: resolution }, (_, i) => (i / (resolution - 1)) * Math.PI);
    
    poleX = [];
    poleY = [];
    poleZ = [];

    for (let j = 0; j < 50; j++) {
        const v = (j / (50 - 1)) * Math.PI;
        poleX.push(radius * Math.cos(0) * Math.sin(v)); // cos(0) = 1
        poleY.push(radius * Math.sin(0) * Math.sin(v)); // sin(0) = 0
        poleZ.push(radius * Math.cos(v));
    }
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
    console.log("omega_hat= ", omega_hat)
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

    for (let i = 0; i < poleX.length; i++) {

        new_vec = rotateVec([poleX[i], poleY[i], poleZ[i]], alpha, phi)

        poleX[i] = new_vec[0]
        poleY[i] = new_vec[1]
        poleZ[i] = new_vec[2]
        }

    axis_x = [-omega_hat[0]*1.5, omega_hat[0]*1.5]
    axis_y = [-omega_hat[1]*1.5, omega_hat[1]*1.5]
    axis_z = [-omega_hat[2]*1.5, omega_hat[2]*1.5]
}

function rotateSphere(omega_hat){
    // console.log('Theta:', theta)
    // cosTheta = Math.cos(theta)
    // sinTheta = Math.sin(theta)
    let new_vec = []
    for (let i = 0; i < x_sph.length; i++) {
      for (let j = 0; j < x_sph[i].length; j++) {

          new_vec = rotateVec([x_sph[i][j], y_sph[i][j], z_sph[i][j]], omega_hat, theta)
          
          x_sph[i][j] = new_vec[0]
          y_sph[i][j] = new_vec[1]
          z_sph[i][j] = new_vec[2]
      }
    }
    
    for (let i = 0; i < poleX.length; i++) {

        new_vec = rotateVec([poleX[i], poleY[i], poleZ[i]], omega_hat, theta)

        poleX[i] = new_vec[0]
        poleY[i] = new_vec[1]
        poleZ[i] = new_vec[2]
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

    Plotly.animate('spin_axis_plot', {
        data: [
            { x: x_sph, y: y_sph, z: z_sph }, // 2D arrays
            { x: poleX, y: poleY, z: poleZ }  // 1D arrays
        ]
    }, {
        transition: { duration: 0 },
        frame: { duration: 0, redraw: true }
    });


    requestAnimationFrame(update);
}

function animatePitch(omega_hat){

    currentOmega = omega_hat; // overwrite global axis

    // const { X, Y, Z } = 
    generateSphere(0, 0, 0, 1, 50); // Center (0,0,0), radius 1, resolution 50
    generateStich(0, 0, 0, 1.01, 50)
    alignSphere([0, 0, 1])
    alignSphere(currentOmega)

    const sphere = [{
        type: 'surface',
        x: x_sph,
        y: y_sph,
        z: z_sph,
        opacity: .5,
        showscale: false,
        hoverinfo: 'none',
        colorscale: [[0, 'white'], [1, 'white']], // solid white
        cmin: 0,
        cmax: 1
        // Optional: set a colorscale
    }];

    const poleLine = [{
        type: 'scatter3d',
        mode: 'lines',
        x: poleX,
        y: poleY,
        z: poleZ,
        line: { color: 'red', width: 4 }, // make it visible
        hoverinfo: 'none'
    }];

    const spinAxisVec = [{
        type: 'scatter3d',
        mode: 'lines',
        x: axis_x,
        y: axis_y,
        z: axis_z,
        line: { color: 'black', width: 6 }, // make it visible
        hoverinfo: 'none'
    }];

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
            xaxis: { ...axisSettings, range: [-1.2, 1.2]},
            yaxis: { ...axisSettings, range: [-1.2, 1.2]},
            zaxis: { ...axisSettings, range: [-1.2, 1.2]},
            aspectmode: 'cube', // Ensures equal scaling for axes
            camera: {
            eye: {x: 0, y: 2, z: 0},   // move the camera along +Y
            up: {x: 0, y: 0, z: 1}     // Z points up
        }
        }
    };


    Plotly.newPlot('spin_axis_plot', [...sphere, ...poleLine, ...spinAxisVec], layout);
    // Plotly.newPlot('spin_axis', [...sphere, ...poleLine], layout);


    requestAnimationFrame(update);

}










