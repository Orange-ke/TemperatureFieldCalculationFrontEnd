<template>
    <div id="container">
        <el-switch
                @change="switchVisibility"
                style="position: absolute; right: 10px; top: 10px; z-index: 999"
                v-model="visible"
                active-color="#13ce66"
                inactive-color="#ff4949">
        </el-switch>
    </div>
</template>

<script>
    import * as THREE from 'three'
    import OrbitControls from 'three-orbitcontrols'

    export default {
        name: "ThreeDTest",
        data() {
            return {
                scene: undefined,
                camera: undefined,
                renderer: undefined,
                geometry: undefined,
                material: undefined,
                group: undefined,
                positions: [],
                colors: [],

                container: undefined,
                width: 0,
                height: 0,

                points: undefined,

                rOut: undefined,
                rIn: undefined,

                upLength: 100,
                downLength: 100,
                arcLength: 600,
                xLength: 270,
                yLength: 42,

                cylinderNum: 14,
                coolerMaterial: undefined,
                visible: true,
            }
        },
        methods: {
            init: function () {
                this.scene = new THREE.Scene()

                this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 10000)
                this.camera.position.set(0, 150, 800);

                this.scene.add(new THREE.AmbientLight(0xffffff))

                this.scene.background = new THREE.Color(0x050505)

                this.group = new THREE.Group()
                this.group.position.set(-200, -250, 0)
                this.scene.add(this.group)

                this.heatmap = this.createPalette()

                this.buildShapes()

                this.renderer = new THREE.WebGLRenderer()
                this.renderer.setPixelRatio(window.devicePixelRatio)
                this.renderer.setSize(this.width, this.height)
                this.container.appendChild(this.heatmap.canvas)
                this.container.appendChild(this.renderer.domElement)

                let controls = new OrbitControls(this.camera, this.renderer.domElement)
                controls.addEventListener('change', this.render)

                window.addEventListener('resize', this.onWindowResize, false)
            },
            onWindowResize: function () {
                this.camera.aspect = this.width / this.height
                this.camera.updateProjectionMatrix()

                this.renderer.setSize(this.width, this.height)
            },
            animate: function () {
                requestAnimationFrame(this.animate)
                this.render()
            },
            render: function () {
                this.renderer.render(this.scene, this.camera)
            },
            createPalette: function () {
                //颜色条的颜色分布
                let colorStops = {
                    1.0: "#D32F2F",
                    0.75: "#FFC107",
                    0.5: "#388E3C",
                    0.25: "#536DFE",
                    0.0: "#515151"
                }

                //颜色条的大小
                let width = 100, height = 700

                // 创建canvas
                let paletteCanvas = document.createElement("canvas")
                paletteCanvas.width = width
                paletteCanvas.height = height
                paletteCanvas.style.position = 'absolute'
                paletteCanvas.style.top = '0'
                paletteCanvas.style.left = '0'
                let ctx = paletteCanvas.getContext("2d")

                // 创建线性渐变色
                let linearGradient = ctx.createLinearGradient(0, 0, 0, height)
                for (const key in colorStops) {
                    linearGradient.addColorStop(parseFloat(key), colorStops[key])
                }

                // 绘制渐变色条
                ctx.fillStyle = linearGradient
                ctx.fillRect(0, 0, width, height)

                ctx.font = '10px "微软雅黑"'
                ctx.fillStyle = "white"
                ctx.textBaseline = "top"
                ctx.fillText("1600", 70, 690)
                ctx.fillText("1250", 70, 515)
                ctx.fillText("900", 70, 340)
                ctx.fillText("550", 70, 165)
                ctx.fillText("200", 70, 0)

                let imageData = ctx.getImageData(0, 0, width, height).data

                return {
                    canvas: paletteCanvas,
                    pickColor: function (position) {
                        return imageData.slice(position * 400, position * 400 + 3)
                    }
                }
            },
            buildShapes: function () {
                let parameters = {color: 0x00BCD4, opacity: 0.3, transparent: true}
                // outline
                this.buildOutlineShapeUp(this.rOut, parameters)
                this.buildOutlineCurve(this.rOut, this.rIn, parameters)
                this.buildOutlineShapeDown(this.rOut, parameters)
                this.buildCooler(this.rOut, this.rIn)

                // internal
                // this.buildInternalShapes(this.rOut, this.rIn)
            },
            buildOutlineCurve: function (rOut, rIn, parameters) {
                let angle = 90
                let step = 90 / 600
                let pts1 = []
                for (let i = 0; i < 600; i++) {
                    let xy = this.calculateXY(rOut, rOut, rOut, (angle - i * step) - 180)
                    pts1.push(new THREE.Vector3(xy.x2, xy.y2, 270 / 2))  // this is the key operation
                }
                let geometry1 = new THREE.BufferGeometry().setFromPoints(pts1);
                let arc1 = new THREE.Line(geometry1, new THREE.LineBasicMaterial(parameters));

                this.group.add(arc1)

                let pts2 = []
                for (let i = 0; i < 600; i++) {
                    let xy = this.calculateXY(rOut, rOut, rOut, (angle - i * step) - 180)
                    pts2.push(new THREE.Vector3(xy.x2, xy.y2, -270 / 2))  // this is the key operation
                }
                let geometry2 = new THREE.BufferGeometry().setFromPoints(pts2);
                let arc2 = new THREE.Line(geometry2, new THREE.LineBasicMaterial(parameters));

                this.group.add(arc2)

                let pts3 = []
                for (let i = 0; i < 600; i++) {
                    let xy = this.calculateXY(rOut, rOut, rIn, (angle - i * step) - 180)
                    pts3.push(new THREE.Vector3(xy.x2, xy.y2, 270 / 2))  // this is the key operation
                }
                let geometry3 = new THREE.BufferGeometry().setFromPoints(pts3);
                let arc3 = new THREE.Line(geometry3, new THREE.LineBasicMaterial(parameters));

                this.group.add(arc3)

                let pts4 = []
                for (let i = 0; i < 600; i++) {
                    let xy = this.calculateXY(rOut, rOut, rIn, (angle - i * step) - 180)
                    pts4.push(new THREE.Vector3(xy.x2, xy.y2, -270 / 2))  // this is the key operation
                }
                let geometry4 = new THREE.BufferGeometry().setFromPoints(pts4);
                let arc4 = new THREE.Line(geometry4, new THREE.LineBasicMaterial(parameters));

                this.group.add(arc4)
            },
            buildOutlineShapeUp: function (rOut, parameters) {
                const shape = new THREE.Shape()
                    .moveTo(0, rOut + 100)
                    .lineTo(84 / 2, rOut + 100)
                    .lineTo(84 / 2, rOut)
                    .lineTo(0, rOut)
                    .lineTo(0, rOut + 100);

                const points = shape.getPoints();
                const geometryPoints = new THREE.BufferGeometry().setFromPoints(points);

                let line1 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial(parameters));
                line1.position.set(0, 0, -270 / 2);
                this.group.add(line1);

                let line2 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial(parameters));
                line2.position.set(0, 0, 270 / 2);
                this.group.add(line2);

                let points1 = []
                points1.push(new THREE.Vector3(0, rOut + 100, 270 / 2))
                points1.push(new THREE.Vector3(0, rOut + 100, -270 / 2))
                this.group.add(this.setLine(points1, parameters))

                let points2 = []
                points2.push(new THREE.Vector3(0, rOut, 270 / 2))
                points2.push(new THREE.Vector3(0, rOut, -270 / 2))
                this.group.add(this.setLine(points2, parameters))

                let points3 = []
                points3.push(new THREE.Vector3(84 / 2, rOut + 100, 270 / 2))
                points3.push(new THREE.Vector3(84 / 2, rOut + 100, -270 / 2))
                this.group.add(this.setLine(points3, parameters))

                let points4 = []
                points4.push(new THREE.Vector3(84 / 2, rOut, 270 / 2))
                points4.push(new THREE.Vector3(84 / 2, rOut, -270 / 2))
                this.group.add(this.setLine(points4, parameters))
            },
            buildOutlineShapeDown: function (rOut, parameters) {

                const shape = new THREE.Shape()
                    .moveTo(rOut, 0)
                    .lineTo(rOut + 100, 0)
                    .lineTo(rOut + 100, 84 / 2)
                    .lineTo(rOut, 84 / 2)
                    .lineTo(rOut, 0);

                const points = shape.getPoints();
                const geometryPoints = new THREE.BufferGeometry().setFromPoints(points);

                let line1 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial(parameters));
                line1.position.set(0, 0, -270 / 2);
                this.group.add(line1);

                let line2 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial(parameters));
                line2.position.set(0, 0, 270 / 2);
                this.group.add(line2);

                let points1 = []
                points1.push(new THREE.Vector3(rOut + 100, 0, 270 / 2))
                points1.push(new THREE.Vector3(rOut + 100, 0, -270 / 2))
                this.group.add(this.setLine(points1, parameters))

                let points2 = []
                points2.push(new THREE.Vector3(rOut, 0, 270 / 2))
                points2.push(new THREE.Vector3(rOut, 0, -270 / 2))
                this.group.add(this.setLine(points2, parameters))

                let points3 = []
                points3.push(new THREE.Vector3(rOut + 100, 84 / 2, 270 / 2))
                points3.push(new THREE.Vector3(rOut + 100, 84 / 2, -270 / 2))
                this.group.add(this.setLine(points3, parameters))

                let points4 = []
                points4.push(new THREE.Vector3(rOut, 84 / 2, 270 / 2))
                points4.push(new THREE.Vector3(rOut, 84 / 2, -270 / 2))
                this.group.add(this.setLine(points4, parameters))
            },
            buildCooler: function(rOut, rIn) {
                const group = new THREE.Group()
                this.coolerMaterial = new THREE.MeshBasicMaterial( {color: 0x00BCD4, opacity: 0.3, transparent: true} );
                const geometry = new THREE.BoxGeometry( 42, 100, this.xLength );

                const cube1 = new THREE.Mesh( geometry, this.coolerMaterial  );
                cube1.position.set(-25, rOut + this.upLength / 2, 0)
                group.add(cube1)

                const cube2 = new THREE.Mesh( geometry, this.coolerMaterial  );
                cube2.position.set(this.yLength + 26, rOut + this.upLength / 2, 0)
                group.add(cube2)

                let angle = 90
                let step = 90 / this.arcLength

                const geometryCylinder = new THREE.CylinderGeometry( 10, 10, this.xLength, this.xLength );
                for (let i = 1; i < this.arcLength; i += this.arcLength / this.cylinderNum) {
                    let xy1 = this.calculateXY(rOut, rOut, rOut + 14, (angle - i * step) - 180)
                    const cylinder1 = new THREE.Mesh( geometryCylinder, this.coolerMaterial  );
                    cylinder1.rotateX(90 * Math.PI / 180)
                    cylinder1.position.set(xy1.x2, xy1.y2, 0)
                    group.add(cylinder1)

                    let xy2 = this.calculateXY(rOut, rOut, rIn - 14, (angle - i * step) - 180)
                    const cylinder2 = new THREE.Mesh( geometryCylinder, this.coolerMaterial  );
                    cylinder2.rotateX(90 * Math.PI / 180)
                    cylinder2.position.set(xy2.x2, xy2.y2, 0)
                    group.add(cylinder2)
                }

                for (let i = this.downLength / 2; i <= this.downLength; i += this.downLength / 2) {
                    const cylinder1 = new THREE.Mesh( geometryCylinder, this.coolerMaterial  );
                    cylinder1.rotateX(90 * Math.PI / 180)
                    cylinder1.position.set(rOut + i, -14, 0)
                    group.add(cylinder1)

                    const cylinder2 = new THREE.Mesh( geometryCylinder, this.coolerMaterial  );
                    cylinder2.rotateX(90 * Math.PI / 180)
                    cylinder2.position.set(rOut + i, this.yLength + 14, 0)
                    group.add(cylinder2)
                }

                // material.visible = false
                this.group.add(group)
            },
            setLine: function (points, parameters) {
                const material = new THREE.LineBasicMaterial(parameters);
                const geometry = new THREE.BufferGeometry().setFromPoints(points)
                return new THREE.Line(geometry, material)
            },
            buildInternalShapesNotFull(rOut, rIn, data) {
                console.log(rOut, rIn, data)
            },
            buildInternalShapesFull: function (rOut, rIn, data) {
                console.log(data)
                let start = new Date().getTime()
                let n = data.up.left.length
                let mUp = data.up.left[0].length
                let mDown = data.down.left[0].length
                let k = data.up.front.length
                let a = data.arc.left[0].length
                console.log(n, mUp, mDown, k, a)
                let colors = []
                { // 结晶器部分
                    // left
                    for (let i = 0; i < n; i++) {
                        for (let j = 0; j < mUp; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.up.left[i][j] / 2 - 101) % 700)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // right
                    for (let i = 0; i < n; i++) {
                        for (let j = 0; j < mUp; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.up.right[i][j] / 2 - 101) % 700)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // front
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < mUp; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.up.front[i][j] / 2 - 101) % 700)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // back
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < mUp; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.up.back[i][j] / 2 - 101) % 700)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // up
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < n; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.up.up[j][i] / 2 - 101) % 700)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                }

                { // 弧形部分
                    // left
                    for (let i = 0; i < n; i++) {
                        for (let j = 0; j < a; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.arc.left[i][j] / 2 - 101) % 700)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // right
                    for (let i = 0; i < n; i++) {
                        for (let j = 0; j < a; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.arc.right[i][j] / 2 - 101) % 700)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // back
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < a; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.arc.back[i][j] / 2 - 101) % 700)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // front
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < a; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.arc.front[i][j] / 2 - 101) % 700)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                }

                { // 出口部分
                    // left
                    for (let i = 0; i < mDown; i++) {
                        for (let j = 0; j < n; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.down.left[j][i] / 2 - 101) % 700)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // right
                    for (let i = 0; i < mDown; i++) {
                        for (let j = 0; j < n; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.down.right[j][i] / 2 - 101) % 700)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // back
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < mDown; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.down.back[i][j] / 2 - 101) % 700)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // front
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < mDown; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.down.front[i][j] / 2 - 101) % 700)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // down
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < n; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.down.down[j][i] / 2 - 101) % 700)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                }
                this.colors = colors
                this.points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
                let end = new Date().getTime()
                console.log(this.colors)
                console.log("更新所有的点颜色所用时间: ", end - start)
            },
            buildInternalShapes: function (rOut, rIn) {
                let n = 420 / 5 / 2
                let m = 50
                let k = 2700 / 5 / 2
                let a = 300
                let hk = k / 2
                let initialColor = 50

                { // 结晶器部分
                    // left
                    for (let i = 0; i < n; i++) {
                        for (let j = 0; j < m; j++) {
                            // positions
                            const x = i
                            const y = rOut + j * 2
                            this.positions.push(x, y, hk)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    // right
                    for (let i = 0; i < n; i++) {
                        for (let j = 0; j < m ; j++) {
                            // positions
                            const x = i
                            const y = rOut + j * 2
                            this.positions.push(x, y, -hk)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    // front
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < m; j++) {
                            // positions
                            const z = i - hk
                            const y = rOut + j * 2

                            this.positions.push(n, y, z)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    // back
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < m; j++) {
                            // positions
                            const z = i - hk
                            const y = rOut + j * 2

                            this.positions.push(0, y, z)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    // up
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < n; j++) {
                            // positions
                            const z = i - hk

                            this.positions.push(j, rOut + m * 2, z)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                }

                { // 弧形部分
                    // left
                    for (let i = 0; i < n; i++) {
                        let r = rOut - i
                        for (let j = 0; j < a; j++) {
                            let angle = 90
                            let step = 90 / a
                            // positions
                            let xy = this.calculateXY(rOut, rOut, r, (angle - j * step) - 180)
                            const x = xy.x2
                            const y = xy.y2
                            this.positions.push(x, y, hk)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    // right
                    for (let i = 0; i < n; i++) {
                        let r = rOut - i
                        for (let j = 0; j < a; j++) {
                            let angle = 90
                            let step = 90 / a
                            // positions
                            let xy = this.calculateXY(rOut, rOut, r, (angle - j * step) - 180)
                            const x = xy.x2
                            const y = xy.y2
                            this.positions.push(x, y, -hk)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    // back
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < a; j++) {
                            let angle = 90
                            let step = 90 / a
                            // positions
                            let xy = this.calculateXY(rOut, rOut, rOut, (angle - j * step) - 180)
                            const x = xy.x2
                            const y = xy.y2
                            this.positions.push(x, y, i - hk)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    // front
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < a; j++) {
                            let angle = 90
                            let step = 90 / a
                            // positions
                            let xy = this.calculateXY(rOut, rOut, rIn, (angle - j * step) - 180)
                            const x = xy.x2
                            const y = xy.y2
                            this.positions.push(x, y, i - hk)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                }

                { // 出口部分
                    // left
                    for (let i = 0; i < m; i++) {
                        for (let j = 0; j < n; j++) {
                            // positions
                            const x = rOut + i * 2
                            this.positions.push(x, j, hk)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    // right
                    for (let i = 0; i < m; i++) {
                        for (let j = 0; j < n; j++) {
                            // positions
                            const x = rOut + i * 2
                            this.positions.push(x, j, -hk)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    // back
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < m; j++) {
                            // positions
                            const z = i - hk
                            const x = rOut + j * 2

                            this.positions.push(x, 0, z)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    // front
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < m; j++) {
                            // positions
                            const z = i - hk
                            const x = rOut + j * 2

                            this.positions.push(x, n, z)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    // down
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < n; j++) {
                            // positions
                            const z = i - hk

                            this.positions.push(rOut + m * 2, j, z)

                            // colors
                            const arr = this.heatmap.pickColor(initialColor)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                }

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
                geometry.computeBoundingSphere();
                const material = new THREE.PointsMaterial({size: 3, vertexColors: true});
                this.points = new THREE.Points(geometry, material);
                this.group.add(this.points)
                console.log(this.colors)
            },
            calculateXY: function (x1, y1, r, angle) {
                return {
                    x2: x1 + r * Math.cos(angle * Math.PI / 180),
                    y2: y1 + r * Math.sin(angle * Math.PI / 180)
                }
            },
            switchVisibility: function() {
                this.coolerMaterial.visible = this.visible
            }
        },
        mounted() {
            this.container = document.getElementById("container")
            this.width = this.container.clientWidth
            this.height = this.container.clientHeight

            let r = parseFloat((600 * 4 / (Math.PI * 2)).toFixed(4))
            this.rOut = r + 420 / 5 / 2 / 2
            this.rIn = r - 420 / 5 / 2 / 2

            this.init()
            this.animate()
            this.$root.$on("new_field_data", (data) => {
                console.log(data)
                if (data.is_full) {
                    this.buildInternalShapesFull(this.rOut, this.rIn, data)
                } else {
                    this.buildInternalShapesNotFull(this.rOut, this.rIn, data)
                }
            })
        }
    }
</script>

<style scoped>
    #container {
        width: 100%;
        height: 100%;
        position: relative;
    }
</style>