// -------------------------- Global variables --------------------------
const button_ids = ["pid", "ptype", "date", "pitches"];
const pitchNames = {
  FF: 'Four-Seam Fastball',
  FC: 'Cutter',
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

let payload = {first_name: 'Tarik', last_name: 'Skubal', ptype: 'CH', start_date: '2025-09-28', end_date: '2025-10-01'} 
// {"first_name": "_", "last_name": "_", "ptype": "_", "start_date":"_", "end_date":"_"}

let pitch_state

let payloadDisplay = document.createElement("div");
payloadDisplay.id = "payload-display";
payloadDisplay.className = "payload-container";


function fillPayLoad(key, value) {
  payload[key] = value;
}

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

async function initDropdownConfig() {
  dropdownConfig = [
    { id: "pid", label: "Player Name", csv: "../assets/savant_data/eta.csv" },
  ];
}

// -------------------------- Dropdown and UI functions --------------------------
function createMenuBar() {

  const topRow = document.getElementById("menu-bar");
  const bottomRow = document.getElementById("menu-bar-bottom");

  topRow.innerHTML = "";    // clear previous content
  bottomRow.innerHTML = ""; // clear previous content


  const name_wrapper = document.createElement("div");
  name_wrapper.className = "dropdown";
  name_wrapper.innerHTML = `
    <button onclick="toggleDropdown('pid')" class="dropbtn">
      Player Name
      <img src="../assets/images/down.png" alt="▼" style="width:20px; height:20px;
       vertical-align:middle;padding-bottom:4px; pointer-events: none;">
    </button>
    <div id="myDropdown_pid" class="dropdown-content-search"></div>
  `;
  topRow.appendChild(name_wrapper);
  parse_eta("myDropdown_pid", "../assets/savant_data/eta.csv");




  const ptype_wrapper = document.createElement("div");
  ptype_wrapper.setAttribute("id", "ptypeMenu");
  ptype_wrapper.className = "dropdown";

  ptype_wrapper.innerHTML = `
    <button onclick="toggleDropdown('ptype')" class="dropbtn">
      Pitch Type:
      <img src="../assets/images/down.png" alt="▼" style="width:20px; height:20px;
       vertical-align:middle;padding-bottom:4px; pointer-events: none;">
    </button>
    <div id="myDropdown_ptype" class="dropdown-content-search"></div>
  `;
  topRow.appendChild(ptype_wrapper);


  const date_wrapper = document.createElement("div");
  date_wrapper.setAttribute("id", "date");
  date_wrapper.className = "dropdown";

  date_wrapper.innerHTML = `
    <button onclick="toggleDropdown('date')" class="dropbtn">
      Date:
      <img src="../assets/images/down.png" alt="▼" style="width:20px; height:20px;
       vertical-align:middle;padding-bottom:4px; pointer-events: none;">
    </button>
    <div id="myDropdown_date" class="dropdown-content-search"></div>
  `;
  topRow.appendChild(date_wrapper);

  const dropdownContainer = document.getElementById("myDropdown_date");
  const calendar = new dhx.Calendar(dropdownContainer, {
    dateFormat: "%Y-%m-%d",
    css: "dhx_widget--bordered",
    range: true
  });

  calendar.events.on("change", function () {
    const dates = calendar.getValue(); 
    [start, end] = dates;
    fillPayLoad("start_date", start)
    fillPayLoad("end_date", end)

    if (end !== undefined) {
        dropdownContainer.classList.remove("show");
      }


  });
  topRow.appendChild(payloadDisplay);




  const pitches_wrapper = document.createElement("div");
  pitches_wrapper.className = "dropdown";

    pitches_wrapper.innerHTML = `
      <button onclick="toggleDropdown('pitches')" class="dropbtn">
        Pitches
        <img src="../assets/images/down.png" alt="▼" style="width:20px; height:20px;
         vertical-align:middle;padding-bottom:4px; pointer-events: none;">
      </button>
      <div id="myDropdown_pitches" class="dropdown-content-pitches"></div>
    `;
    bottomRow.appendChild(pitches_wrapper);


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


window.addEventListener("click", function(event) {
  document.querySelectorAll(".dropdown-content-search, .dropdown-content-pitches").forEach(dropdown => {
    if (event.target.tagName === "A" && dropdown.contains(event.target)) {
      dropdown.classList.remove("show");
      displayPayload();
    }
    else if (!event.target.matches(".dropbtn") && !dropdown.contains(event.target)) {
      dropdown.classList.remove("show");
      displayPayload();
    }
  });
});



function selectPitcher(row, button){
  const dropdown = document.getElementById('myDropdown_ptype');
  dropdown.replaceChildren()

  const ptypeMenu = document.getElementById("ptypeMenu");
  let ptypes = Object.keys(row).filter(key => key.startsWith("eta_") && row[key] !== "").map(key => key.slice(4));
  let pnames = ptypes.map(p => getPitchName(p));

  pnames.forEach((value, index) => {
    const a = document.createElement("a");

    a.textContent = `${value}`;
    a.href = "#";
    a.dataset.index = index;
    a.addEventListener("click", function(e) {
      e.preventDefault();
      const idx = parseInt(this.dataset.index);
      fillPayLoad('ptype', ptypes[index])
     
    });
    dropdown.appendChild(a);
  });



}




function showRow(row, button) {
  const output = document.getElementById("output");
  const dynamic_output = document.getElementById("dynamic-output");
  
  console.log('row', row)  
  
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

function parse_query(button, data) {
  
      const dropdown = document.getElementById(button);
      dropdown.innerHTML = "";

      const t = document.createElement("input");
      t.type = "text";
      t.placeholder = "Search..."
      t.id=`myInput_${button}`
      t.onkeyup = () => filterFunction(button)
      dropdown.appendChild(t);

      data.forEach((row, index) => {
        const a = document.createElement("a");

        let len = "";
        let text = "";
       
        let HB = (parseFloat(row.pfx_x) * 12).toFixed(1);
        let IVB = (parseFloat(row.pfx_z) * 12).toFixed(1);
        let MPH =  parseFloat(row.release_speed).toFixed(1);
        let des = row.des
   
        a.textContent = `${des} | ${MPH} MPH | HB: ${HB} in. | IVB: ${IVB} in.`;
        a.href = "#";
        a.dataset.index = index;
        a.addEventListener("click", function(e) {
          e.preventDefault();
          const idx = parseInt(this.dataset.index);
          showRow(data[idx], button);
        });
        dropdown.appendChild(a);
      });

      if (data.length) {
        showRow(data[0], button);
      }
    }

function parse_eta(button, csv) {
  Papa.parse(csv, {
    download: true,
    header: true,
    complete: function(results) {
      eta = results.data;



      const dropdown = document.getElementById(button);
      dropdown.innerHTML = "";

      const t = document.createElement("input");
      t.type = "text";
      t.placeholder = "Search..."
      t.id=`myInput_${button}`
      t.onkeyup = () => filterFunction(button)
      dropdown.appendChild(t);

      eta.forEach((row, index) => {
        const a = document.createElement("a");

  

        let formattedName = row.entity_name;
        let last, first
        if (typeof formattedName === "string" && formattedName.includes(",")) {
          [last, first] = formattedName.split(',').map(s => s.trim());
          formattedName = `${first} ${last}`;
        }

        a.textContent = `${formattedName}`;
        a.href = "#";
        a.dataset.index = index;
        a.addEventListener("click", function(e) {
          e.preventDefault();
          const idx = parseInt(this.dataset.index);
          selectPitcher(eta[idx], button)
          fillPayLoad('first_name', first)
          fillPayLoad('last_name', last)
          fillPayLoad('ptype', '_')
          //getQuery(eta[idx], button)
          // showRow(datasets[button][idx], button);
        });
        dropdown.appendChild(a);
      });

      // if (eta.length && button == "myDropdown_pid") {
      //   selectPitcher(eta[0], button);
      // }
    }
  })
}


function displayPayload(){  
  payloadDisplay.innerHTML = `
      <span class="payload-name">${payload['first_name']} ${payload['last_name']}</span>
      <span class="payload-separator">|</span>
      <span class="payload-ptype">${payload['ptype']}</span>
      <span class="payload-separator">|</span>
      <span class="payload-dates">${payload['start_date']} → ${payload['end_date']}</span>
    `;

}


const queryBtn = document.querySelector(".query-btn");
const loadingIcon = document.getElementById("loadingIcon");


queryBtn.addEventListener("click", async function () {


  const payload_vals = Object.values(payload);

  if (typeof gtag === "function") {
    gtag("event", "button_click", {
      event_category: "search_button",
      event_label: payload.last_name
    });
  }

  const noEmpty = payload_vals.every(val => val !== "_");
  if (noEmpty) {
    const jsonQuery = await runQuery(payload);
    parse_query("myDropdown_pitches", jsonQuery)

  } else {
    console.log("Some fields are missing or empty.");
  }
});


async function runQuery(payload) {

    try {

        loadingIcon.classList.add("active");

        const response = await fetch("https://0inxxvmk0b.execute-api.us-east-2.amazonaws.com/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
        });
        const json = await response.json();
       

        return json;
    }
    catch (err) {
      console.log('Error: ' + err.message);
  } finally {
    // always hide icon when done (success or error)
    loadingIcon.classList.remove("active");
  }
}





const cameraButton = document.getElementById('cameraButtonId');
cameraButton.addEventListener('click', resetCamera);

const cameraDPButton = document.getElementById('cameraDPButtonId');
cameraDPButton.addEventListener('click', dpCamera);

// -------------------------- Main initialization --------------------------
async function main() {
  await initDropdownConfig() 
  createMenuBar();  
  displayPayload();   
  const jsonQuery = await runQuery(payload);
  parse_query("myDropdown_pitches", jsonQuery)       
}

// call main
main();
