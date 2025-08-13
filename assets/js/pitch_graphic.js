


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


function toggleDropdown(dir) {
  if (dir == 'x') {
  document.getElementById("myDropdown_x").classList.toggle("show")

  document.querySelectorAll(".dropdown-content").forEach(d => document.getElementById("myDropdown_z").classList.remove('show'));
}
else {
 document.getElementById("myDropdown_z").classList.toggle("show")
 document.querySelectorAll(".dropdown-content").forEach(d => document.getElementById("myDropdown_x").classList.remove('show'));

}
}

function showRow(row, button) {
  let output = document.getElementById("output");
  document.getElementById("dateDisplay").innerText = `Last updated ${row.game_date}`;
  // output.innerHTML = `<pre>${JSON.stringify(row, null, 2)}</pre>`;
  
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

