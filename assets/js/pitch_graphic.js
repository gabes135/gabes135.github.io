


let data = [];
let pitch_state; // Declare globally
let solver


const pitchNames = {
  FF: 'Four-Seam Fastball',
  FT: 'Two-Seam Fastball',
  SI: 'Sinker',
  SL: 'Slider',
  CU: 'Curveball',
  CH: 'Changeup',
  KC: 'Knuckle Curve',
  EP: 'Eephus',
  SC: 'Screwball',
  KN: 'Knuckleball',
  FS: 'Splitter',
  ST: 'Sweeper',
  UN: 'Unknown'
};

function getPitchName(code) {
  return pitchNames[code] || 'Unknown Pitch';
}


function toggleDropdown(name) {
  document.getElementById(name).classList.toggle("show");
}

function showRow(row, button) {
  let output = document.getElementById("output");
  // output.innerHTML = `<pre>${JSON.stringify(row, null, 2)}</pre>`;
  pitch_state = new PitchState(row);
  let sz_b = row['sz_bot'] 
  let sz_t = row['sz_top']
  var solver = new ODEsolver(pitch_state.derivs.bind(pitch_state), pitch_state.initial_conditions, 0, 1)
  data = calcOdeRK4(solver, 10000)

  pitch_state_nospin = new PitchState(row, 0);
  var solver_nospin = new ODEsolver(pitch_state_nospin.derivs.bind(pitch_state_nospin), pitch_state_nospin.initial_conditions, 0, 1)
  data_nospin = calcOdeRK4(solver_nospin, 10000)

  for (let i = 1; i <= 3; i++) {
  if (data[i]) {
    data[i] = data[i].map((val) => val / 0.3048);
    data_nospin[i] = data_nospin[i].map((val) => val / 0.3048);
  }
  };
  // const ivbIn = (parseFloat(row.pfx_z) * 12).toFixed(1);

  let hand = row.p_throws 
  let IVB = (parseFloat(row.pfx_z) * 12).toFixed(2)
  let HB = (parseFloat(row.pfx_x) * 12).toFixed(2)

  let rowInfo = `
      <h3>Pitch Information</h3>
      <p><strong>Pitcher:</strong> ${row.player_name}</p>
      <p><strong>Pitch Type:</strong> ${getPitchName(row.pitch_type)}</p>
      <p><strong>Release Speed:</strong> ${row.release_speed} MPH</p>
      <p><strong>Spin Rate:</strong> ${row.release_spin_rate} RPM</p>
      <p><strong>Induced Vertical Break:</strong> ${IVB} in.</p>
      <p><strong>Horizontal Break:</strong> ${HB} in.</p>
    `
  console.log(button)
  console.log(rowInfo)

  
  // Insert the row data into the "output" div
  output.innerHTML = rowInfo;

console.log(data)

// Helpers
const makeLineTrace = (x, y, z, color, width = 4, opacity = 1) => ({
  x, y, z,
  type: 'scatter3d',
  mode: 'lines',
  hoverinfo: 'none',
  line: { color, width, opacity }
});

const makeMarkerTrace = (x, y, z, color, size) => ({
  x, y, z,
  type: 'scatter3d',
  mode: 'markers',
  hoverinfo: 'none',
  marker: { color, size }
});

// Pitch paths
const pitch = makeLineTrace(data[1], data[2], data[3], 'black');
const pitch_nospin = makeLineTrace(data_nospin[1], data_nospin[2], data_nospin[3], 'rgba(0, 0, 0, 0.33)');

// Start and end points
const start = makeMarkerTrace([data[1][0]], [data[2][0]], [data[3][0]], 'red', 3);
const end = makeMarkerTrace(
  [data[1].at(-2)], [data[2].at(-2)], [data[3].at(-2)],
  'blue', 5
);
const end_nospin = makeMarkerTrace(
  [data_nospin[1].at(-2)], [data_nospin[2].at(-2)], [data_nospin[3].at(-2)],
  'rgba(0, 0, 255, 0.33)', 5
);

// Movement line
const diff = makeLineTrace(
  [data_nospin[1].at(-2), data[1].at(-2), data[1].at(-2)],
  [data_nospin[2].at(-2), data[2].at(-2), data[2].at(-2)],
  [data_nospin[3].at(-2), data_nospin[3].at(-2), data[3].at(-2)],
  'rgba(255, 0, 0, .75)'
);

// Strike zone
const kzone = {
  x: [-0.71, 0.71, 0.71, -0.71, -0.71],
  z: [sz_b, sz_b, sz_t, sz_t, sz_b],
  y: [0, 0, 0, 0, 0],
  i: [0, 0],
  j: [1, 2],
  k: [2, 3],
  type: 'mesh3d',
  opacity: 0.2,
  color: 'rgba(0, 0, 0, 0.4)',
  showscale: false,
  hoverinfo: 'skip'
};

// Home plate and mound
const makeFlatPatch = (x, y, fillcolor) => ({
  x, y, z: x.map(() => 0),
  type: 'scatter3d',
  mode: 'lines',
  fill: 'toself',
  fillcolor,
  line: { color: 'black', width: 2 },
  hoverinfo: 'none',
  showlegend: false
});

const plate = makeFlatPatch(
  [-0.7083, 0.7083, 0.7083, 0.0000, -0.7083, -0.7083],
  [0.0000, 0.0000, -0.7083, -1.4167, -0.7083, 0.0000],
  'rgba(128,128,128,1)'
);

const mound = makeFlatPatch(
  [-1, -1, 1, 1, -1],
  [59.75, 60.25, 60.25, 59.75, 59.75],
  'rgba(128,128,128,1)'
);




const diamond = {
  type: 'mesh3d',
  x: [0, 90, 0, -90, 0],     // Home, 1B, 2B, 3B, back to home (feet)
  y: [0, 90, 180, 90, 0],    // Base path extends up to center field
  z: [0, 0, 0, 0, 0],        // Ground level
  color: 'lightgreen',
  opacity: 0.2,
  i: [0, 1, 2, 3],           // Triangle indices
  j: [1, 2, 3, 0],
  k: [2, 3, 0, 1],
  showscale: false
};


// Camera logic
const x_cam = (hand === 'R') ? -0.2 : 0.2;

// Layout
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
    xaxis: { ...axisSettings, range: [-8, 8] },
    yaxis: { ...axisSettings, range: [-10, 200] },
    zaxis: { ...axisSettings, range: [0, 8] },
    camera: {
      up: { x: 0, y: 0, z: 1 },
      center: {
        x: 0.18832285644344102,
        y: 39.99890022636506,
        z: -0.06831888029628559
      },
      eye: {
      x: x_cam,
    y: -1.637214217816883,
    z: -0.01863377952756322
      },
      projection: {
        type: 'perspective'
      }
    },
    aspectmode: 'manual',
    aspectratio: { x: 2, y: 1, z: 1 }
  },
  margin: { t: 0, b: 0, l: 0, r: 0 },
  showlegend: false,
  dragmode: 'turntable',
  hovermode: false
};


// Plot
Plotly.newPlot('plot', [
  pitch, pitch_nospin, diff,
  start, end, end_nospin,
  kzone, plate, mound, diamond
], layout, { responsive: true });


const plot = document.getElementById("plot");

plot.on('plotly_relayout', function(eventdata){
  if (eventdata['scene.camera']) {
    console.log("Camera settings:", JSON.stringify(eventdata['scene.camera'], null, 2));
  }
});


function calcOdeRK4(solver, resolution) {
  const rk4res = solver.rk4(~~resolution);
  const times = rk4res.ts;
  const pos_x = rk4res.ys.map(y => y[0]); 
  const pos_y = rk4res.ys.map(y => y[1]); 
  const pos_z = rk4res.ys.map(y => y[2]); 


  return [times, pos_x, pos_y, pos_z];
}};



const datasets = {}; // stores data separately for each button

function parse_csv(button, file) {
  Papa.parse(file, {
    download: true,
    header: true,
    complete: function(results) {
      datasets[button] = results.data; // save to button-specific slot

      const dropdown = document.getElementById(button);
      dropdown.innerHTML = "";

      datasets[button].forEach((row, index) => {
        const a = document.createElement("a");
        const name = row.player_name;

        let len = "";
        let text = "";
        if (button == "myDropdown_x") {
          len = (parseFloat(row.pfx_x) * 12).toFixed(1);
          text = "HB";
        } else {
          len = (parseFloat(row.pfx_z) * 12).toFixed(1);
          text = "IVB";
        }

        let formattedName = name;
        if (typeof name === "string" && name.includes(",")) {
          const [last, first] = name.split(',').map(s => s.trim());
          formattedName = `${first} ${last}`;
        }

        a.textContent = `${formattedName} - ${row.release_speed} MPH ${row.pitch_type} - ${text}: ${len} in.` || `Row ${index}`;
        a.href = "#";
        a.dataset.index = index;
        a.addEventListener("click", function(e) {
          e.preventDefault();
          const idx = parseInt(this.dataset.index);
          showRow(datasets[button][idx], button); // use saved data
        });
        dropdown.appendChild(a);
      });

      if (datasets[button].length && button == "myDropdown_z") {
        showRow(datasets[button][0], button);
      }
    }
  });
}

parse_csv("myDropdown_z", "../assets/savant_data/data_z.csv");
parse_csv("myDropdown_x", "../assets/savant_data/data_x.csv");


// Close dropdown if user clicks outside
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    document.querySelectorAll(".dropdown-content").forEach(d => d.classList.remove('show'));
  }
};
