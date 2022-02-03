<template>
    <div id="container">
        <el-switch
                @change="switchVisibility"
                style="position: absolute; left: 50%; top: 10px; z-index: 999; transform: translateX(-50%)"
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
                // z方向的长度
                originUpLength: 500,
                originDownLength: 500,
                originArcLength: 3000,
                originLength: 4000,

                scaleUp: 2,
                scaleDown: 10,

                upLength: 100,
                downLength: 100,
                arcLength: 600,
                // x, y 方向的长度
                xLength: 270,
                yLength: 42,

                cylinderNum: 14, // 棍子的个数
                coolerMaterial: undefined,
                visible: true,

                originTemperature: 1601,

                fullCount: 0, // 记录切片充满的次数，第一次特殊处理
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
                for (let canvas of this.heatmap.canvas) {
                    this.container.appendChild(canvas)
                }
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
                let data1 = this.createPaletteHelper({
                    1.0: "#388E3C",
                    0.5: "#536DFE",
                    0.0: "#212121",
                }, [
                    {char: "800", x: 70, y: 790},
                    {char: "600", x: 70, y: 600},
                    {char: "400", x: 70, y: 400},
                    {char: "200", x: 70, y: 200},
                    {char: "0", x: 70, y: 0},
                ], "0", "0")

                let data2 = this.createPaletteHelper({
                    1.0: "#D32F2F",
                    0.5: "#FFC107",
                    0.0: "#388E3C",
                }, [
                    {char: "1600", x: 5, y: 790},
                    {char: "1400", x: 5, y: 600},
                    {char: "1200", x: 5, y: 400},
                    {char: "1000", x: 5, y: 200},
                    {char: "800", x: 5, y: 0},
                ], "", "0", "0")

                return {
                    canvas: [data1.canvas, data2.canvas],
                    pickColor: function (position) {
                        if (position > 800) {
                            position = 10 + position - 800
                            return data2.colorData.slice(position * 400, position * 400 + 3)
                        } else {
                            return data1.colorData.slice(position * 400, position * 400 + 3)
                        }
                    }
                }
            },
            createPaletteHelper: function (colorStops, texts, left, top, right) {
                //颜色条的大小
                let width = 100, height = 810

                // 创建canvas
                let paletteCanvas = document.createElement("canvas")
                paletteCanvas.width = width
                paletteCanvas.height = height
                paletteCanvas.style.position = 'absolute'
                paletteCanvas.style.top = top
                paletteCanvas.style.left = left
                paletteCanvas.style.right = right
                let ctx = paletteCanvas.getContext("2d")

                // 创建线性渐变色
                let linearGradient = ctx.createLinearGradient(0, 0, 0, height)
                for (let key in colorStops) {
                    linearGradient.addColorStop(parseFloat(key), colorStops[key])
                }

                // 绘制渐变色条
                ctx.fillStyle = linearGradient
                ctx.fillRect(0, 0, width, height)

                ctx.font = '10px "微软雅黑"'
                ctx.fillStyle = "white"
                ctx.textBaseline = "top"
                for (let text of texts) {
                    ctx.fillText(text.char, text.x, text.y)
                }

                return {colorData: ctx.getImageData(0, 0, width, height).data, canvas: paletteCanvas}
            },
            buildShapes: function () {
                let parameters = {color: 0x00BCD4, opacity: 0.2, transparent: true}
                // outline
                this.buildOutlineShapeUp(this.rOut, parameters)
                this.buildOutlineCurve(this.rOut, this.rIn, parameters)
                this.buildOutlineShapeDown(this.rOut, parameters)
                this.buildCooler(this.rOut, this.rIn)

                // internal
                this.buildInternalShapes()
            },
            buildOutlineCurve: function (rOut, rIn, parameters) {
                let angle = 90
                let step = 90 / this.arcLength
                let pts1 = []
                for (let i = 0; i < this.arcLength; i++) {
                    let xy = this.calculateXY(rOut, rOut, rOut, (angle - i * step) - 180)
                    pts1.push(new THREE.Vector3(xy.x2, xy.y2, this.xLength / 2))  // this is the key operation
                }
                let geometry1 = new THREE.BufferGeometry().setFromPoints(pts1);
                let arc1 = new THREE.Line(geometry1, new THREE.LineBasicMaterial(parameters));

                this.group.add(arc1)

                let pts2 = []
                for (let i = 0; i < this.arcLength; i++) {
                    let xy = this.calculateXY(rOut, rOut, rOut, (angle - i * step) - 180)
                    pts2.push(new THREE.Vector3(xy.x2, xy.y2, -this.xLength / 2))  // this is the key operation
                }
                let geometry2 = new THREE.BufferGeometry().setFromPoints(pts2);
                let arc2 = new THREE.Line(geometry2, new THREE.LineBasicMaterial(parameters));

                this.group.add(arc2)

                let pts3 = []
                for (let i = 0; i < this.arcLength; i++) {
                    let xy = this.calculateXY(rOut, rOut, rIn, (angle - i * step) - 180)
                    pts3.push(new THREE.Vector3(xy.x2, xy.y2, this.xLength / 2))  // this is the key operation
                }
                let geometry3 = new THREE.BufferGeometry().setFromPoints(pts3);
                let arc3 = new THREE.Line(geometry3, new THREE.LineBasicMaterial(parameters));

                this.group.add(arc3)

                let pts4 = []
                for (let i = 0; i < this.arcLength; i++) {
                    let xy = this.calculateXY(rOut, rOut, rIn, (angle - i * step) - 180)
                    pts4.push(new THREE.Vector3(xy.x2, xy.y2, -this.xLength / 2))  // this is the key operation
                }
                let geometry4 = new THREE.BufferGeometry().setFromPoints(pts4);
                let arc4 = new THREE.Line(geometry4, new THREE.LineBasicMaterial(parameters));

                this.group.add(arc4)
            },
            buildOutlineShapeUp: function (rOut, parameters) {
                const shape = new THREE.Shape()
                    .moveTo(0, rOut + this.upLength)
                    .lineTo(this.yLength, rOut + this.upLength)
                    .lineTo(this.yLength, rOut)
                    .lineTo(0, rOut)
                    .lineTo(0, rOut + this.upLength);

                const points = shape.getPoints();
                const geometryPoints = new THREE.BufferGeometry().setFromPoints(points);

                let line1 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial(parameters));
                line1.position.set(0, 0, -this.xLength / 2);
                this.group.add(line1);

                let line2 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial(parameters));
                line2.position.set(0, 0, this.xLength / 2);
                this.group.add(line2);

                let points1 = []
                points1.push(new THREE.Vector3(0, rOut + this.upLength, this.xLength / 2))
                points1.push(new THREE.Vector3(0, rOut + this.upLength, -this.xLength / 2))
                this.group.add(this.setLine(points1, parameters))

                let points2 = []
                points2.push(new THREE.Vector3(0, rOut, this.xLength / 2))
                points2.push(new THREE.Vector3(0, rOut, -this.xLength / 2))
                this.group.add(this.setLine(points2, parameters))

                let points3 = []
                points3.push(new THREE.Vector3(this.yLength, rOut + this.upLength, this.xLength / 2))
                points3.push(new THREE.Vector3(this.yLength, rOut + this.upLength, -this.xLength / 2))
                this.group.add(this.setLine(points3, parameters))

                let points4 = []
                points4.push(new THREE.Vector3(this.yLength, rOut, this.xLength / 2))
                points4.push(new THREE.Vector3(this.yLength, rOut, -this.xLength / 2))
                this.group.add(this.setLine(points4, parameters))
            },
            buildOutlineShapeDown: function (rOut, parameters) {

                const shape = new THREE.Shape()
                    .moveTo(rOut, 0)
                    .lineTo(rOut + this.downLength, 0)
                    .lineTo(rOut + this.downLength, this.yLength)
                    .lineTo(rOut, this.yLength)
                    .lineTo(rOut, 0);

                const points = shape.getPoints();
                const geometryPoints = new THREE.BufferGeometry().setFromPoints(points);

                let line1 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial(parameters));
                line1.position.set(0, 0, -this.xLength / 2);
                this.group.add(line1);

                let line2 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial(parameters));
                line2.position.set(0, 0, this.xLength / 2);
                this.group.add(line2);

                let points1 = []
                points1.push(new THREE.Vector3(rOut + this.downLength, 0, this.xLength / 2))
                points1.push(new THREE.Vector3(rOut + this.downLength, 0, -this.xLength / 2))
                this.group.add(this.setLine(points1, parameters))

                let points2 = []
                points2.push(new THREE.Vector3(rOut, 0, this.xLength / 2))
                points2.push(new THREE.Vector3(rOut, 0, -this.xLength / 2))
                this.group.add(this.setLine(points2, parameters))

                let points3 = []
                points3.push(new THREE.Vector3(rOut + this.downLength, this.yLength, this.xLength / 2))
                points3.push(new THREE.Vector3(rOut + this.downLength, this.yLength, -this.xLength / 2))
                this.group.add(this.setLine(points3, parameters))

                let points4 = []
                points4.push(new THREE.Vector3(rOut, this.yLength, this.xLength / 2))
                points4.push(new THREE.Vector3(rOut, this.yLength, -this.xLength / 2))
                this.group.add(this.setLine(points4, parameters))
            },
            buildCooler: function (rOut, rIn) {
                const group = new THREE.Group()
                this.coolerMaterial = new THREE.MeshBasicMaterial({color: 0x00BCD4, opacity: 0.3, transparent: true});
                const geometry = new THREE.BoxGeometry(this.yLength, this.upLength, this.xLength);

                const cube1 = new THREE.Mesh(geometry, this.coolerMaterial);
                cube1.position.set(-25, rOut + this.upLength / 2, 0)
                group.add(cube1)

                const cube2 = new THREE.Mesh(geometry, this.coolerMaterial);
                cube2.position.set(this.yLength + 26, rOut + this.upLength / 2, 0)
                group.add(cube2)

                let angle = 90
                let step = 90 / this.arcLength

                const geometryCylinder = new THREE.CylinderGeometry(10, 10, this.xLength, this.xLength);
                for (let i = 1; i < this.arcLength; i += this.arcLength / this.cylinderNum) {
                    let xy1 = this.calculateXY(rOut, rOut, rOut + 14, (angle - i * step) - 180)
                    const cylinder1 = new THREE.Mesh(geometryCylinder, this.coolerMaterial);
                    cylinder1.rotateX(90 * Math.PI / 180)
                    cylinder1.position.set(xy1.x2, xy1.y2, 0)
                    group.add(cylinder1)

                    let xy2 = this.calculateXY(rOut, rOut, rIn - 14, (angle - i * step) - 180)
                    const cylinder2 = new THREE.Mesh(geometryCylinder, this.coolerMaterial);
                    cylinder2.rotateX(90 * Math.PI / 180)
                    cylinder2.position.set(xy2.x2, xy2.y2, 0)
                    group.add(cylinder2)
                }

                for (let i = this.downLength / 2; i <= this.downLength; i += this.downLength / 2) {
                    const cylinder1 = new THREE.Mesh(geometryCylinder, this.coolerMaterial);
                    cylinder1.rotateX(90 * Math.PI / 180)
                    cylinder1.position.set(rOut + i, -14, 0)
                    group.add(cylinder1)

                    const cylinder2 = new THREE.Mesh(geometryCylinder, this.coolerMaterial);
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
                let colors = []
                let positions = []
                if (data.end - data.start >= this.scaleDown) {
                    let n = data.up.left.length
                    let k = data.up.front.length
                    let hk = k / 2
                    // down.down特殊处理，因为总是需要底部的切片
                    // down
                    let step = 90 / (this.arcLength / this.scaleUp)
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < n; j++) {
                            // positions
                            if (data.end <= this.originUpLength) {
                                let z = i - hk
                                positions.push(j, rOut + (this.upLength - data.end / this.scaleDown * this.scaleUp), z)
                            } else if (data.end <= this.originUpLength + this.originArcLength) {
                                let r = rOut - j
                                let xy = this.calculateXY(rOut, rOut, r, ((data.end / this.scaleDown - this.upLength / this.scaleUp) * step) - 180)
                                const x = xy.x2
                                const y = xy.y2
                                let z = i - hk
                                positions.push(x, y, z)
                            } else if (data.end <= this.originLength) {
                                let z = i - hk
                                positions.push(rOut + this.scaleUp * (data.end - this.originUpLength - this.originArcLength) / this.scaleDown, j, z)
                            }
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.down.down[j][i]) % this.originTemperature)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // up
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < n; j++) {
                            // positions
                            if (data.start <= this.originUpLength) {
                                let z = i - hk
                                positions.push(j, rOut + (this.upLength - data.start / this.scaleDown * this.scaleUp), z)
                            } else if (data.start <= this.originUpLength + this.originArcLength) {
                                let r = rOut - j
                                let xy = this.calculateXY(rOut, rOut, r, ((data.start / this.scaleDown - this.upLength / this.scaleUp) * step) - 180)
                                const x = xy.x2
                                const y = xy.y2
                                let z = i - hk
                                positions.push(x, y, z)
                            } else if (data.start <= this.originLength) {
                                let z = i - hk
                                positions.push(rOut + this.scaleUp * (data.start - this.originUpLength - this.originArcLength) / this.scaleDown, j, z)
                            }

                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.up.up[j][i]) % this.originTemperature)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    if (data.end >= this.scaleDown) { // 结晶器部分
                        let end = Math.ceil(Math.min(data.end, this.originUpLength) / this.scaleDown)
                        let start = Math.floor(Math.max(data.start, 0) / this.scaleDown)
                        // left
                        for (let i = 0; i < n; i++) {
                            for (let j = start; j < end; j++) {
                                // positions
                                const x = i
                                const y = rOut + this.upLength - j * this.scaleUp
                                positions.push(x, y, hk)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.up.left[i][j]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // right
                        for (let i = 0; i < n; i++) {
                            for (let j = start; j < end; j++) {
                                // positions
                                const x = i
                                const y = rOut + this.upLength - j * this.scaleUp
                                positions.push(x, y, -hk)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.up.right[i][j]) % this.originTemperature)

                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // front
                        for (let i = 0; i < k; i++) {
                            for (let j = start; j < end; j++) {
                                // positions
                                const z = i - hk
                                const y = rOut + this.upLength - j * this.scaleUp
                                positions.push(n, y, z)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.up.front[i][j]) % this.originTemperature)

                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // back
                        for (let i = 0; i < k; i++) {
                            for (let j = start; j < end; j++) {
                                // positions
                                const z = i - hk
                                const y = rOut + this.upLength - j * this.scaleUp
                                positions.push(0, y, z)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.up.back[i][j]) % this.originTemperature)

                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                    }
                    if (data.end > this.originUpLength) { // 弧形部分
                        let end = Math.ceil(Math.min(data.end, this.originUpLength + this.originArcLength) / this.scaleDown)
                        let start = Math.floor(Math.max(data.start, this.originUpLength) / this.scaleDown)
                        // left
                        for (let i = 0; i < n; i++) {
                            let r = rOut - i
                            for (let j = start; j < end; j++) {
                                // positions
                                let xy = this.calculateXY(rOut, rOut, r, ((j - this.upLength / this.scaleUp) * step) - 180)
                                const x = xy.x2
                                const y = xy.y2
                                positions.push(x, y, hk)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.arc.left[i][j - this.upLength / this.scaleUp]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // right
                        for (let i = 0; i < n; i++) {
                            let r = rOut - i
                            for (let j = start; j < end; j++) {
                                // positions
                                let xy = this.calculateXY(rOut, rOut, r, ((j - this.upLength / this.scaleUp) * step) - 180)
                                const x = xy.x2
                                const y = xy.y2
                                positions.push(x, y, -hk)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.arc.right[i][j - this.upLength / this.scaleUp]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // back
                        for (let i = 0; i < k; i++) {
                            for (let j = start; j < end; j++) {
                                // positions
                                let xy = this.calculateXY(rOut, rOut, rOut, ((j - this.upLength / this.scaleUp) * step) - 180)
                                const x = xy.x2
                                const y = xy.y2
                                positions.push(x, y, i - hk)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.arc.back[i][j - this.upLength / this.scaleUp]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // front
                        for (let i = 0; i < k; i++) {
                            for (let j = start; j < end; j++) {
                                // positions
                                let xy = this.calculateXY(rOut, rOut, rIn, ((j - this.upLength / this.scaleUp) * step) - 180)
                                const x = xy.x2
                                const y = xy.y2
                                positions.push(x, y, i - hk)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.arc.front[i][j - this.upLength / this.scaleUp]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                    }

                    if (data.end > this.originUpLength + this.originArcLength && data.end <= this.originLength) { // 出口部分
                        let end = Math.ceil(Math.min(data.end, this.originLength) / this.scaleDown)
                        let start = Math.floor(Math.max(data.start, this.originUpLength + this.originArcLength) / this.scaleDown)
                        // left
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < n; j++) {
                                // positions
                                const x = rOut + (i - (this.upLength + this.arcLength) / this.scaleUp) * this.scaleUp
                                positions.push(x, j, hk)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.down.left[j][i - (this.upLength + this.arcLength) / this.scaleUp]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // right
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < n; j++) {
                                // positions
                                const x = rOut + (i - (this.upLength + this.arcLength) / this.scaleUp) * this.scaleUp
                                positions.push(x, j, -hk)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.down.right[j][i - (this.upLength + this.arcLength) / 2]) % this.originTemperature)

                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // back
                        for (let i = 0; i < k; i++) {
                            for (let j = start; j < end; j++) {
                                // positions
                                const z = i - hk
                                const x = rOut + (j - (this.upLength + this.arcLength) / this.scaleUp) * this.scaleUp
                                positions.push(x, 0, z)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.down.back[i][j - (this.upLength + this.arcLength) / this.scaleUp]) % this.originTemperature)

                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // front
                        for (let i = 0; i < k; i++) {
                            for (let j = start; j < end; j++) {
                                // positions
                                const z = i - hk
                                const x = rOut + (j - (this.upLength + this.arcLength) / this.scaleUp) * this.scaleUp
                                positions.push(x, n, z)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.down.front[i][j - (this.upLength + this.arcLength) / this.scaleUp]) % this.originTemperature)

                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                    }
                }
                this.colors = colors
                this.positions = positions
                this.points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
                this.points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
                this.points.geometry.computeBoundingSphere();
            },
            buildInternalShapesFull: function (rOut, rIn, data) {
                let start = new Date().getTime()
                let n = data.up.left.length
                let mUp = data.up.left[0].length
                let mDown = data.down.left[0].length
                let k = data.up.front.length
                let a = data.arc.left[0].length
                let colors = []
                // down
                for (let i = 0; i < k; i++) {
                    for (let j = 0; j < n; j++) {
                        // colors
                        const arr = this.heatmap.pickColor(Math.floor(data.down.down[j][i]) % this.originTemperature)

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
                        const arr = this.heatmap.pickColor(Math.floor(data.up.up[j][i]) % this.originTemperature)

                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255

                        colors.push(vx, vy, vz)
                    }
                }
                { // 结晶器部分
                    // left
                    for (let i = 0; i < n; i++) {
                        for (let j = 0; j < mUp; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.up.left[i][j]) % this.originTemperature)
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
                            const arr = this.heatmap.pickColor(Math.floor(data.up.right[i][j]) % this.originTemperature)

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
                            const arr = this.heatmap.pickColor(Math.floor(data.up.front[i][j]) % this.originTemperature)

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
                            const arr = this.heatmap.pickColor(Math.floor(data.up.back[i][j]) % this.originTemperature)

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
                            const arr = this.heatmap.pickColor(Math.floor(data.arc.left[i][j]) % this.originTemperature)
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
                            const arr = this.heatmap.pickColor(Math.floor(data.arc.right[i][j]) % this.originTemperature)
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
                            const arr = this.heatmap.pickColor(Math.floor(data.arc.back[i][j]) % this.originTemperature)
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
                            const arr = this.heatmap.pickColor(Math.floor(data.arc.front[i][j]) % this.originTemperature)
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
                            const arr = this.heatmap.pickColor(Math.floor(data.down.left[j][i]) % this.originTemperature)
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
                            const arr = this.heatmap.pickColor(Math.floor(data.down.right[j][i]) % this.originTemperature)

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
                            const arr = this.heatmap.pickColor(Math.floor(data.down.back[i][j]) % this.originTemperature)

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
                            const arr = this.heatmap.pickColor(Math.floor(data.down.front[i][j]) % this.originTemperature)

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
                console.log("更新所有的点颜色所用时间: ", end - start)
            },
            buildInternalShapes: function () {
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
                geometry.computeBoundingSphere();
                const material = new THREE.PointsMaterial({size: 5, vertexColors: true});
                this.points = new THREE.Points(geometry, material);
                this.group.add(this.points)
            },
            calculateXY: function (x1, y1, r, angle) {
                return {
                    x2: x1 + r * Math.cos(angle * Math.PI / 180),
                    y2: y1 + r * Math.sin(angle * Math.PI / 180)
                }
            },
            switchVisibility: function () {
                this.coolerMaterial.visible = this.visible
            }
        },
        mounted() {

            this.upLength = this.originUpLength / this.scaleDown * this.scaleUp
            this.downLength = this.originDownLength / this.scaleDown * this.scaleUp
            this.arcLength = this.originArcLength / this.scaleDown * this.scaleUp

            this.container = document.getElementById("container")
            this.width = this.container.clientWidth
            this.height = this.container.clientHeight

            let r = parseFloat((this.arcLength * 4 / (Math.PI * 2)).toFixed(4))
            this.rOut = r + this.yLength / 2
            this.rIn = r - this.yLength / 2

            this.init()
            this.animate()
            this.$root.$on("new_field_data", (data) => {
                console.log(data)
                if (data.is_full) {
                    this.fullCount++
                    if (this.fullCount > 2) {
                        this.fullCount = 2
                    }
                }
                if (!data.is_full || this.fullCount === 1) { // 第一次切片充满时需要添加新增加切片的位置数据
                    console.log("not full")
                    this.buildInternalShapesNotFull(this.rOut, this.rIn, data)
                } else {
                    console.log("full")
                    this.buildInternalShapesFull(this.rOut, this.rIn, data)
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