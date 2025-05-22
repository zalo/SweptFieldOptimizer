import * as THREE from '../node_modules/three/build/three.module.js';
import { GUI } from '../node_modules/three/examples/jsm/libs/lil-gui.module.min.js';
import World from './World.js';
import { TransformControls } from '../node_modules/three/examples/jsm/controls/TransformControls.js';

/** The fundamental set up and animation structures for Simulation */
export default class Main {

    constructor() {
        // Intercept Main Window Errors
        window.realConsoleError = console.error;
        window.addEventListener('error', (event) => {
            let path = event.filename.split("/");
            this.display((path[path.length - 1] + ":" + event.lineno + " - " + event.message));
        });
        console.error = this.fakeError.bind(this);
        this.timeMS = 0;
        this.deferredConstructor();
    }
    async deferredConstructor() {
        console.log("Main constructor");
        // Configure Settings
        this.simulationParams = {
            fieldLerp: 0.01,
            speed: 0.085,
            
        };
        this.gui = new GUI();
        //this.gui.add(this.simulationParams, 'showPhotodiodeView').name('Show Photodiode View');
        this.gui.add(this.simulationParams, 'fieldLerp', 0.005, 0.1, 0.0001).name('Field Averaging Speed');
        this.gui.add(this.simulationParams, 'speed', 0.001, 0.1, 0.0001).name('Magnet Speed');

        // Construct the render world
        this.world = new World(this);

        // Create central pivot group
        this.pivotGroup = new THREE.Group();
        this.world.scene.add(this.pivotGroup);
        this.stationaryGroup = new THREE.Group();
        this.world.scene.add(this.stationaryGroup);

        // Add a magnet to the scene
        this.magnets = [];
        for(let i = 0; i < 4; i++) {
            let magnet = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01, 0.01, 0.01, 32),
                new THREE.MeshPhongMaterial({ color: 0x00ff00 })
            );
            magnet.position.set(0.0, -0.0, -0.1);
            magnet.rotation.x = Math.PI / 4  *  (i%2==0 ? 1 : -3);
            this.world.scene.add(magnet);
            this.magnets.push(magnet);

            this.pivotGroup.attach(magnet);
            this.pivotGroup.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * Math.PI / 2));
            this.pivotGroup.updateMatrixWorld();
            this.stationaryGroup.attach(magnet);
        }

        // Add an InstancedMesh with color
        this.instanceDim = 21;
        this.instanceMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.1, 0.2, 8), new THREE.MeshPhongMaterial({ color: 0xffffff }), this.instanceDim * this.instanceDim * this.instanceDim);
        this.instanceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
        this.world.scene.add(this.instanceMesh);

        this.fieldPositions = [];
        this.fieldVectors = [];
        this.upVector = new THREE.Vector3(0, 1, 0);
        this.recalculateFullField();

        //// Add a transform control to the magnet
        //this.translateControl = new TransformControls(this.world.camera, this.world.renderer.domElement);
        //this.translateControl.attach(this.magnet);
        //this.translateControl.addEventListener('change', () => { this.recalculateFullField(); this.world.renderer.render(this.world.scene, this.world.camera); });
        //this.translateControl.addEventListener('dragging-changed', (event) => { this.world.controls.enabled = !event.value; this.rotateControl.enabled = !event.value; });
        //this.translateControl.setMode("translate");
        //this.world.scene.add( this.translateControl.getHelper() );

        //this.rotateControl = new TransformControls(this.world.camera, this.world.renderer.domElement);
        //this.rotateControl.attach(this.magnet);
        //this.rotateControl.addEventListener('change', () => { this.recalculateFullField(); this.world.renderer.render(this.world.scene, this.world.camera); });
        //this.rotateControl.addEventListener('dragging-changed', (event) => { this.world.controls.enabled = !event.value; });
        //this.rotateControl.setMode("rotate");
        //this.rotateControl.size = 0.45;
        //this.world.scene.add( this.rotateControl.getHelper() );
    }

    calculateMagneticField(position){
        let totalFieldDirection = new THREE.Vector3();
        for(let j = 0; j < this.magnets.length; j++) {
            // Calculate the magnetic field direction at the given position
            // 1. Transform into the local space of the magnet
            let localPosition = this.magnets[j].worldToLocal(position.clone());
            // 2. Calculate the magnetic field vector with the magnet dipole at the origin
            // B = (μ₀ / 4π) [3m · r / r³ - (m / r³)]
            let r = localPosition.length();
            let rHat = localPosition.clone().normalize();
            let m = new THREE.Vector3(0, 1, 0); // Dipole moment
            let u = 1; // Permeability of free space
            let fieldDirection = new THREE.Vector3();
            fieldDirection.copy(rHat).multiplyScalar(3 * m.dot(rHat) / (r * r * r));
            fieldDirection.sub(m.clone().multiplyScalar(1 / (r * r * r)));
            fieldDirection.multiplyScalar((u / (4 * Math.PI)));
            // 3. Rotate back into the world space
            fieldDirection = fieldDirection.applyQuaternion(this.magnets[j].quaternion);
            totalFieldDirection.add(fieldDirection);
        }
        return totalFieldDirection;
    }

    recalculateFullField() {
        let sum = new THREE.Vector3(0, 0, 0);
        for(let z = 0; z < this.instanceDim; z++) {
            for(let y = 0; y < this.instanceDim; y++) {
                for(let x = 0; x < this.instanceDim; x++) {
                    let i = x + y * this.instanceDim + z * this.instanceDim * this.instanceDim;
                    if(this.fieldPositions.length !== this.instanceDim * this.instanceDim * this.instanceDim) {
                        this.fieldPositions.push(new THREE.Vector3(
                                ((x/(this.instanceDim-1)) - 0.5) * 0.0525,
                                ((y/(this.instanceDim-1)) - 0.5) * 0.0525,
                                ((z/(this.instanceDim-1)) - 0.5) * 0.0525
                            ));1
                        this.fieldVectors.push(this.calculateMagneticField(this.fieldPositions[i]));
                    }
                    this.fieldVectors[i].lerp(this.calculateMagneticField(this.fieldPositions[i]), this.simulationParams.fieldLerp);
                    let fieldLength = Math.min(5.0, this.fieldVectors[i].length());
                    this.instanceMesh.setMatrixAt(i, new THREE.Matrix4().compose(
                        this.fieldPositions[i],
                        new THREE.Quaternion().setFromUnitVectors(this.upVector, this.fieldVectors[i].clone().normalize()),
                        new THREE.Vector3(0.025 * fieldLength, 0.2 * fieldLength, 0.025 * fieldLength).multiplyScalar(0.025)
                    ));
                }
            }
        }
        this.instanceMesh.instanceMatrix.needsUpdate = true;
    }

    /** Update the simulation */
    update(timeMS) {
        this.deltaTime = timeMS - this.timeMS;
        this.timeMS = timeMS;
        for(let i = 0; i < this.magnets.length; i++) {
            this.pivotGroup.attach(this.magnets[i]);
        }
        this.pivotGroup.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.deltaTime * this.simulationParams.speed));
        this.pivotGroup.updateMatrixWorld();
        for(let i = 0; i < this.magnets.length; i++) {
            this.stationaryGroup.attach(this.magnets[i]);
        }
        this.recalculateFullField();
        this.world.controls.update();
        //this.translateControl.update();
        //this.rotateControl.update();
        this.world.renderer.render(this.world.scene, this.world.camera);
        this.world.stats.update();
    }

    // Log Errors as <div>s over the main viewport
    fakeError(...args) {
        if (args.length > 0 && args[0]) { this.display(JSON.stringify(args[0])); }
        window.realConsoleError.apply(console, arguments);
    }

    display(text) {
        let errorNode = window.document.createElement("div");
        errorNode.innerHTML = text.fontcolor("red");
        window.document.getElementById("info").appendChild(errorNode);
    }
}

var main = new Main();