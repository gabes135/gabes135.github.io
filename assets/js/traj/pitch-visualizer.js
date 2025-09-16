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

let pitch_state

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

function getDynamicInfo(row, IVB, HB) {

  let eta = Math.round(parseFloat(row[`eta_${row.pitch_type}`])*100) 
  let phi = Math.round(row.spin_axis)

  return `
      <h3 style="text-align: center;"><strong>Movement Information</strong></h3>
      <p><strong>Spin Rate:</strong> ${Math.round(row.release_spin_rate)} RPM</p>
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
  // const dateStr = yesterday.toISOString().split('T')[0];
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
  console.log("Dropdown config:", dropdownConfig);
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

function showRow(row, button) {
  const output = document.getElementById("output");
  const dynamic_output = document.getElementById("dynamic-output");
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


  pitch_state = plot_traj(row, true);
  animatePitch(pitch_state.omega_hat, parseFloat(row.release_spin_rate))

}


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

const cameraButton = document.getElementById('cameraButtonId');

cameraButton.addEventListener('click', reset_camera);

// -------------------------- Main initialization --------------------------
async function main() {
  await initDropdownConfig(); // ensures data_folder and dropdownConfig are ready
  createMenuBar();             // safe to use dropdownConfig now
}

// call main
main();
