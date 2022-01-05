<template>
    <div id="container"></div>
</template>

<script>
    import * as THREE from 'three'
    import OrbitControls from 'three-orbitcontrols'
    import {GUI} from 'three/examples/jsm/libs/lil-gui.module.min.js';
    import {Lut} from 'three/examples/jsm/math/Lut.js';
    import model from '../assets/pressure.json'

    export default {
        name: "ThreeDShow",
        data() {
            return {
                container: null,
                perpCamera: null,
                orthoCamera: null,
                renderer: null,
                lut: null,
                mesh: null,
                sprite: null,
                scene: null,
                uiScene: null,
                params: null
            }
        },
        mounted() {
            this.init()
        },
        methods: {
            init: function () {
                let self = this
                self.container = document.getElementById('container');

                self.scene = new THREE.Scene();
                self.scene.background = new THREE.Color(0xffffff);

                self.uiScene = new THREE.Scene();

                self.lut = new Lut();

                const width = self.container.clientWidth;
                const height = self.container.clientHeight;

                self.perpCamera = new THREE.PerspectiveCamera(60, width / height, 1, 100);
                self.perpCamera.position.set(0, 0, 10);
                self.scene.add(self.perpCamera);

                self.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2);
                self.orthoCamera.position.set(0.5, 0, 1);

                self.sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: new THREE.CanvasTexture(self.lut.createCanvas())
                }));
                self.sprite.translateX(-0.5)
                self.sprite.scale.x = 0.125;
                self.uiScene.add(self.sprite);

                self.mesh = new THREE.Mesh(undefined, new THREE.MeshLambertMaterial({
                    side: THREE.DoubleSide,
                    color: 0xffffff ,
                    vertexColors: true
                }));
                self.scene.add(self.mesh);

                self.params = {
                    colorMap: 'rainbow',
                };

                const pointLight = new THREE.PointLight(0xffffff, 1);
                self.perpCamera.add(pointLight);

                self.renderer = new THREE.WebGLRenderer({antialias: true});
                self.renderer.autoClear = false;
                self.renderer.setPixelRatio(window.devicePixelRatio);
                self.renderer.setSize(width, height);
                self.container.appendChild(self.renderer.domElement);

                self.loadModel();

                window.addEventListener('resize', self.onWindowResize);

                const controls = new OrbitControls(self.perpCamera, self.renderer.domElement);
                controls.addEventListener('change', self.render);

                const gui = new GUI();

                gui.add(self.params, 'colorMap', ['rainbow', 'cooltowarm', 'blackbody', 'grayscale']).onChange(function () {
                    self.updateColors();
                    self.render();
                });
            },
            onWindowResize: function () {
                let self = this
                const width = window.innerWidth;
                const height = window.innerHeight;

                self.perpCamera.aspect = width / height;
                self.perpCamera.updateProjectionMatrix();

                self.renderer.setSize(width, height);
                self.render();

            },

            render: function () {
                this.renderer.clear();
                this.renderer.render(this.scene, this.perpCamera);
                this.renderer.render(this.uiScene, this.orthoCamera);
            },

            loadModel: function () {
                const loader = new THREE.BufferGeometryLoader();
                let geometry = loader.parse(model)
                geometry.center();
                geometry.computeVertexNormals();
                // default color attribute
                const colors = [];
                for (let i = 0, n = geometry.attributes.position.count; i < n; ++i) {
                    colors.push(1, 1, 1);
                }
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                this.mesh.geometry = geometry;
                this.updateColors();
                this.render()
            },

            updateColors: function () {
                let self = this
                self.lut.setColorMap(self.params.colorMap);

                self.lut.setMax(2000);
                self.lut.setMin(0);

                const geometry = self.mesh.geometry;
                const pressures = geometry.attributes.pressure;
                const colors = geometry.attributes.color;

                for (let i = 0; i < pressures.array.length; i++) {

                    const colorValue = pressures.array[i];

                    const color = self.lut.getColor(colorValue);

                    if (color === undefined) {

                        console.log('Unable to determine color for value:', colorValue);

                    } else {

                        colors.setXYZ(i, color.r, color.g, color.b);

                    }

                }

                colors.needsUpdate = true;

                const map = self.sprite.material.map;
                self.lut.updateCanvas(map.image);
                map.needsUpdate = true;

            }
        }
    }
</script>

<style scoped>
    #container {
        height: 100%;
    }
</style>