


let data = [];
let pitch_state; // Declare globally
let solver
let x_open
let z_open

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

const button_ids = ["z_p", "z_n", "x_g", "x_a"]

// const dropdownConfig = [
//   { id: "z_p", label: "Top Pitches by<br>Rise", csv: "../assets/savant_data/data_z_pos.csv" },
//   { id: "z_n", label: "Top Pitches by<br>Drop", csv: "../assets/savant_data/data_z_neg.csv" },
//   { id: "x_g", label: "Top Pitches by<br>Glove Side Break", csv: "../assets/savant_data/data_x_glove.csv" },
//   { id: "x_a", label: "Top Pitches by<br>Arm Side Break", csv: "../assets/savant_data/data_x_arm.csv" }
// ];

const dropdownConfig = [
  { id: "z_p", label: "Rise", csv: "../assets/savant_data/data_z_pos.csv" },
  { id: "z_n", label: "Drop", csv: "../assets/savant_data/data_z_neg.csv" },
  { id: "x_g", label: "Glove Side Break", csv: "../assets/savant_data/data_x_glove.csv" },
  { id: "x_a", label: "Arm Side Break", csv: "../assets/savant_data/data_x_arm.csv" }
];


function createMenuBar() {
  const menuBar = document.getElementById("menu-bar");

  dropdownConfig.forEach(cfg => {
    const wrapper = document.createElement("div");
    wrapper.className = "dropdown";

    wrapper.innerHTML = `
      <button onclick="toggleDropdown('${cfg.id}')" class="dropbtn">
        ${cfg.label}
        <img src="../assets/images/down.png" alt="▼" style="width:20px; height:20px; vertical-align:middle;padding-bottom:4px;">
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

  button_ids.forEach((id, i) =>  document.querySelectorAll(".dropdown-content").forEach(d => document.getElementById(`myDropdown_${id}`).classList.remove('show')))
  
  // document.getElementById(`myDropdown_${id_show}`).classList.toggle("show")
  if (!isOpen) {
    clickedMenu.classList.add('show');
  }


};

function showRow(row, button) {
  let output = document.getElementById("output");
  document.getElementById("dateDisplay").innerText = `Last updated ${row.game_date}`;
  // output.innerHTML = `<pre>${JSON.stringify(row, null, 2)}</pre>`;
  
  let hand = row.p_throws
  let IVB = (parseFloat(row.pfx_z) * 12).toFixed(2)
  let HB = (parseFloat(row.pfx_x) * 12).toFixed(2)

  let name = row.player_name
  let formattedName = name;
    if (typeof name === "string" && name.includes(",")) {
      const [last, first] = name.split(',').map(s => s.trim());
      formattedName = `${first} ${last}`;
    }

  let rowInfo = `
      <h3><strong>Pitch Information</strong></h3>
      <p><strong>Pitcher:</strong> ${formattedName} (${hand})</p>
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

  plot_traj(row, button)


};



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
        if (button == "myDropdown_x_g" || button == "myDropdown_x_a") {
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

        // a.textContent = `${formattedName} - ${row.release_speed} MPH ${row.pitch_type} - ${text}: ${len} in.` || `Row ${index}`;
        a.textContent = `${formattedName} - ${row.pitch_type} - ${text}: ${len} in.` || `Row ${index}`;
        a.href = "#";
        a.dataset.index = index;
        a.addEventListener("click", function(e) {
          e.preventDefault();
          const idx = parseInt(this.dataset.index);
          showRow(datasets[button][idx], button); // use saved data
        });
        dropdown.appendChild(a);
      });

      if (datasets[button].length && button == "myDropdown_z_p") {
        showRow(datasets[button][0], button);
      }
    }
  });
}


// Close dropdown if user clicks outside
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    document.querySelectorAll(".dropdown-content").forEach(d => d.classList.remove('show'));
  }
};


// parse_csv("myDropdown_z", "../assets/savant_data/data_z.csv");
// parse_csv("myDropdown_x", "../assets/savant_data/data_x.csv");
createMenuBar();

