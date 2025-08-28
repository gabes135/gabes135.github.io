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
        const phi = (Math.PI / 2) * Math.cos(t);
        const x = seamRadius * Math.sin(t) * Math.cos(phi);
        const y = seamRadius * Math.sin(t) * Math.sin(phi);
        const z = seamRadius * Math.cos(t);
        points.push(new BABYLON.Vector3(x, y, z));
    }


    seamMesh = BABYLON.MeshBuilder.CreateTube("tube", {path: points, radius: 0.02, updatable:true}, scene);
    const stringMat = new BABYLON.StandardMaterial("stringMat", scene);
    stringMat.diffuseColor = new BABYLON.Color3(1,0,0); // dark gray
    stringMat.specularColor = new BABYLON.Color3(0,0,0); // no shine
    // stringMat.emissiveColor = new BABYLON.Color3(0.1,0.1,0.1); // subtle glow

    seamMesh.material = stringMat

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

function generateVeloAxis(v0_hat) {

    points = []
    points.push(new BABYLON.Vector3(0, 0, 0));
    points.push(new BABYLON.Vector3(v0_hat[0]*1.3, v0_hat[1]*1.3, v0_hat[2]*1.3));


    veloMesh = BABYLON.MeshBuilder.CreateTube("axis", {path: points, radius: 0.04, updatable:true}, scene);
    veloMesh.material = new BABYLON.StandardMaterial("arrowMat", scene);
    veloMesh.material.diffuseColor = new BABYLON.Color3(0, 0, 1);
    veloMesh.material.specularColor = new BABYLON.Color3(0,0,0); // no shine


    // Arrowhead (cone)
    varrowMesh = BABYLON.MeshBuilder.CreateCylinder("arrow", { diameterTop: 0, diameterBottom: 0.2, height: 0.2 }, scene);
    varrowMesh.material = new BABYLON.StandardMaterial("arrowMat", scene);
    varrowMesh.material.diffuseColor = new BABYLON.Color3(0, 0, 1);
    varrowMesh.material.specularColor = new BABYLON.Color3(0,0,0); // no shine
 
    // Position arrow at the tip of the axis
    varrowMesh.position = points[1].clone();
    
    const axis_path = new BABYLON.Path3D(points);
    const curve = axis_path.getCurve(); // create the curve
    const tangents = axis_path.getTangents();  //array of tangents to the curve
    const normals = axis_path.getNormals(); //array of normals to the curve
    const binormals = axis_path.getBinormals(); //array of binormals to curve
    varrowMesh.rotation =  BABYLON.Vector3.RotationFromAxis(binormals[1], tangents[1], normals[1]);


}

// Rotate sphere along currentOmega
function rotateSeams(omega_mag) {
    const axis = new BABYLON.Vector3(currentOmega[0], currentOmega[1], currentOmega[2]);
    theta = -((omega_mag * 0.10472)  / 60) * .01
    seamMesh.rotate(axis, theta, BABYLON.Space.WORLD);

}

function updateAnimation(omega_hat) {

    axisMesh.dispose();
    seamMesh.dispose();

    points = [];
    const seamRadius = 1.01;
    for (let i = 0; i < 100; i++) {
        const t = -Math.PI + 2 * Math.PI * i / 99;
        const phi = (Math.PI / 2) * Math.cos(t);
        points.push(new BABYLON.Vector3(
            seamRadius * Math.sin(t) * Math.cos(phi),
            seamRadius * Math.sin(t) * Math.sin(phi),
            seamRadius * Math.cos(t)
        ));
    }
 
    seamMesh = BABYLON.MeshBuilder.CreateTube("tube", {path: points, radius: 0.02, updatable:true}, scene);
    seamMesh.material = new BABYLON.StandardMaterial("stringMat", scene);
    seamMesh.material.diffuseColor = new BABYLON.Color3(1,0,0);
    seamMesh.material.specularColor = new BABYLON.Color3(0,0,0);


   points = [
        new BABYLON.Vector3(-omega_hat[0]*1.2, -omega_hat[1]*1.2, -omega_hat[2]*1.2),
        new BABYLON.Vector3(omega_hat[0]*1.3, omega_hat[1]*1.3, omega_hat[2]*1.3)
    ];

    axisMesh = BABYLON.MeshBuilder.CreateTube("axis", { path: points, radius: 0.04 }, scene);
    axisMesh.material = new BABYLON.StandardMaterial("arrowMat", scene);
    axisMesh.material.diffuseColor = new BABYLON.Color3(0,0,0);

    
    arrowMesh.position = points[1].clone();
    const axis_path = new BABYLON.Path3D(points);
    const curve = axis_path.getCurve();
    const tangents = axis_path.getTangents();
    const normals = axis_path.getNormals();
    const binormals = axis_path.getBinormals();
    arrowMesh.rotation = BABYLON.Vector3.RotationFromAxis(binormals[1], tangents[1], normals[1]);
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
            rotateSeams(omega_mag);
        });

         initialized = true;
     }
     else{
        updateAnimation(currentOmega);
        
        engine.stopRenderLoop();
        engine.runRenderLoop(() => {
            scene.render();
            rotateSeams(omega_mag);
        });
     }

}


     // light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(currentOmega[0], currentOmega[1], currentOmega[2]), scene);

    // createAxes(1.2);
    // createAxisLabel("X", new BABYLON.Vector3(-1.5,0,0));
    // createAxisLabel("Y", new BABYLON.Vector3(0,1.5,0));
    // createAxisLabel("Z", new BABYLON.Vector3(0,0,1.5));


 










function createAxes(length = 1.5) {
    const sceneAxes = [];

    // X-axis (red)
    const xPoints = [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(-length, 0, 0)
    ];
    const xAxis = BABYLON.MeshBuilder.CreateTube("xAxis", { path: xPoints, radius: 0.01 }, scene);
    xAxis.color = new BABYLON.Color3(1, 0, 0);
    sceneAxes.push(xAxis);

    // Y-axis (green)
    const yPoints = [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(0, length, 0)
    ];
    const yAxis = BABYLON.MeshBuilder.CreateTube("yAxis", { path: yPoints, radius: 0.01 }, scene);
    yAxis.color = new BABYLON.Color3(0, 1, 0);
    sceneAxes.push(yAxis);

    // Z-axis (blue)
    const zPoints = [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(0, 0, length)
    ];
    const zAxis = BABYLON.MeshBuilder.CreateTube("zAxis", { path: zPoints, radius: 0.01 }, scene);
    zAxis.color = new BABYLON.Color3(0, 0, 1);
    sceneAxes.push(zAxis);

    return sceneAxes;
}

function createAxisLabel(text, position) {
    const plane = BABYLON.MeshBuilder.CreatePlane(text + "Plane", {size: 0.3}, scene);
    plane.position = position;

    const texture = new BABYLON.DynamicTexture(text + "Tex", {width:256, height:256}, scene);
    const mat = new BABYLON.StandardMaterial(text + "Mat", scene);
    mat.diffuseTexture = texture;
    mat.diffuseTexture.hasAlpha = true;
    plane.material = mat;

    const ctx = texture.getContext();
    ctx.clearRect(0,0,256,256);
    ctx.font = "bold 120px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 128);
    texture.update();

    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL; // always face camera
    return plane;
}


// Call after creating axes


// Call after creating your sphere


// Initialize

