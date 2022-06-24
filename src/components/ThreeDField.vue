<template>
    <div id="container">
        <el-switch
                v-if="casterLoaded"
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
    import {FontLoader} from 'three/examples/jsm/loaders/FontLoader';
    import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry'
    import fontJson from '../assets/fonts/helvetiker_bold.typeface.json'

    export default {
        name: "ThreeDField",
        data() {
            return {
                casterLoaded: false,

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
                // 铸机尺寸配置
                zScale: 10,
                xScale: 5,
                yScale: 5,
                originXLength: 0,
                originYLength: 0,
                originMd: 0,
                xLength: 0,
                yLength: 0,
                md: 0, // 结晶器长度
                levelHeight: 0,
                centerStart: 0,
                centerEnd: 0,
                arcStart: 0,
                arcEnd: 0,

                coolerMaterial: undefined,
                rollerMaterials: undefined,
                visible: true,

                originTemperature: 1601,

                fullCount: 0, // 记录切片充满的次数，第一次特殊处理
                // 三维字体配置
                fontHeight: 2,
                fontSize: 12,
                curveSegments: 10,
                bevelThickness: 0.1,
                bevelSize: 0.3,
                bevelSegments: 3,
                bevelEnabled: true,
                font: undefined,
                textMatForCaster: undefined,
                textMatForCooling: undefined,

                // 标记
                matForCaster: undefined,
                matForCooling: undefined
            }
        },
        methods: {
            init: function () {
                this.scene = new THREE.Scene()

                this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 10000)
                this.camera.position.set(0, 0, 1550);

                this.scene.add(new THREE.AmbientLight(0xffffff))

                this.scene.background = new THREE.Color(0xffffff)

                this.group = new THREE.Group()
                this.group.position.set(-200, 300, 0)
                this.scene.add(this.group)

                this.heatmap = this.createPalette()

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
                let width = 100, height = 820

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

                ctx.font = '16px "微软雅黑"'
                ctx.fillStyle = "white"
                ctx.textBaseline = "top"
                for (let text of texts) {
                    ctx.fillText(text.char, text.x, text.y)
                }

                return {colorData: ctx.getImageData(0, 0, width, height).data, canvas: paletteCanvas}
            },
            buildShapes: function (coordinate, rollers, coolingZones, segments) {
                // outline
                this.buildCooler(this.rOut, this.rIn, coordinate, rollers, coolingZones, segments)

                // internal
                this.buildInternalShapes()
            },
            buildCooler: function (rOut, rIn, coordinate, rollers, coolingZones, segments) {
                let mdDistanceToCenter = coordinate.center_start_distance / this.zScale + coordinate.level_height / this.zScale - this.md / 2
                const group = new THREE.Group()
                this.coolerMaterial = new THREE.MeshBasicMaterial({
                    color: 0x0097A7,
                    opacity: 0.5,
                    transparent: true,
                });
                // 宽面
                const geometry1 = new THREE.BoxGeometry(this.yLength / 2, this.md, this.xLength);
                const cube1 = new THREE.Mesh(geometry1, this.coolerMaterial);
                cube1.position.set(-rOut - this.yLength / 4, mdDistanceToCenter, 0)
                group.add(cube1)

                const cube2 = new THREE.Mesh(geometry1, this.coolerMaterial);
                cube2.position.set(-rIn + this.yLength / 4, mdDistanceToCenter, 0)
                group.add(cube2)
                // 窄面
                const geometry2 = new THREE.BoxGeometry(this.yLength, this.md, this.yLength / 2);
                const cube3 = new THREE.Mesh(geometry2, this.coolerMaterial);
                cube3.position.set(-rOut + this.yLength / 2, mdDistanceToCenter, this.xLength / 2 + this.yLength / 4)
                group.add(cube3)

                const cube4 = new THREE.Mesh(geometry2, this.coolerMaterial);
                cube4.position.set(-rOut + this.yLength / 2, mdDistanceToCenter, -this.xLength / 2 - this.yLength / 4)
                group.add(cube4)

                let roller = {}
                let position = 0, xIn = 0, yIn = 0, xOut = 0, yOut = 0, angle = 0
                for (let i = 0; i < rollers.length; i += 1) {
                    roller = rollers[i]
                    position = (roller.distance + coordinate.level_height) / this.zScale
                    let geometryCylinder = new THREE.CylinderGeometry(roller.outer_diameter / this.zScale / 2, roller.outer_diameter / this.zScale / 2, this.xLength, this.xLength)
                    const cylinder1 = new THREE.Mesh(geometryCylinder, this.coolerMaterial)
                    cylinder1.rotateX(90 * Math.PI / 180)
                    const cylinder2 = new THREE.Mesh(geometryCylinder, this.coolerMaterial);
                    cylinder2.rotateX(90 * Math.PI / 180)
                    if (position < this.centerStart) {
                        xOut = -rOut - roller.outer_diameter / this.zScale / 2
                        yOut = roller.outer_y / this.zScale
                        xIn = -rIn + roller.inner_diameter / this.zScale / 2
                        yIn = roller.inner_y / this.zScale
                    } else if (position >= this.centerStart && position <= this.centerEnd) {
                        angle = 90 * (roller.distance - coordinate.center_start_distance) / this.arcLength * Math.PI / 180
                        let xy1 = this.calculateXY(0, 0, rOut + roller.outer_diameter / this.zScale / 2, angle)
                        xOut = xy1.x2
                        yOut = xy1.y2
                        let xy2 = this.calculateXY(0, 0, rIn - roller.inner_diameter / this.zScale / 2, angle)
                        xIn = xy2.x2
                        yIn = xy2.y2
                    } else {
                        xOut = roller.outer_x / this.zScale
                        yOut = -rOut - roller.outer_diameter / this.zScale / 2
                        xIn = roller.inner_x / this.zScale
                        yIn = -rIn + roller.inner_diameter / this.zScale / 2
                    }
                    cylinder1.position.set(xOut, yOut, 0)
                    cylinder2.position.set(xIn, yIn, 0)
                    group.add(cylinder1)
                    group.add(cylinder2)
                }

                this.group.add(group)
                // 添加冷却区和设备分区标记
                this.loadFont(rIn, coordinate, rollers, coolingZones, segments)
                // 添加冷却区和设备分区划分标记
                this.buildMark(rIn, coordinate, rollers, coolingZones, segments)
                this.casterLoaded = true
            },
            loadFont: function (rIn, coordinate, rollers, coolingZones, segments) {
                let offset = 70 // 冷却区标记放置位置偏移量
                let offset1 = 170 // 设备标记放置位置偏移量
                let mdDistanceToCenter = (coordinate.center_start_distance + coordinate.level_height) / this.zScale - this.md / 2

                this.textMatForCaster = new THREE.MeshLambertMaterial({color: 0x212121})
                this.textMatForCooling = new THREE.MeshLambertMaterial({color: 0x00796B})
                let loader = new FontLoader()
                this.font = loader.parse(fontJson);

                // 结晶器标记
                this.createText("MD", -rIn + offset, mdDistanceToCenter, 0, 0, this.textMatForCaster);

                let zone = {}
                let x, y, angle = 0
                let position, index = 0
                // 构建冷却区标记
                for (let i = 0; i < coolingZones.length; i++) {
                    zone = coolingZones[i]
                    index = ((zone.start + zone.end) >> 1) - 1
                    position = (rollers[index].distance + coordinate.level_height) / this.zScale
                    if (position < this.centerStart) {
                        x = -rIn + offset
                        y = rollers[index].inner_y / this.zScale
                        angle = 0
                    } else if (position >= this.centerStart && position <= this.centerEnd) {
                        angle = 90 * (rollers[index].distance - coordinate.center_start_distance) / this.arcLength * Math.PI / 180
                        let xy = this.calculateXY(0, 0, rIn - offset, angle)
                        x = xy.x2
                        y = xy.y2
                    } else {
                        x = rollers[index].inner_x / this.zScale
                        y = -rIn + offset
                        angle = 90 * Math.PI / 180
                    }
                    this.createText(zone.zone_name, x, y, this.xLength / 2, angle, this.textMatForCooling);
                }
                let segment = {}
                // 构建设备标记
                for (let i = 1; i < segments.length; i++) {
                    segment = segments[i]
                    index = ((segment.start + segment.end) >> 1) - 1
                    position = (rollers[index].distance + coordinate.level_height) / this.zScale
                    if (position < this.centerStart) {
                        x = -rIn + offset1
                        y = rollers[index].inner_y / this.zScale
                        angle = 0
                    } else if (position >= this.centerStart && position <= this.centerEnd) {
                        angle = 90 * (rollers[index].distance - coordinate.center_start_distance) / this.arcLength * Math.PI / 180
                        let xy = this.calculateXY(0, 0, rIn - offset1, angle)
                        x = xy.x2
                        y = xy.y2
                    } else {
                        x = rollers[index].inner_x / this.zScale
                        y = -rIn + offset1
                        angle = 90 * Math.PI / 180
                    }
                    this.createText(segment.seg, x, y, 0, angle, this.textMatForCaster);
                }
            },
            createText: function (txt, x, y, z, angle, material) {
                let textGeo = new TextGeometry(txt, {
                    font: this.font,
                    size: this.fontSize,
                    height: this.fontHeight,
                    curveSegments: this.curveSegments,
                    weight: "normal",
                    bevelThickness: this.bevelThickness,
                    bevelSize: this.bevelSize,
                    bevelSegments: this.bevelSegments,
                    bevelEnabled: this.bevelEnabled
                });
                textGeo.computeBoundingBox();
                textGeo.computeVertexNormals();
                let text = new THREE.Mesh(textGeo, material)
                text.position.set(x, y, z)
                text.rotateZ(angle)
                text.castShadow = true;
                this.group.add(text)
            },
            buildMark: function (rIn, coordinate, rollers, coolingZones, segments) {
                let offset = 50 // 冷却区标记长度
                let offset1 = 150 // 设备标记长度
                const group = new THREE.Group()
                this.matForCaster = new THREE.LineBasicMaterial({color: 0x212121})
                this.matForCooling = new THREE.LineBasicMaterial({color: 0x00796B})

                let zone = {}
                let zForCaster = 0
                let zForCooling = this.xLength / 2
                // 构建冷却区标记
                for (let i = 0; i < coolingZones.length; i++) {
                    zone = coolingZones[i]
                    this.buildMarkHelper1(zone.start - 1, rollers, coordinate, this.rIn, offset, this.matForCooling, group, zForCooling)
                    this.buildMarkHelper1(zone.end - 1, rollers, coordinate, this.rIn, offset, this.matForCooling, group, zForCooling)
                    this.buildMarkHelper2(zone.start - 1, zone.end - 1, rollers, coordinate, rIn, offset, this.matForCooling, group, zForCooling)
                }

                // 构建设备标记
                let segment = {}
                for (let i = 1; i < segments.length; i++) {
                    segment = segments[i]
                    this.buildMarkHelper1(segment.start - 1, rollers, coordinate, this.rIn, offset1, this.matForCaster, group, zForCaster)
                    this.buildMarkHelper1(segment.end - 1, rollers, coordinate, this.rIn, offset1, this.matForCaster, group, zForCaster)
                    this.buildMarkHelper2(segment.start - 1, segment.end - 1, rollers, coordinate, rIn, offset1, this.matForCaster, group, zForCaster)
                }

                this.group.add(group)
            },
            buildMarkHelper2: function (start, end, rollers, coordinate, rIn, offset, material, group, z) {
                let position, angle = 0
                let x1, y1, x2, y2
                let points = []
                position = (rollers[start].distance + coordinate.level_height) / this.zScale
                if (position <= this.centerStart) {
                    x1 = -rIn + offset
                    y1 = rollers[start].inner_y / this.zScale
                } else if (position >= this.centerStart && position <= this.centerEnd) {
                    angle = 90 * (rollers[start].distance - coordinate.center_start_distance) / this.arcLength * Math.PI / 180
                    let xy1 = this.calculateXY(0, 0, rIn - offset, angle)
                    x1 = xy1.x2
                    y1 = xy1.y2
                } else {
                    x1 = rollers[start].inner_x / this.zScale
                    y1 = -rIn + offset
                }
                position = (rollers[end].distance + coordinate.level_height) / this.zScale
                if (position <= this.centerStart) {
                    x2 = -rIn + offset
                    y2 = rollers[end].inner_y / this.zScale
                } else if (position >= this.centerStart && position <= this.centerEnd) {
                    angle = 90 * (rollers[end].distance - coordinate.center_start_distance) / this.arcLength * Math.PI / 180
                    let xy1 = this.calculateXY(0, 0, rIn - offset, angle)
                    x2 = xy1.x2
                    y2 = xy1.y2
                } else {
                    x2 = rollers[end].inner_x / this.zScale
                    y2 = -rIn + offset
                }
                points.push(new THREE.Vector3(x1, y1, z), new THREE.Vector3(x2, y2, z))
                group.add(this.setLine(points, material))
            },
            buildMarkHelper1: function (index, rollers, coordinate, rIn, offset, material, group, z) {
                let position, angle = 0
                let x1, y1, x2, y2
                let points = []
                position = (rollers[index].distance + coordinate.level_height) / this.zScale
                if (position <= this.centerStart) {
                    x1 = -rIn
                    y1 = rollers[index].inner_y / this.zScale
                    x2 = x1 + offset
                    y2 = y1
                } else if (position >= this.centerStart && position <= this.centerEnd) {
                    angle = 90 * (rollers[index].distance - coordinate.center_start_distance) / this.arcLength * Math.PI / 180
                    let xy1 = this.calculateXY(0, 0, rIn, angle)
                    x1 = xy1.x2
                    y1 = xy1.y2
                    let xy2 = this.calculateXY(0, 0, rIn - offset, angle)
                    x2 = xy2.x2
                    y2 = xy2.y2
                } else {
                    x1 = rollers[index].inner_x / this.zScale
                    y1 = -rIn
                    x2 = x1
                    y2 = y1 + offset
                }
                points.push(new THREE.Vector3(x1, y1, z), new THREE.Vector3(x2, y2, z))
                group.add(this.setLine(points, material))
            },
            setLine: function (points, material) {
                const geometry = new THREE.BufferGeometry().setFromPoints(points)
                return new THREE.Line(geometry, material)
            },
            buildInternalShapesNotFull(rOut, rIn, data) {
                let colors = []
                let positions = []
                let xStep = data.x_scale
                let yStep = data.y_scale
                let zStep = data.z_scale
                let width = data.sides.up.length
                let length = data.sides.up[0].length
                let halfLength = length / 2 * xStep
                if (data.end - data.start >= zStep) {
                    // down特殊处理，因为总是需要底部的切片
                    for (let i = 0; i < width; i++) {
                        for (let j = 0; j < length; j++) {
                            // positions
                            if (data.end <= this.centerStart) {
                                let z = j * xStep - halfLength
                                positions.push(-rIn - i * yStep, this.centerStart - data.end - this.levelHeight, z)
                            } else if (data.end <= this.centerEnd) {
                                let r = rIn + i * yStep
                                let xy = this.calculateXY(0, 0, r, 90 * (data.end - this.centerStart) * this.zScale / this.arcLength * Math.PI / 180)
                                const x = xy.x2
                                const y = xy.y2
                                let z = j * xStep - halfLength
                                positions.push(x, y, z)
                            } else {
                                let z = j * xStep - halfLength
                                positions.push(data.end - this.centerEnd, -rIn - i * yStep, z)
                            }
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.down[i][j]) % this.originTemperature)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // up
                    for (let i = 0; i < width; i++) {
                        for (let j = 0; j < length; j++) {
                            // positions
                            if (data.start <= this.centerStart) {
                                let z = j * xStep - halfLength
                                positions.push(-rIn - i * yStep, this.centerStart - data.start - this.levelHeight, z)
                            } else if (data.start <= this.centerEnd) {
                                let r = rIn + i * yStep
                                let xy = this.calculateXY(0, 0, r, 90 * (data.start - this.centerStart)  * this.zScale / this.arcLength * Math.PI / 180)
                                const x = xy.x2
                                const y = xy.y2
                                let z = j * xStep - halfLength
                                positions.push(x, y, z)
                            } else {
                                let z = j * xStep - halfLength
                                positions.push(data.start - this.centerEnd, -rIn - i * yStep, z)
                            }
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.up[i][j]) % this.originTemperature)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    if (data.end - data.start >= zStep) { // 入口部分
                        let end = Math.ceil(Math.min(data.end, this.centerStart) / zStep)
                        let start = Math.floor(Math.max(data.start, 0) / zStep)
                        // left
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < width; j++) {
                                // positions
                                const x = -rIn - j * yStep
                                const y = this.centerStart - i * zStep - this.levelHeight
                                positions.push(x, y, halfLength)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.left[i][j]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // right
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < width; j++) {
                                // positions
                                const x = -rIn - j * yStep
                                const y = this.centerStart - i * zStep - this.levelHeight
                                positions.push(x, y, -halfLength)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.right[i][j]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // front
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < length; j++) {
                                // positions
                                const z = j * xStep - halfLength
                                const y = this.centerStart - i * zStep - this.levelHeight
                                positions.push(-rIn, y, z)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.front[i][j]) % this.originTemperature)

                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                        // back
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < length; j++) {
                                // positions
                                const z = j * xStep - halfLength
                                const y = this.centerStart - i * zStep - this.levelHeight
                                positions.push(-rOut, y, z)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.back[i][j]) % this.originTemperature)

                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                        }
                    }
                    if (data.end > this.centerStart) { // 弧形部分
                        let end = Math.ceil(Math.min(data.end, this.centerEnd) / zStep)
                        let start = Math.floor(Math.max(data.start, this.centerStart) / zStep)
                        // left
                        let xStart = 0
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < width; j++) {
                                // positions
                                let xy = this.calculateXY(0, 0, rIn + j * yStep, 90 * xStart * zStep * this.zScale / this.arcLength * Math.PI / 180)
                                const x = xy.x2
                                const y = xy.y2
                                positions.push(x, y, halfLength)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.left[i][j]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                            xStart++
                        }
                        // right
                        xStart = 0
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < width; j++) {
                                // positions
                                let xy = this.calculateXY(0, 0, rIn + j * yStep, 90 * xStart * zStep * this.zScale / this.arcLength * Math.PI / 180)
                                const x = xy.x2
                                const y = xy.y2
                                positions.push(x, y, -halfLength)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.right[i][j]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                            xStart++
                        }
                        // back
                        xStart = 0
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < length; j++) {
                                // positions
                                let xy = this.calculateXY(0, 0, rOut, 90 * xStart * zStep * this.zScale / this.arcLength * Math.PI / 180)
                                const x = xy.x2
                                const y = xy.y2
                                positions.push(x, y, j * xStep - halfLength)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.back[i][j]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                            xStart++
                        }
                        // front
                        xStart = 0
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < length; j++) {
                                // positions
                                let xy = this.calculateXY(0, 0, rIn, 90 * xStart * zStep * this.zScale / this.arcLength * Math.PI / 180)
                                const x = xy.x2
                                const y = xy.y2
                                positions.push(x, y, j * xStep - halfLength)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.front[i][j]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                            xStart++
                        }
                    }

                    if (data.end > this.centerEnd) { // 出口部分
                        let end = Math.ceil(data.end / zStep)
                        let start = Math.floor(Math.max(data.start, this.centerEnd) / zStep)
                        // left
                        let xStart = 0
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < width; j++) {
                                // positions
                                positions.push(xStart * zStep, -(rIn + j * yStep), halfLength)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.left[i][j]) % this.originTemperature)
                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                            xStart++
                        }
                        // right
                        xStart = 0
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < width; j++) {
                                // positions
                                positions.push(xStart * zStep, -(rIn + j * yStep), -halfLength)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.right[i][j]) % this.originTemperature)

                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                            xStart++
                        }
                        // back
                        xStart = 0
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < length; j++) {
                                // positions
                                const z = j * xStep - halfLength
                                positions.push(xStart * zStep, -rOut, z)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.back[i][j]) % this.originTemperature)

                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                            xStart++
                        }
                        // front
                        xStart = 0
                        for (let i = start; i < end; i++) {
                            for (let j = 0; j < length; j++) {
                                // positions
                                const z = j * xStep - halfLength
                                positions.push(xStart * zStep, -rIn, z)
                                // colors
                                const arr = this.heatmap.pickColor(Math.floor(data.sides.front[i][j]) % this.originTemperature)

                                const vx = arr[0] / 255
                                const vy = arr[1] / 255
                                const vz = arr[2] / 255

                                colors.push(vx, vy, vz)
                            }
                            xStart++
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
                let colors = []
                let width = data.sides.up.length
                let length = data.sides.up[0].length
                // down
                for (let i = 0; i < width; i++) {
                    for (let j = 0; j < length; j++) {
                        // colors
                        const arr = this.heatmap.pickColor(Math.floor(data.sides.down[i][j]) % this.originTemperature)

                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255

                        colors.push(vx, vy, vz)
                    }
                }
                // up
                for (let i = 0; i < width; i++) {
                    for (let j = 0; j < length; j++) {
                        // colors
                        const arr = this.heatmap.pickColor(Math.floor(data.sides.up[i][j]) % this.originTemperature)

                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255

                        colors.push(vx, vy, vz)
                    }
                }
                { // 结晶器部分
                    let end = Math.ceil(Math.min(data.end, this.centerStart))
                    let start = Math.floor(Math.max(data.start, 0))
                    // left
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < width; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.left[i][j]) % this.originTemperature)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // right
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < width; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.right[i][j]) % this.originTemperature)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // front
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < length; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.front[i][j]) % this.originTemperature)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // back
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < length; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.back[i][j]) % this.originTemperature)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                }

                { // 弧形部分
                    let end = Math.ceil(Math.min(data.end, this.centerEnd))
                    let start = Math.floor(Math.max(data.start, this.centerStart))
                    // left
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < width; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.left[i][j]) % this.originTemperature)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // right
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < width; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.right[i][j]) % this.originTemperature)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // back
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < length; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.back[i][j]) % this.originTemperature)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // front
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < length; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.front[i][j]) % this.originTemperature)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                }

                { // 出口部分
                    let end = Math.ceil(data.end)
                    let start = Math.floor(Math.max(data.start, this.centerEnd))
                    // left
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < width; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.left[i][j]) % this.originTemperature)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // right
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < width; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.right[i][j]) % this.originTemperature)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // back
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < length; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.back[i][j]) % this.originTemperature)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                    // front
                    for (let i = start; i < end; i++) {
                        for (let j = 0; j < length; j++) {
                            // colors
                            const arr = this.heatmap.pickColor(Math.floor(data.sides.front[i][j]) % this.originTemperature)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            colors.push(vx, vy, vz)
                        }
                    }
                }
                this.colors = colors
                this.points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
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
                    x2: x1 - r * Math.cos(angle),
                    y2: y1 - r * Math.sin(angle)
                }
            },
            switchVisibility: function () {
                this.coolerMaterial.visible = this.visible
                this.textMatForCaster.visible = this.visible
                this.textMatForCooling.visible = this.visible
                this.matForCaster.visible = this.visible
                this.matForCooling.visible = this.visible
            }
        },
        mounted() {
            this.container = document.getElementById("container")
            this.width = this.container.clientWidth
            this.height = this.container.clientHeight

            this.init()
            this.animate()

            let self = this
            this.$root.$on("caster_info", (data) => {
                console.log(data)
                self.originMd = data.md.length
                self.originXLength = data.coordinate.length
                self.originYLength = data.coordinate.width
                self.levelHeight = data.coordinate.level_height / self.zScale

                self.zScale = data.coordinate.z_scale
                self.xScale = data.coordinate.x_scale
                self.yScale = data.coordinate.y_scale

                self.md = self.originMd / self.zScale
                self.xLength = self.originXLength / self.xScale
                self.yLength = self.originYLength / self.yScale

                self.rOut = data.coordinate.r / self.zScale
                self.rIn = self.rOut - self.yLength

                self.arcLength = data.coordinate.center_end_distance - data.coordinate.center_start_distance

                // 获取近似圆弧的起始位置距离液面的距离
                self.centerStart = (data.coordinate.center_start_distance + data.coordinate.level_height) / self.zScale
                self.centerEnd = (data.coordinate.center_end_distance + data.coordinate.level_height) / self.zScale
                self.arcStart = (data.coordinate.arc_start_distance + data.coordinate.level_height) / self.zScale
                self.arcEnd = (data.coordinate.arc_end_distance + data.coordinate.level_height) / self.zScale

                self.buildShapes(data.coordinate, data.secondary_cooling_zone, data.cooling_zone, data.segments)
            })

            this.$root.$on("new_field_data", (data) => {
                console.log(data)

                if (data.is_full) {
                    this.fullCount++
                    if (this.fullCount > 2) {
                        this.fullCount = 2
                    }
                }
                if (!data.is_full || this.fullCount === 1) { // 第一次切片充满时需要添加新增加切片的位置数据
                    // console.log("not full")
                    this.buildInternalShapesNotFull(this.rOut, this.rIn, data)
                } else {
                    // console.log("full")
                    this.buildInternalShapesFull(this.rOut, this.rIn, data)
                }
            })

            this.$root.$on("data_generated", (data) => {
                console.log(data)
                this.buildInternalShapesNotFull(this.rOut, this.rIn, data)
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