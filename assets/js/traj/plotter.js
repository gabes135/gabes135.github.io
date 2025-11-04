
let catcher_view = true
let camera_settings
let x_cam

let plot_canvas, plot_scene, plot_engine, plot_camera, plot_light;
let scale = 1
let vertices
const m_to_feet = (1/0.3048) * scale

let init = false
let oldData, oldDataNoSpin
let pitch, pitch_nospin, start, end, end_nospin, dp, dp_nospin, pitch0, end0, dp0
let meshes = []

const x_90 =  [Math.PI/2, 0, 0]
const y_90 =  [0, Math.PI/2, 0]
const z_90 =  [0, 0, Math.PI/2]
const z_45 =  [0, 0, Math.PI/4]
const z_45_n =  [0, 0, -Math.PI/4]

const alpha0 = Math.PI/2
const beta0 = Math.PI*(31/64) 
const radius0 = 20
const target0 =  new BABYLON.Vector3(0, 10, 2.5);

const ball_diam = .25

const root2 = Math.sqrt(2)/2
const x_1b = -90*root2
const y_1b = 90*root2
const x_3b = 90*root2
const y_3b = 90*root2
const x_2b = 0
const y_2b = 90*root2*2

let x, y, z

const resolution = 2000

// Helpers



function makeVector3List(x, y, z) {
    if (x.length !== y.length || x.length !== y.length) {
        throw new Error("x, y, z arrays must have the same length");
    }

    const points = [];
    for (let i = 0; i < x.length; i++) {
        points.push(new BABYLON.Vector3(x[i] * scale, y[i] * scale, z[i] * scale));
    }

    return points;
}

function makeVector2List(x, y) {
    if (x.length !== y.length) {
        throw new Error("x, y arrays must have the same length");
    }

    const points = [];
    for (let i = 0; i < x.length; i++) {
        points.push(new BABYLON.Vector2(x[i] * scale, y[i] * scale));
    }

    return points;
}


function makeTube(vertices, color, alpha, name, radius = .05) {

    // vertices should include first point;
    const line = BABYLON.MeshBuilder.CreateTube(name, {path : vertices, radius: radius, updatable: true,  }, plot_scene);
    line.material = new BABYLON.StandardMaterial(`${name}Mat`, plot_scene);
    line.material.diffuseColor = new BABYLON.Color3(...color);
    line.material.specularColor = new BABYLON.Color3(0, 0, 0);
    line.material.emissiveColor = new BABYLON.Color3(0, 0, 0);

    line.material.alpha = alpha

    return line
}


function makeHStrip(p0, p1, width, pm) {
    // p0, p1: BABYLON.Vector3 points
    // width: half-width along y
    // assumes p0.y === p1.y and p0.z === p1.z

    // Define the two paths (bottom and top edges of the ribbon)
    const edge1 = [
        new BABYLON.Vector3(p0.x, p0.y, p0.z),
        new BABYLON.Vector3(p1.x, p1.y, p1.z)
    ];

    const edge2 = [
        new BABYLON.Vector3(p0.x, p0.y + pm*width, p0.z),
        new BABYLON.Vector3(p1.x, p1.y + pm*width, p1.z)
    ];

    const ribbon = BABYLON.MeshBuilder.CreateRibbon('null', {
        pathArray: [edge1, edge2],
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);


    return ribbon;
}

function makeVStrip(p0, p1, width, pm) {
    // p0, p1: BABYLON.Vector3 points
    // width: half-width along x
    // assumes p0.x === p1.x and p0.z === p1.z

    // Define the two paths (bottom and top edges of the ribbon)
    const edge1 = [
        new BABYLON.Vector3(p0.x, p0.y, p0.z),
        new BABYLON.Vector3(p1.x, p1.y, p1.z)
    ];

    const edge2 = [
        new BABYLON.Vector3(p0.x + pm*width, p0.y, p0.z),
        new BABYLON.Vector3(p1.x + pm*width, p1.y, p1.z)
    ];

    const ribbon = BABYLON.MeshBuilder.CreateRibbon('null', {
        pathArray: [edge1, edge2],
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);

    return ribbon;
}

function makeBox(vertices, width, color, alpha, name){
    mesh1 = makeHStrip(vertices[0], vertices[1], width, 1)
    mesh2 = makeVStrip(vertices[1], vertices[2], width, +1)
    mesh3 = makeHStrip(vertices[2], vertices[3], width, -1)
    mesh4 = makeVStrip(vertices[3], vertices[0], width, -1)

    const box = BABYLON.Mesh.MergeMeshes([mesh1, mesh2, mesh3, mesh4], 
                                        true,  // disposeSource: remove original meshes
                                        true,  // allow32BitsIndices: use 32-bit indices if needed
                                        undefined, // meshSubclass: default
                                        false, // subdivideWithSubMeshes
                                        true   // multiMultiMaterials: merge materials if same
                                       );
    const mat = new BABYLON.StandardMaterial(`${name}Mat`, scene);
    mat.diffuseColor = new BABYLON.Color3(...color);
    mat.specularColor = new BABYLON.Color3(0, 0, 0);
    mat.emissiveColor = new BABYLON.Color3(0, 0, 0);
    mat.alpha = alpha;

    box.material = mat;
    return box
}

function makeMarker(coord, color, alpha, name, diameter = .05) {
    
    const marker = BABYLON.MeshBuilder.CreateSphere(name, { diameter: diameter }, plot_scene);
    marker.position = new BABYLON.Vector3(...coord);
    marker.material = new BABYLON.StandardMaterial(`${name}Mat`, plot_scene);
    marker.material.diffuseColor = new BABYLON.Color3(...color);
    marker.material.specularColor = new BABYLON.Color3(0, 0, 0); // no shine
    marker.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
    marker.material.alpha = alpha

    return marker
}


function makeSquare(vertices, rot, color, alpha, name){

    const width = BABYLON.Vector3.Distance(vertices[0], vertices[1]);
    const height = BABYLON.Vector3.Distance(vertices[1], vertices[2]);
   

    const plane = BABYLON.MeshBuilder.CreatePlane(name, { width, height, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, plot_scene);
    plane.position = computeCenter(vertices);
    plane.rotation = new BABYLON.Vector3(rot[0],rot[1],rot[2])

    plane.material = new BABYLON.StandardMaterial(`${name}Mat`, plot_scene);
    plane.material.diffuseColor = new BABYLON.Color3(...color);
    plane.material.specularColor = new BABYLON.Color3(0, 0, 0); // no shine
    plane.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
    plane.material.alpha = alpha

    return plane

}

function makePolygon(vertices, rot, color, alpha, name, pos = false){

    const polyBuilder = new BABYLON.PolygonMeshBuilder(name, vertices);
    const polygon = polyBuilder.build();

    polygon.material = new BABYLON.StandardMaterial(`${name}Mat`, plot_scene);
    polygon.material.diffuseColor = new BABYLON.Color3(...color);

    polygon.material.alpha = alpha;
    polygon.material.backFaceCulling = false;
    polygon.rotation = new BABYLON.Vector3(rot[0],rot[1],rot[2])

    if (pos) {
        polygon.position = new BABYLON.Vector3(...pos);
    }


    return polygon

}

function computeCenter(vertices) {
    const center = new BABYLON.Vector3(0, 0, 0);
    vertices.forEach(v => center.addInPlace(v));
    center.scaleInPlace(1 / vertices.length);
    return center;
}


function resetCamera(){
    const targs = {
        alpha: alpha0,
        beta: beta0 ,
        radius: radius0,
        target: target0
    };
    const duration = 45;
    const fps = 60;

    const anims = Object.entries(targs).map(([prop, targ]) => {
        const type = prop === "target" 
            ? BABYLON.Animation.ANIMATIONTYPE_VECTOR3 
            : BABYLON.Animation.ANIMATIONTYPE_FLOAT;

        const anim = new BABYLON.Animation(
            "anim" + prop,
            prop,
            fps,
            type,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        anim.setKeys([
            { frame: 0, value: plot_camera[prop] },
            { frame: duration, value: targ }
        ]);

        return anim;
    });


    plot_camera.animations = anims;
    scene.beginAnimation(plot_camera, 0, duration, false);
}

function dpCamera(){
    const targs = {
        alpha: Math.PI * .95,
        beta: beta0 ,
        radius: radius0*2,
        target: new BABYLON.Vector3(0, 24, 2.5),
    };
    const duration = 45;
    const fps = 60;

    const anims = Object.entries(targs).map(([prop, targ]) => {
        const type = prop === "target" 
            ? BABYLON.Animation.ANIMATIONTYPE_VECTOR3 
            : BABYLON.Animation.ANIMATIONTYPE_FLOAT;

        const anim = new BABYLON.Animation(
            "anim" + prop,
            prop,
            fps,
            type,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        anim.setKeys([
            { frame: 0, value: plot_camera[prop] },
            { frame: duration, value: targ }
        ]);

    return anim;
});


    plot_camera.animations = anims;
    scene.beginAnimation(plot_camera, 0, duration, false);
}




function make_kzone(sz_b, sz_t){
    let x = [-0.71, 0.71, 0.71, -0.71];
    let y = [1.5, 1.5, 1.5, 1.5];
    let z = [sz_b, sz_b, sz_t, sz_t];
    vertices = makeVector3List(x, y, z)
    k_zone = makeSquare(vertices, x_90, [0, 0, 0], .05, 'kzone')

    x.push(x[0]);
    y.push(y[0]);
    z.push(z[0]);
    vertices = makeVector3List(x, y, z)
    k_zone_border = makeTube(vertices, [0, 0, 0], 0.75, 'kzone_border', radius = .02)
}



// Initialize Plot

function initTrajPlot() {
    plot_canvas = document.getElementById("plot");
    plot_engine = new BABYLON.Engine(plot_canvas, true);
    plot_engine.setSize(plot_canvas.clientWidth, plot_canvas.clientHeight);

    plot_scene = new BABYLON.Scene(plot_engine);

    plot_camera = new BABYLON.ArcRotateCamera(
        "camera",
        alpha0,    
        beta0,     
        radius0,               
        // new BABYLON.Vector3(0, 55, 2.5),
        // new BABYLON.Vector3(0, -60, 30),
        target0,

        // new BABYLON.Vector3(x_3b, y_3b, 2.5),
        // new BABYLON.Vector3(0, 60.5, 12.5),
        plot_scene
    );

    plot_camera.upVector = new BABYLON.Vector3(0, 0, 1);
    plot_camera.attachControl(plot_canvas, true);


    plot_light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 1), plot_scene);
    plot_scene.clearColor = new BABYLON.Color3(1, 1, 1);


    const ground = BABYLON.MeshBuilder.CreatePlane("ground", { size: 180 , sideOrientation: BABYLON.Mesh.DOUBLESIDE}, plot_scene);
    ground.position = new BABYLON.Vector3(0, 60.5, 0)
    const grassMaterial = new BABYLON.StandardMaterial("groundMat", plot_scene);
    const grassTexture = new BABYLON.GrassProceduralTexture("grasstex", 128, plot_scene);
    grassMaterial.ambientTexture = grassTexture;
    grassMaterial.alpha = 0.5;
    ground.material = grassMaterial;


    const w = 17/12

    // Home Plate
    x = [-w/2, w/2, w/2, 0.0000, -w/2]
    y = [0.0, 0.0, w/2, w, w/2]
    vertices = makeVector2List(x, y)
    const home_plate = makePolygon(vertices, x_90, [1, 1, 1], 1, 'home_plate', pos = [0, 1.5, .2])


    // Rubber
    x = [-1, 1, 1, -1];
    y = [59.75,59.75,  60.25, 60.25];
    z = [.6, .6, .6, .6];
    vertices = makeVector3List(x, y, z)
    const rubber = makeSquare(vertices, [0, 0, 0], [1, 1, 1], 1, 'rubber')



    let mound_color = [0.63671875, 0.56640625, 0.45703125];
    let dirt_color = [0.85, 0.78, 0.65]

    // Mound
    const mound = BABYLON.MeshBuilder.CreateSphere("mound", {slice:.4, diameterX: 12, diameterY: 1, diameterZ: 12, sideOrientation: BABYLON.Mesh.DOUBLESIDE});
    mound.position = new BABYLON.Vector3(0, 60.5, .1)
    mound.rotation = new BABYLON.Vector3(...x_90)
    mound.material = new BABYLON.StandardMaterial("moundMat", plot_scene);
    mound.material.diffuseColor = new BABYLON.Color3(...mound_color)// very light brown
    mound.material.specularColor = new BABYLON.Color3(0, 0, 0); // no shine
    mound.material.emissiveColor = new BABYLON.Color3(0, 0, 0); // ensures color is bright, unaffected by lighting




    



    basepath_w = 4
    x = [45, -45, -45, 45];
    y = [60.5-45, 60.5-45, 60.5+45, 60.5+45];
    let z_offset = .01
    z = [z_offset, z_offset, z_offset, z_offset];

    vertices = makeVector3List(x, y, z)
    const basepath = makeBox(vertices, basepath_w, dirt_color, 1, 'basepath')

    basepath.setPivotPoint(new BABYLON.Vector3(0, 60.5, 0), BABYLON.Space.WORLD);
    basepath.rotate(BABYLON.Axis.Z, Math.PI / 4, BABYLON.Space.WORLD);
    basepath.position.y += basepath_w

    w_base = 3*root2 

    x = [x_3b, x_3b-w_base, x_3b-(2*w_base), x_3b-w_base];
    y = [y_3b, y_3b+w_base, y_3b, y_3b+w_base];
    z_offset = .14
    z = [z_offset, z_offset, z_offset, z_offset];
    vertices = makeVector3List(x, y, z)
    const thirdBase = makeSquare(vertices, z_45, [1, 1, 1], 1, 'thirdBase')


    x = [x_1b+(2*w_base), x_1b+w_base, x_1b, x_1b+w_base];
    y = [y_1b, y_1b+w_base, y_1b, y_1b+w_base];
    z_offset = .14
    z = [z_offset, z_offset, z_offset, z_offset];
    vertices = makeVector3List(x, y, z)
    const firstBase = makeSquare(vertices, z_45, [1, 1, 1], 1, 'firstBase')

    x = [x_2b+(w_base), x_2b, x_2b-w_base, x_2b];
    y = [y_2b-w_base, y_2b, y_2b-w_base, y_2b];
    z_offset = .14
    z = [z_offset, z_offset, z_offset, z_offset];
    vertices = makeVector3List(x, y, z)
    const secondBase = makeSquare(vertices, z_45, [1, 1, 1], 1, 'secondBase')




    const home_dirt = BABYLON.MeshBuilder.CreateDisc("disc", {radius:10, sideOrientation: 1}, plot_scene);
    home_dirt.material = new BABYLON.StandardMaterial("discMat", plot_scene);
    home_dirt.material.diffuseColor = new BABYLON.Color3(...dirt_color); // very light brown
    home_dirt.material.specularColor = new BABYLON.Color3(0, 0, 0); // no shine
    home_dirt.material.emissiveColor = new BABYLON.Color3(0, 0, 0); // ensures color is bright, unaffected by lighting
    home_dirt.position = new BABYLON.Vector3(0, 0, .1);

    

    x = [(-w-1)/2, (-w-9)/2, (-w-9)/2, (-w-1)/2];
    y = [-2, -2, 4, 4];
    z_offset = .14
    z = [z_offset, z_offset, z_offset, z_offset];

    vertices = makeVector3List(x, y, z)
    const lh_box = makeBox(vertices, .2, [1, 1, 1], 1, 'lh_box')


    const rh_box = lh_box.clone("rh_box");
    rh_box.translate(BABYLON.Axis.X, w+1+4, BABYLON.Space.WORLD);

    x_u = 43/24
    x = [x_u, x_u, -x_u, -x_u]
    y = [-2, -8, -8, -2]
    z_offset = .14
    z = [z_offset, z_offset, z_offset, z_offset];
    vertices = makeVector3List(x, y, z)
    makeVStrip(vertices[0], vertices[1], .2, 1)
    makeVStrip(vertices[3], vertices[2], .2, -1)
    makeHStrip(vertices[1], vertices[2], .2, 1)

    
    


    plot_engine.runRenderLoop(() => {
      plot_scene.render();
    });
    window.addEventListener("resize", () => plot_engine.resize());


}


function generate_trajectory(pitch_state){


    let solver = new ODEsolver(pitch_state.derivs.bind(pitch_state), pitch_state.initial_conditions, 0, pitch_state.t_f*1.01)
    let data = calcOdeRK4(solver, resolution)

    
    pitch_state.scale_factor = scale
    for (let i = 1; i <= 3; i++) {
        if (data[i]) {
            data[i] = data[i].map((val) => val * m_to_feet);
    };

    data[1] = data[1].map((val) => val * -1); // in babylon, x axis is flipped
    pitch_state.data = data

}
}


function takeScreenShot(){
    

    plot_camera.alpha = 5*Math.PI/8
    plot_camera.beta = Math.PI*(15/32) 

    plot_scene.getMeshByName("pitch").isVisible = false;
    plot_scene.getMeshByName("start").isVisible = false;
    plot_scene.getMeshByName("end").isVisible = false;
    plot_scene.getMeshByName("kzone").isVisible = false;
    plot_scene.getMeshByName("kzone_border").isVisible = false;
  

   
    BABYLON.Tools.CreateScreenshotUsingRenderTarget(
    plot_engine,
    plot_camera,
    { width: 1920, height: 1080 },
    (img) => {
            // You can save the image string or download
            const a = document.createElement("a");
            a.href = img;
            a.download = "screenshot.png";
            a.click();
        },
        { antialias: true }
    );

    // plot_scene.getMeshByName("pitch").isVisible = true;
    // plot_scene.getMeshByName("end").isVisible = true;
  

}

function generateDiff(data, data_nospin) {
    if (data_nospin[3].at(-1) < data[3].at(-1)) {
        return [
            [data_nospin[1].at(-1), data[1].at(-1), data[1].at(-1)],
            [data_nospin[2].at(-1), data[2].at(-1), data[2].at(-1)],
            [data_nospin[3].at(-1), data_nospin[3].at(-1), data[3].at(-1)]
        ];
    } else {
        return [
            [data_nospin[1].at(-1), data_nospin[1].at(-1), data[1].at(-1)],
            [data_nospin[2].at(-1), data_nospin[2].at(-1), data[2].at(-1)],
            [data_nospin[3].at(-1), data[3].at(-1), data[3].at(-1)]
        ];
    }
}


function recalcTraj(row, f_L, omega_hat){

    pitch = plot_scene.getMeshByName("pitch"); 
    end = plot_scene.getMeshByName("end"); 
    dp = plot_scene.getMeshByName("dp"); 

    if (!plot_scene.getMeshByName("pitch0")){
        end0 = end.clone("end0")
        end0.material = end0.material.clone("end0Mat");
        end0.material.alpha = .33

        dp0 = dp.clone("dp0")
        dp0.material = dp0.material.clone("dp0Mat");
        dp0.material.alpha = .33

        vertices = makeVector3List(oldData[1], oldData[2], oldData[3])
        pitch0 = makeTube(vertices, [0, 0, 0], .33, 'pitch0', radius = .05) 


    }
   
    pitch_state = new PitchState(row, f_L);
    pitch_state.omega_hat = omega_hat

    solver_prime = new ODEsolver(pitch_state.derivs.bind(pitch_state), pitch_state.initial_conditions, 0, pitch_state.t_f*1.01)
    data = calcOdeRK4(solver_prime, resolution)


    pitch_state.scale_factor = scale
    for (let i = 1; i <= 3; i++) {
      if (data[i]) {
          data[i] = data[i].map((val) => val * m_to_feet);
    }
    };
    data[1] = data[1].map((val) => val * -1); // in babylon, x axis is flipped

    pitch_state.data = data

    vertices = makeVector3List(data[1], data[2], data[3])

    BABYLON.MeshBuilder.CreateTube("pitch", {
        path: vertices,  // new path array
        instance: pitch     // reuse existing mesh
    });

    end.position.set(data[1].at(-1), data[2].at(-1), data[3].at(-1));

    let dpIndex = Math.round(.150/(data[0].at(-1) - data[0].at(-2)))
    dp.position.set(data[1].at(-dpIndex), data[2].at(-dpIndex), data[3].at(-dpIndex));
    



  return pitch_state
}


function plot_traj(row, noSpin=true) {

    let vertices

    let sz_b = row['sz_bot'] 
    let sz_t = row['sz_top']

    let pitch_state = new PitchState(row, 1);
    let pitch_state_nospin = new PitchState(row, 0);

    generate_trajectory(pitch_state)
    generate_trajectory(pitch_state_nospin)

    let data = pitch_state.data
    let data_nospin = pitch_state_nospin.data
    pitch_state.data_nospin = pitch_state_nospin.data

    oldData = data


    console.log(`Statcast final pos: (${pitch_state.x_sc}, ${pitch_state.z_sc})`)
    console.log(`My final pos: (${(-data[1].at(-1)/scale).toFixed(3)}, ${(data[3].at(-1)/scale).toFixed(3)}), y = ${(data[2].at(-1)/scale).toFixed(3)}`)



    if (init) {

        // Delete  kzone and redraw
        plot_scene.getMeshByName("kzone").dispose()
        plot_scene.getMeshByName("kzone_border").dispose()

        // Delete original ghost trajectory if exists
        if (plot_scene.getMeshByName("pitch0")){
            plot_scene.getMeshByName("pitch0").dispose()
            plot_scene.getMeshByName("end0").dispose()
            plot_scene.getMeshByName("dp0").dispose()
        }

        make_kzone(sz_b, sz_t)


        // Replace pitch
        vertices = makeVector3List(data[1], data[2], data[3])
        BABYLON.MeshBuilder.CreateTube("pitch", {
            path: vertices,  // new path array
            instance: plot_scene.getMeshByName("pitch")     // reuse existing mesh
        }, plot_scene);

        // Replace start and end
        plot_scene.getMeshByName("start").position.set(data[1].at(0), data[2].at(0), data[3].at(0));
        plot_scene.getMeshByName("end").position.set(data[1].at(-1), data[2].at(-1), data[3].at(-1));
        let dpIndex = Math.round(.150/(data[0].at(-1) - data[0].at(-2)))
        plot_scene.getMeshByName("dp").position.set(data[1].at(-dpIndex), data[2].at(-dpIndex), data[3].at(-dpIndex));


        if (noSpin){
            vertices = makeVector3List(data_nospin[1], data_nospin[2], data_nospin[3])
            BABYLON.MeshBuilder.CreateTube("pitch_nospin", {
                path: vertices,  // new path array
                instance: plot_scene.getMeshByName("pitch_nospin")     // reuse existing mesh
            }, plot_scene);
            
            plot_scene.getMeshByName("end_nospin").position.set(data_nospin[1].at(-1), data_nospin[2].at(-1), data_nospin[3].at(-1));
            let dpIndex_nospin = Math.round(.150/(data_nospin[0].at(-1) - data_nospin[0].at(-2)))
            plot_scene.getMeshByName("dp_nospin").position.set(data_nospin[1].at(-dpIndex_nospin), data_nospin[2].at(-dpIndex_nospin), data_nospin[3].at(-dpIndex_nospin));

            diff_points = generateDiff(data, data_nospin)
            
            vertices = makeVector3List(diff_points[0], diff_points[1], diff_points[2])
            BABYLON.MeshBuilder.CreateLines("diff", {
                points: vertices,  // new path array
                instance: plot_scene.getMeshByName("diff")     // reuse existing mesh
            }, plot_scene);


        }   


    }
    else{
        
        initTrajPlot()
        init = true  


        make_kzone(sz_b, sz_t)

        // Strike Zone
        
        


        vertices = makeVector3List(data[1], data[2], data[3])
        let pitch = makeTube(vertices, [0, 0, 0], 1, 'pitch', radius = .05) 


        let start = makeMarker([data[1][0], data[2][0], data[3][0]], [1, 0, 0], 1, 'start', diameter = ball_diam)
        let end = makeMarker([data[1].at(-1), data[2].at(-1), data[3].at(-1)], [0, 0, 1], 1, 'end', diameter = ball_diam)


        let dpIndex = Math.round(.150/(data[0].at(-1) - data[0].at(-2)))
        let dp = makeMarker([data[1].at(-dpIndex), data[2].at(-dpIndex), data[3].at(-dpIndex)], [0, 0, 0], 1, 'dp', diameter = ball_diam)

        

        if (noSpin){

            vertices = makeVector3List(data_nospin[1], data_nospin[2], data_nospin[3])
            let pitch_nospin = makeTube(vertices, [0, 0, 0], .33, 'pitch_nospin', radius = .05)
            let end_nospin = makeMarker([data_nospin[1].at(-1), data_nospin[2].at(-1), data_nospin[3].at(-1)], [0, 0, 1], .33, 'end_nospin', diameter = ball_diam)

            let dpIndex_nospin = Math.round(.150/(data_nospin[0].at(-1) - data_nospin[0].at(-2)))
            let dp_nospin = makeMarker([data_nospin[1].at(-dpIndex_nospin), data_nospin[2].at(-dpIndex_nospin), data_nospin[3].at(-dpIndex_nospin)], [0, 0, 0], 1, 'dp_nospin', diameter = ball_diam)

        
            let diff_points = generateDiff(data, data_nospin)
            vertices = makeVector3List(diff_points[0], diff_points[1], diff_points[2])
            let diff = BABYLON.MeshBuilder.CreateLines("diff", {points: vertices, updatable:true}, plot_scene)
            diff.color = new BABYLON.Color3(1, 0, 0);

        }
    }

    plot_canvas.addEventListener("wheel", function (event) {
      event.preventDefault();      // stops the page from scrolling
    }, { passive: false });

    

    // const pitch = makeLineTrace(data[1], data[2], data[3], 'black');
    // const pitch_nospin = makeLineTrace(data_nospin[1], data_nospin[2], data_nospin[3], 'rgba(0, 0, 0, 0.33)');



    // createAxes_plot(1.2, .1);
    // createAxisLabel("X", new BABYLON.Vector3(-1.5,0,0));
    // createAxisLabel("Y", new BABYLON.Vector3(0,1.5,0));
    // createAxisLabel("Z", new BABYLON.Vector3(0,0,1.5));


    const rootNode = new BABYLON.TransformNode("rootNode", plot_scene);

    // Attach all meshes to this node
    plot_scene.meshes.forEach(mesh => {
        mesh.parent = rootNode;
    });

    // Scale the parent node non-uniformly
    rootNode.scaling = new BABYLON.Vector3(1, 1, 1); // X is 1.2× wider

    
    return pitch_state
}















function repositionCamera()
{

}








function calcOdeRK4(solver, resolution) {
  const rk4res = solver.rk4(~~resolution);
  const times = rk4res.ts;
  const pos_x = rk4res.ys.map(y => y[0]); 
  const pos_y = rk4res.ys.map(y => y[1]); 
  const pos_z = rk4res.ys.map(y => y[2]); 


  return [times, pos_x, pos_y, pos_z];
}


function createAxes_plot(length = 1.5, z=0) {
    const sceneAxes = [];

    // X-axis (red)
    const xPoints = [
        new BABYLON.Vector3(0, 0, z),
        new BABYLON.Vector3(-length, 0, z)
    ];
    const xAxis = BABYLON.MeshBuilder.CreateTube("xAxis", { path: xPoints, radius: 0.1 }, plot_scene);
    xAxis.color = new BABYLON.Color3(1, 0, 0);
    sceneAxes.push(xAxis);

    // Y-axis (green)
    const yPoints = [
        new BABYLON.Vector3(0, 0, z),
        new BABYLON.Vector3(0, length, z)
    ];
    const yAxis = BABYLON.MeshBuilder.CreateTube("yAxis", { path: yPoints, radius: 0.1 }, plot_scene);
    yAxis.color = new BABYLON.Color3(0, 1, 0);
    sceneAxes.push(yAxis);

    // Z-axis (blue)
    const zPoints = [
        new BABYLON.Vector3(0, 0, z),
        new BABYLON.Vector3(0, 0, z+length)
    ];
    const zAxis = BABYLON.MeshBuilder.CreateTube("zAxis", { path: zPoints, radius: 0.1 }, plot_scene);
    zAxis.color = new BABYLON.Color3(0, 0, 1);
    sceneAxes.push(zAxis);

    return sceneAxes;
}

function createAxisLabel(text, position) {
    const plane = BABYLON.MeshBuilder.CreatePlane(text + "Plane", {size: 0.3}, plot_scene);
    plane.position = position;

    const texture = new BABYLON.DynamicTexture(text + "Tex", {width:256, height:256}, plot_scene);
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
