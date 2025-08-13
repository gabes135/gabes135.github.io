// Helpers
function makeLineTrace(x, y, z, color, width = 4, opacity = 1, hover ='none', text='none') {
  return { x, y, z,
  type: 'scatter3d',
  mode: 'lines',
  hoverinfo: hover,
  text: text,
  line: { color, width, opacity }
};
}

function makeMarkerTrace(x, y, z, color, size,  hover ='none', text='none'){
  return { x, y, z,
  type: 'scatter3d',
  mode: 'markers',
  hoverinfo: hover,
  text: text,
  marker: { color, size }
};
}

function makeFlatPatch (x, y, fillcolor, width = 2){
  return { x, y, z: x.map(() => 0),
  type: 'scatter3d',
  mode: 'lines',
  fill: 'toself',
  fillcolor,
  line: { color: 'black', width: width },
  hoverinfo: 'none',
  showlegend: false
};
}

function makeSurface(x, y, z, fillcolor){
    return {
        x: x, y: y, z: z,
        i: [0, 0], j: [1, 2], k: [2, 3],
        type: 'mesh3d',
        color: fillcolor,
        showscale: false,
        hoverinfo: 'skip'
    };
}

function makeFlatCircle(cx, cy, r, fillcolor, segments = 64) {
  const x = [cx]; // center point
  const y = [cy];
  const z = [0];

  // perimeter points
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    x.push(cx + r * Math.cos(theta));
    y.push(cy + r * Math.sin(theta));
    z.push(0);
  }

  // Triangulation indices: center is 0
  const i = [], j = [], k = [];
  for (let p = 1; p <= segments; p++) {
    i.push(0);           // center
    j.push(p);           // current perimeter point
    k.push(p + 1);       // next perimeter point
  }

  return {
    type: 'mesh3d',
    x, y, z,
    i, j, k,
    color: fillcolor,
    flatshading: true,
    showscale: false
  };
}



function calcOdeRK4(solver, resolution) {
  const rk4res = solver.rk4(~~resolution);
  const times = rk4res.ts;
  const pos_x = rk4res.ys.map(y => y[0]); 
  const pos_y = rk4res.ys.map(y => y[1]); 
  const pos_z = rk4res.ys.map(y => y[2]); 


  return [times, pos_x, pos_y, pos_z];
}

let m_to_feet = 0.3048

let scale_factor = .05

m_to_feet = m_to_feet / scale_factor



// Main plotter
function plot_traj(row, button) {

    pitch_state = new PitchState(row);
    let sz_b = row['sz_bot'] 
    let sz_t = row['sz_top']

    let hand = row.p_throws
    let IVB = (parseFloat(row.pfx_z) * 12).toFixed(2)
    let HB = (parseFloat(row.pfx_x) * 12).toFixed(2)


    var solver = new ODEsolver(pitch_state.derivs.bind(pitch_state), pitch_state.initial_conditions, 0, 1)
    data = calcOdeRK4(solver, 10000)


    pitch_state_nospin = new PitchState(row, 0);
    var solver_nospin = new ODEsolver(pitch_state_nospin.derivs.bind(pitch_state_nospin), pitch_state_nospin.initial_conditions, 0, 1)
    data_nospin = calcOdeRK4(solver_nospin, 10000)


    // Feet
    for (let i = 1; i <= 3; i++) {
        if (data[i]) {
            data[i] = data[i].map((val) => val / m_to_feet);
            data_nospin[i] = data_nospin[i].map((val) => val / m_to_feet);
    }
    };

    // Pitch paths
    const pitch = makeLineTrace(data[1], data[2], data[3], 'black');
    const pitch_nospin = makeLineTrace(data_nospin[1], data_nospin[2], data_nospin[3], 'rgba(0, 0, 0, 0.33)');


    // Start and end points
    const start = makeMarkerTrace([data[1][0]], [data[2][0]], [data[3][0]], 'red', 3);
    const end = makeMarkerTrace(
      [data[1].at(-2)], [data[2].at(-2)], [data[3].at(-2)],
      'blue', 5,
      'text', 'With Spin'
    );
    const end_nospin = makeMarkerTrace(
      [data_nospin[1].at(-2)], [data_nospin[2].at(-2)], [data_nospin[3].at(-2)],
      'rgba(0, 0, 255, 0.33)', 5,
      'text', 'Without Spin'
    );

    // End point movement line
    let diff;
    if (data_nospin[3].at(-2) < data[3].at(-2)) {
      diff = makeLineTrace(
        [data_nospin[1].at(-2), data[1].at(-2), data[1].at(-2)],
        [data_nospin[2].at(-2), data[2].at(-2), data[2].at(-2)],
        [data_nospin[3].at(-2), data_nospin[3].at(-2), data[3].at(-2)],
        'rgba(255, 0, 0, .75)',
        4, 1,
        'text',
        `IVB: ${IVB} in., HB: ${HB} in.`);}
    else {
      diff = makeLineTrace(
        [data_nospin[1].at(-2), data_nospin[1].at(-2), data[1].at(-2)],
        [data_nospin[2].at(-2), data_nospin[2].at(-2), data[2].at(-2)],
        [data_nospin[3].at(-2), data[3].at(-2), data[3].at(-2)],
        'rgba(255, 0, 0, .75)',
        4, 1,
        'text',
        `IVB: ${-IVB} in., HB: ${HB} in.`);}

    

    console.log([(data[1].at(-2)-data_nospin[1].at(-2))/scale_factor,  HB/12])


    const kzone = makeSurface(
        [-0.71, 0.71, 0.71, -0.71, -0.71].map((val) => val * scale_factor),
        [.5, .5, .5, .5, .5].map((val) => val * scale_factor),
        [sz_b, sz_b, sz_t, sz_t, sz_b].map((val) => val * scale_factor),
         'rgba(0, 0, 0, 0.05)');

    const kzone_border = makeLineTrace(
        [-0.71, 0.71, 0.71, -0.71, -0.71].map((val) => val * scale_factor),
        [.5, .5, .5, .5, .5].map((val) => val * scale_factor),
        [sz_b, sz_b, sz_t, sz_t, sz_b].map((val) => val * scale_factor),
         'rgba(0, 0, 0, 0.75)');


    const plate = makeSurface(
        [-0.7083, 0.7083, 0.7083, 0.0000, -0.7083, -0.7083].map((val) => val * scale_factor),
        [0.0000, 0.0000, -0.7083, -1.4167, -0.7083, 0.0000].map((val) => val * scale_factor),
        [0.1, 0.1, 0.1, 0.1, 0.1, .1].map((val) => val * scale_factor),
         'rgba(128,128,128,1)');

    const rubber = makeSurface(
        [-1, -1, 1, 1, -1].map((val) => val * scale_factor),
        [59.75, 60.25, 60.25, 59.75, 59.75].map((val) => val * scale_factor),
        [0.1, 0.1, 0.1, 0.1, 0.1].map((val) => val * scale_factor),
         'rgba(128,128,128,1)');

   const mound =  makeFlatCircle(0, 60.5* scale_factor, 9 * scale_factor,
    'rgba(165,42,42,.1)', segments = 64)



    const root2 = Math.sqrt(2)/2


    x_1b = 90*root2
    y_1b = 90*root2
    x_3b = -90*root2
    y_3b = 90*root2
    x_2b = 0
    y_2b = 90*root2*2


    const diamond = makeSurface(
        [0, x_1b, x_2b, x_3b, 0].map((val) => val * scale_factor),
        [0, y_1b, y_2b, y_3b, 0].map((val) => val * scale_factor),
        [0, 0, 0, 0, 0].map((val) => val * scale_factor),
        'rgba(144,238,144,0.2)')
    
   

    const baseline = makeLineTrace(
        [0, x_1b, x_2b, x_3b, 0].map((val) => val * scale_factor), 
        [0, y_1b, y_2b, y_3b, 0].map((val) => val * scale_factor),
        [0, 0, 0, 0, 0].map((val) => val * scale_factor),
        'rgba(165,42,42,.2)', width = 12) 

    const first_base = makeSurface(
        [x_1b+(1.5*root2), x_1b, x_1b-(1.5*root2), x_1b, x_1b + (1.5*root2)].map((val) => val * scale_factor),
        [y_1b, y_1b+(1.5*root2), y_1b, y_1b-(1.5*root2), y_1b].map((val) => val * scale_factor),
        [0, 0, 0, 0, 0].map((val) => val * scale_factor),
         'rgba(128,128,128,1)');
    const third_base = makeSurface(
        [x_3b+(1.5*root2), x_3b, x_3b-(1.5*root2), x_3b, x_3b + (1.5*root2)].map((val) => val * scale_factor),
        [y_3b, y_3b+(1.5*root2), y_3b, y_3b-(1.5*root2), y_3b].map((val) => val * scale_factor),
        [0, 0, 0, 0, 0].map((val) => val * scale_factor),
         'rgba(128,128,128,1)');
    const second_base = makeSurface(
        [x_2b+(1.5*root2), x_2b, x_2b-(1.5*root2), x_2b, x_2b + (1.5*root2)].map((val) => val * scale_factor),
        [y_2b, y_2b+(1.5*root2), y_2b, y_2b-(1.5*root2), y_2b].map((val) => val * scale_factor),
        [0, 0, 0, 0, 0].map((val) => val * scale_factor),
         'rgba(128,128,128,1)');





    const x_cam = (hand === 'R') ? -0.1* scale_factor : 0.1;

    const axisSettings = {
      showgrid: false,
      showline: false,
      zeroline: false,
      showticks: false,
      showticklabels: false,
      visible: false
    };

    const layout = {
      scene: {
        xaxis: { ...axisSettings, range: [-70, 70].map((val) => val * scale_factor) },
        yaxis: { ...axisSettings, range: [-5, 130].map((val) => val * scale_factor) },
        zaxis: { ...axisSettings, range: [-1, 7].map((val) => val * scale_factor) },
        camera: {
          up: { x: 0, y: 0, z: 1 },
          center: { x: 0, y: 30* scale_factor, z: 0* scale_factor },
          eye: {
          x: x_cam, //x_cam,
          // y:  -2.161553507271113,
          // z: -0.12239219379599968
          y:  -2,
          z: .1
          },
          projection: {
            type: 'perspective'
          }
        },
        aspectmode: 'manual',
        aspectratio: { x: 20, y: 1.5, z: 1 }
      },
      margin: { t: 0, b: 0, l: 0, r: 0 },
      showlegend: false,
      dragmode: 'turntable',
      hovermode: true
    };




    // Plot
    Plotly.newPlot('plot', [
      pitch, pitch_nospin, diff,
      start, end, end_nospin,
      kzone, kzone_border, plate, rubber, mound, diamond,
      baseline,
      first_base, third_base, second_base
    ], layout, { responsive: true });


    const plot = document.getElementById("plot");

    plot.on('plotly_relayout', function(eventdata){
      if (eventdata['scene.camera']) {
        console.log("Camera settings:", JSON.stringify(eventdata['scene.camera'], null, 2));
      }
    });


    // 

}



