// -------------------------- Global variables --------------------------
const button_ids = ["z_p", "z_n", "x_g", "x_a"];
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
  SV: 'Slurve',
  UN: 'Unknown'
};

let dropdownConfig = [];   // make globally accessible
let datasets = {};         // global datasets for each button
let data_folder = "";      // global data folder path

const spin_rate = document.getElementById("spin_rate");
const spin_rate_val = document.getElementById("spin_rate_value");

const spin_axis = document.getElementById("spin_axis");
const spin_axis_val = document.getElementById("spin_axis_value");

const efficiency = document.getElementById("efficiency");
const efficiency_val = document.getElementById("efficiency_value");



const A = 0.336;
const B = 6.041;
let pitch_state, data_nospin

const output = document.getElementById("output");
const dynamic_output = document.getElementById("dynamic-output");

// -------------------------- Utility functions --------------------------
function getPitchName(code) {
  return pitchNames[code] || 'Unknown Pitch';
}
function getStaticInfo(row) {

  const name = row.player_name;

  let formattedName = name;
  if (typeof name === "string" && name.includes(",")) {
    const [last, first] = name.split(',').map(s => s.trim());
    formattedName = `${first} ${last}`;
  }


  let eta = Math.round(parseFloat(row[`eta_${row.pitch_type}`])*100) 
  let phi = Math.round(row.spin_axis)


  return `
  <div class="pitch-info-boxes">
    <div class="info-box">
      <strong>Pitcher</strong>
      <div>${formattedName} (${row.p_throws})</div>
    </div>
    <div class="info-box">
      <strong>Pitch Type</strong>
      <div>${getPitchName(row.pitch_type)}</div>
    </div>
    <div class="info-box">
      <strong>Release Speed</strong>
      <div>${row.release_speed} MPH</div>
    </div>
  </div>
`;

}

function getDynamicInfo(row, IVB, HB, set_rpm=false, set_phi=false, set_eta=false) {

  const name = row.player_name;

  let formattedName = name;
  if (typeof name === "string" && name.includes(",")) {
    const [last, first] = name.split(',').map(s => s.trim());
    formattedName = `${first} ${last}`;
  }

  
  let rpm
  if (!set_rpm) {
    rpm = Math.round(row.release_spin_rate)
  }
  else{
    rpm = Math.round(set_rpm)
  }
  
  let phi
  if (!set_phi) {
    phi = Math.round(row.spin_axis)
  }
  else{
    phi = Math.round(set_phi)
  }



  let eta
  if (!set_eta) {
    eta = Math.round(parseFloat(row[`eta_${row.pitch_type}`])*100) 
  }
  else{
    eta = parseInt(set_eta*100)
  }
  
  return `
      <h3 style="text-align: center;"><strong>Movement Information</strong></h3>
      <p><strong>Spin Rate:</strong> ${Math.round(rpm)} RPM</p>
      <p><strong>Spin Axis:</strong> ${phi}&deg</p>
      <p><strong>Spin Efficiency:</strong> ${eta}%</p>
      <p><strong>Induced Vertical Break:</strong> ${IVB} in.</p>
      <p><strong>Horizontal Break:</strong> ${HB} in.</p>
    `;
}
// -------------------------- Async helpers --------------------------
async function fileExists(path) {
  try {
    const res = await fetch(path, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function getDataFolder() {

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  // const dateStr = yesterday.toString().split('T')[0];
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0'); // months are 0-based
  const day = String(yesterday.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;


  const dailyFolder = `../assets/savant_data/${dateStr}`;
  const backupFolder = "../assets/savant_data/backup";

  const exists = await fileExists(`${dailyFolder}/data_z_pos.csv`);
  return exists ? dailyFolder : backupFolder;
}

async function initDropdownConfig() {
  data_folder = await getDataFolder(); // update global folder

  dropdownConfig = [
    { id: "z_p", label: "Rise", csv: `${data_folder}/data_z_pos.csv` },
    { id: "z_n", label: "Drop", csv: `${data_folder}/data_z_neg.csv` },
    { id: "x_g", label: "Glove Side Break", csv: `${data_folder}/data_x_glove.csv` },
    { id: "x_a", label: "Arm Side Break", csv: `${data_folder}/data_x_arm.csv` }
  ];

  console.log("Using data folder:", data_folder);
}

// -------------------------- Dropdown and UI functions --------------------------
function createMenuBar() {
  const menuBar = document.getElementById("menu-bar");
  menuBar.innerHTML = ""; // clear previous content

  dropdownConfig.forEach(cfg => {
    const wrapper = document.createElement("div");
    wrapper.className = "dropdown";

    wrapper.innerHTML = `
      <button onclick="toggleDropdown('${cfg.id}')" class="dropbtn">
        ${cfg.label}
        <img src="../assets/images/down.png" alt="▼" style="width:20px; height:20px;
         vertical-align:middle;padding-bottom:4px; pointer-events: none;">
      </button>
      <div id="myDropdown_${cfg.id}" class="dropdown-content"></div>
    `;

    menuBar.appendChild(wrapper);

    // Load CSV for this dropdown
    parse_csv(`myDropdown_${cfg.id}`, cfg.csv);
  });
}

function toggleDropdown(id_show) {
  const clickedMenu = document.getElementById(`myDropdown_${id_show}`);
  const isOpen = clickedMenu.classList.contains('show');

  // Close all dropdowns
  button_ids.forEach(id => document.getElementById(`myDropdown_${id}`).classList.remove('show'));

  if (!isOpen) {
    clickedMenu.classList.add('show');
  }
}

// Close dropdown if user clicks outside
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn') && event.target.tagName !== 'INPUT') {
    document.querySelectorAll(".dropdown-content").forEach(d => d.classList.remove('show'));
  }
};


function filterFunction(button) {
  let input, filter, ul, li, a, i;
  input = document.getElementById(`myInput_${button}`);
  filter = input.value.toUpperCase();
  div = document.getElementById(button);
  a = div.getElementsByTagName("a");
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
}


function showRow(row, button) {
  if (data_folder == "../assets/savant_data/backup") {
    document.getElementById("dateDisplay").innerText = `Selection of pitches from ${row.game_date.slice(0, 4)} season`;
  }
  else {
    document.getElementById("dateDisplay").innerText = `Last updated ${row.game_date}`;

  }
  
  const IVB = (parseFloat(row.pfx_z) * 12).toFixed(2);
  const HB = Math.abs((parseFloat(row.pfx_x) * 12)).toFixed(2);


  output.innerHTML = getStaticInfo(row);
  dynamic_output.innerHTML = getDynamicInfo(row, IVB, HB);


  pitch_state = plot_traj(row, false);
  data_nospin = pitch_state.data_nospin


  // // Second trajectory plotted is no longer spinless, instead original to compare to edited
  // Plotly.restyle('plot', { x: [pitch_state.data_0[1]], y: [pitch_state.data_0[2]], z: [pitch_state.data_0[3]] }, 1);
  // Plotly.restyle('plot', { x: [[pitch_state.data_0[1].at(-2)]], y: [[pitch_state.data_0[2].at(-2)]], z: [[pitch_state.data_0[3].at(-2)]] }, 5);
  // const [x_diff, y_diff, z_diff] = generateDiff(pitch_state.data_0, pitch_state.data_0);
  // Plotly.restyle('plot', { x: [x_diff], y: [y_diff], z: [z_diff] }, 2);


 
  animatePitch(pitch_state.omega_hat, parseFloat(row.release_spin_rate), pitch_state.v0_hat)

  const spin_dir = (360 + ((180/Math.PI) * Math.atan2(pitch_state.omega_hat[2], pitch_state.omega_hat[0])))%360


  spin_rate.value = parseInt(row.release_spin_rate)
  spin_rate_val.innerHTML = `${parseInt(row.release_spin_rate)} RPM`;
  spin_rate.row = row;

  spin_axis.value = spin_dir
  spin_axis_val.innerHTML = `${parseInt(spin_dir)}&deg`;
  spin_axis.row = row;

  efficiency.value = parseFloat(pitch_state.eta*100)
  efficiency_val.innerHTML = `${parseInt(100*pitch_state.eta)}%`;
  efficiency.row = row;

  console.log('State:', pitch_state)
  // takeScreenShot()



}


function parse_csv(button, file) {
  Papa.parse(file, {
    download: true,
    header: true,
    complete: function(results) {
      datasets[button] = results.data;

      const dropdown = document.getElementById(button);
      dropdown.innerHTML = "";

      const t = document.createElement("input");
      t.type = "text";
      t.placeholder = "Search..."
      t.id=`myInput_${button}`
      t.onkeyup = () => filterFunction(button)
      dropdown.appendChild(t);

      datasets[button].forEach((row, index) => {
        const a = document.createElement("a");

        let len = "";
        let text = "";
        if (button == "myDropdown_x_g" || button == "myDropdown_x_a") {
          len = (parseFloat(row.pfx_x) * 12).toFixed(1);
          text = "HB";
        } else {
          len = (parseFloat(row.pfx_z) * 12).toFixed(1);
          text = "IVB";
        }

        let formattedName = row.player_name;
        if (typeof formattedName === "string" && formattedName.includes(",")) {
          const [last, first] = formattedName.split(',').map(s => s.trim());
          formattedName = `${first} ${last}`;
        }

        a.textContent = `${formattedName} - ${row.pitch_type} - ${text}: ${len} in.`;
        a.href = "#";
        a.dataset.index = index;
        a.addEventListener("click", function(e) {
          e.preventDefault();
          const idx = parseInt(this.dataset.index);
          showRow(datasets[button][idx], button);
        });
        dropdown.appendChild(a);
      });

      if (datasets[button].length && button == "myDropdown_z_p") {
        showRow(datasets[button][0], button);
      }
    }
  });
}

// -------------------------- Slider Updates --------------------------


function get_theta(eta, phi, v0_hat, hand){
  let costheta_s = Math.sqrt(1-eta ** 2)
  let alpha = pitch_state.v0_hat[0] * Math.cos(pitch_state.phi) + pitch_state.v0_hat[2] * Math.sin(pitch_state.phi)
  let beta = pitch_state.v0_hat[1]
  let gamma = pitch_state.hand * costheta_s
  let rho = Math.sqrt(alpha ** 2 + beta ** 2)
  let chi = Math.atan2(beta, alpha)
  return  Math.asin(gamma/rho) - chi
}

function updatePitchPlot() {


    // Read slider values
    const spinVal = parseFloat(spin_rate.value);
    const phiVal = parseFloat(spin_axis.value);
    const etaVal = parseFloat(efficiency.value)*.01;

    // Update display text
    spin_rate_val.innerHTML = `${spinVal} RPM`;
    spin_axis_val.innerHTML = `${parseInt(phiVal)}&deg`;
    efficiency_val.innerHTML = `${parseInt(100*etaVal)}%`;



    // Compute f_L based on spin rate
    const ratio = spinVal / spin_rate.row['release_spin_rate'];

    const S = (1/B) * Math.log(A/(A-pitch_state.C_T))
    const S_prime = S * ratio;
    const C_T_prime = A * (1 - Math.exp(-B * S_prime));
    const f_L = C_T_prime / pitch_state.C_T;

    let phiRad = (Math.PI/180) * phiVal
    let theta = get_theta(etaVal, phiRad, pitch_state.v0_hat, pitch_state.hand)
    let omega_hat_prime = [Math.sin(theta)*Math.cos(phiRad),
                       Math.cos(theta),
                       Math.sin(theta)*Math.sin(phiRad)]
    

    animatePitch(omega_hat_prime, spinVal, pitch_state.v0_hat)
    
    
    // Recalculate trajectory
    const pitch_state_prime = recalcTraj(spin_rate.row, f_L, omega_hat_prime);
    data_prime = pitch_state_prime.data


    //  change this if changed in plotter.js
    let IVB = (Math.abs(data_prime[3].at(-2) - data_nospin[3].at(-2))*(12/pitch_state.scale_factor)).toFixed(2)
    let HB = (Math.abs(data_prime[1].at(-2) - data_nospin[1].at(-2))*(12/pitch_state.scale_factor)).toFixed(2)



    dynamic_output.innerHTML = getDynamicInfo(spin_rate.row, IVB, HB, spinVal, phiVal, etaVal);
}


function trackSliderChange(slider, label) {
  slider.onchange = function(e) {
    if (typeof gtag === 'function') {
      gtag('event', 'slider_change', {
        event_category: 'editor_sliders',
        event_label: label,
        value: e.target.value
      });
    }
  }
}



// Attach same function to both sliders
spin_rate.oninput = updatePitchPlot;
spin_axis.oninput = updatePitchPlot;
efficiency.oninput = updatePitchPlot;

// Track slider action
trackSliderChange(spin_rate, 'Spin Rate');
trackSliderChange(spin_axis, 'Spin Axis');
trackSliderChange(efficiency, 'Efficiency');




const cameraButton = document.getElementById('cameraButtonId');
cameraButton.addEventListener('click', resetCamera);

const cameraDPButton = document.getElementById('cameraDPButtonId');
cameraDPButton.addEventListener('click', dpCamera);


async function main() {
  await initDropdownConfig(); // ensures data_folder and dropdownConfig are ready
  createMenuBar();             // safe to use dropdownConfig now
}

// call main
main();
