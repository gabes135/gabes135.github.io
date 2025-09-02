let scene, engine, light;
let sphereMesh, seamMesh, axisMesh, arrowMesh, veloMesh, varrowMesh;
let currentOmega = [0, 0, 1];
let theta, points; // rotation per frame
let initialized = false;

// Initialize Babylon scene
function initBabylon() {
    const canvas = document.getElementById("spin_axis_plot");
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);



     const camera = new BABYLON.ArcRotateCamera(
        "camera",
        Math.PI/2,    // alpha: rotate around Y to point along +Y
        Math.PI,     // beta: vertical angle so camera is level with X-Z plane
        4,               // radius (distance from target)
        new BABYLON.Vector3(0, 0, 0), // target
        scene
    );
    camera.attachControl(canvas, true);
    camera.inputs.removeByType("ArcRotateCameraPointersInput"); // disables mouse drag rotation
    camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput"); // optional: disable keyboard rotation
    camera.lowerRadiusLimit = camera.radius;
    camera.upperRadiusLimit = camera.radius;

    // Lighting
    light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 1), scene);

    scene.clearColor = new BABYLON.Color3(1, 1, 1); // RGB each 0–1


    window.addEventListener("resize", () => engine.resize());
}


function generateSphere() {
    // Sphere (base)
    sphereMesh = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 30 }, scene);
    const sphereMat = new BABYLON.StandardMaterial("sphereMat", scene);
    sphereMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    sphereMat.specularColor = new BABYLON.Color3(0, 0, 0);
    sphereMesh.material = sphereMat;
}

// Generate seam points
function generateSeam(resolution = 100) {
    points = [];
    let seamRadius = 1.01
    for (let i = 0; i < resolution; i++) {
        const t = -Math.PI + 2 * Math.PI * i / (resolution - 1);
        const x = seamRadius * Math.cos(t) ** 3;
        const y = seamRadius * Math.sin(t) ** 3;
        const z = seamRadius * (Math.sqrt(3) / 2) * Math.sin(2*t);
        points.push(new BABYLON.Vector3(x, y, z));
    }


    seamMesh = BABYLON.MeshBuilder.CreateTube("tube", {path: points, radius: 0.02, updatable:true}, scene);
    const stringMat = new BABYLON.StandardMaterial("stringMat", scene);
    stringMat.diffuseColor = new BABYLON.Color3(1,0,0); // dark gray
    stringMat.specularColor = new BABYLON.Color3(0,0,0); // no shine
    // stringMat.emissiveColor = new BABYLON.Color3(0.1,0.1,0.1); // subtle glow

    seamMesh.material = stringMat

    const axis = new BABYLON.Vector3(-0.3574, 0.8629, -0.3574);
    seamMesh.rotate(axis, 98.421*Math.PI/180, BABYLON.Space.WORLD)

}

function generateSpinAxis(omega_hat) {

    points = []
    points.push(new BABYLON.Vector3(-omega_hat[0]*1.2, -omega_hat[1]*1.2, -omega_hat[2]*1.2));
    points.push(new BABYLON.Vector3(omega_hat[0]*1.3, omega_hat[1]*1.3, omega_hat[2]*1.3));


    axisMesh = BABYLON.MeshBuilder.CreateTube("axis", {path: points, radius: 0.04, updatable:true}, scene);
    axisMesh.material = new BABYLON.StandardMaterial("arrowMat", scene);
    axisMesh.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    axisMesh.material.specularColor = new BABYLON.Color3(0,0,0); // no shine


    // Arrowhead (cone)
    arrowMesh = BABYLON.MeshBuilder.CreateCylinder("arrow", { diameterTop: 0, diameterBottom: 0.2, height: 0.2 }, scene);
    arrowMesh.material = new BABYLON.StandardMaterial("arrowMat", scene);
    arrowMesh.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    arrowMesh.material.specularColor = new BABYLON.Color3(0,0,0); // no shine
 
    // Position arrow at the tip of the axis
    arrowMesh.position = points[1].clone();
    
    const axis_path = new BABYLON.Path3D(points);
    const curve = axis_path.getCurve(); // create the curve
    const tangents = axis_path.getTangents();  //array of tangents to the curve
    const normals = axis_path.getNormals(); //array of normals to the curve
    const binormals = axis_path.getBinormals(); //array of binormals to curve
    arrowMesh.rotation =  BABYLON.Vector3.RotationFromAxis(binormals[1], tangents[1], normals[1]);


}


// Rotate sphere along currentOmega
function rotateSeams(omega_hat, omega_mag) {
    const axis = new BABYLON.Vector3(omega_hat[0], omega_hat[1], omega_hat[2]);
    theta = -((omega_mag * 0.10472)  / 60) * .01
    seamMesh.rotate(axis, theta, BABYLON.Space.WORLD);

}

function updateAnimation(omega_hat) {

    axisMesh.dispose();
    arrowMesh.dispose();
    seamMesh.dispose();


    generateSpinAxis(omega_hat)
    generateSeam()
}




// Animate pitch (public)
function animatePitch(omega_hat, omega_mag, v0_hat=[0, 0, 0]) {
    currentOmega = omega_hat.map((v,i) => i===0 ? -v : v)
    currentV0 = v0_hat.map((v,i) => i===0 ? -v : v)

    if (!initialized) {
        initBabylon();
        generateSeam();
        generateSphere();
        generateSpinAxis(currentOmega);
        // generateVeloAxis(currentV0);

        engine.runRenderLoop(() => {
            scene.render();
            rotateSeams(currentOmega, omega_mag);
        });

         initialized = true;
     }
     else{
        updateAnimation(currentOmega);
        
        engine.stopRenderLoop();
        engine.runRenderLoop(() => {
            scene.render();
            rotateSeams(currentOmega, omega_mag);
        });
     }

}


     // light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(currentOmega[0], currentOmega[1], currentOmega[2]), scene);

    // createAxes(1.2);
    // createAxisLabel("X", new BABYLON.Vector3(-1.5,0,0));
    // createAxisLabel("Y", new BABYLON.Vector3(0,1.5,0));
    // createAxisLabel("Z", new BABYLON.Vector3(0,0,1.5));


