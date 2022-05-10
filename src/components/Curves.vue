<template>
    <div id="curves_container">
        <el-tabs type="border-card">
            <el-tab-pane label="纵切面温度分布云图">
                <div class="info">
                    <div>固相线交汇处：{{solidJoin * 10}} mm</div>
                    <br>
                    <div>液相线交汇处：{{liquidJoin * 10}} mm</div>
                </div>
                <div id="canvas_container" style="width: 100%; height: 820px;"></div>
                <div class="slice_bottom">
                    <div class="slider_container">
                        <div>
                            <span class="demonstration">距离铸坯边界距离mm</span>
                            <el-slider
                                    :max="max"
                                    v-model="index2"
                                    :step="1">
                            </el-slider>
                        </div>
                    </div>
                    <div class="operation">
                        <el-input-number size="mini" v-model="index2" :step="1" :max="max" :min="1"></el-input-number>
                        <el-button size="mini" style="margin-left: 10px;" round type="primary"
                                   @click="showVerticalSlice2AtIndex(index2 - 1)">查看对应距离纵切片数据
                        </el-button>
                    </div>
                </div>
                <div class="distance_bottom">
                    <div class="slider_container">
                        <div class="block block1 slider-demo-block">
                            <span class="demonstration">设备分区信息</span>
                            <el-slider
                                    @change="showEdgeAtYIndex(yIndex)"
                                    :max="maxZLength"
                                    :marks="casterMarks"
                                    v-model="yIndex"
                                    :step="1">
                            </el-slider>
                        </div>
                        <div class="block block2 slider-demo-block">
                            <span class="demonstration">冷却区分区信息</span>
                            <el-slider
                                    @change="showEdgeAtYIndex(yIndex)"
                                    :max="maxZLength"
                                    :marks="coolingMarks"
                                    v-model="yIndex"
                                    :step="1">
                            </el-slider>
                        </div>
                    </div>
                </div>
            </el-tab-pane>
            <el-tab-pane label="纵切面温度变化曲线">
                <v-chart class="chart" :option="option"></v-chart>
                <div class="bottom">
                    <div class="slider_container">
                        <div class="block block1 slider-demo-block">
                            <span class="demonstration">距离铸坯边界距离mm</span>
                            <el-slider
                                    :max="max"
                                    :min="1"
                                    v-model="index1"
                                    :step="1">
                            </el-slider>
                        </div>
                    </div>
                    <div class="operation">
                        <el-input-number size="normal" v-model="index1" :step="1" :max="max" :min="1"></el-input-number>
                        <el-button size="normal" style="margin-left: 10px;" round type="primary"
                                   @click="showVerticalSlice1AtIndex(index1)">查看对应距离纵切片温度曲线数据
                        </el-button>
                    </div>
                </div>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
    import {use} from "echarts/core";
    import {LineChart} from "echarts/charts";
    import VChart from "vue-echarts";
    // import ECharts modules manually to reduce bundle size
    import {CanvasRenderer} from 'echarts/renderers'
    import {GridComponent, LegendComponent, TooltipComponent} from 'echarts/components'
    import * as THREE from "three";
    import {FontLoader} from "three/examples/jsm/loaders/FontLoader";
    import fontJson from "../assets/fonts/helvetiker_bold.typeface.json";
    import {TextGeometry} from "three/examples/jsm/geometries/TextGeometry";

    use([
        CanvasRenderer,
        LineChart,
        GridComponent,
        TooltipComponent,
        LegendComponent
    ])

    export default {
        components: {
            VChart
        },
        props: ['conn', 'config'],
        data() {
            return {
                max: 1,
                maxZLength: 1,
                index1: 1,
                option: {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {type: 'cross'}
                    },
                    legend: {
                        orient: "vertical",
                        left: "right",
                        data: ["沿外弧方向", "沿中轴方向"]
                    },
                    xAxis: [
                        {
                            type: 'value',
                            name: '离液面距离',
                            min: 0,
                            max: 0,
                            position: 'left',
                            axisLabel: {
                                formatter: '{value} mm'
                            }
                        }
                    ],
                    yAxis: [
                        {
                            type: 'value',
                            name: '温度',
                            min: 0,
                            max: 1600,
                            position: 'left',
                            axisLabel: {
                                formatter: '{value} ℃'
                            }
                        }
                    ],
                    series: [
                        {
                            name: "沿外弧方向",
                            type: 'line',
                            smooth: true,
                            xAxisIndex: 0,
                            yAxisIndex: 0,
                            data: []
                        },

                        {
                            name: "沿中轴方向",
                            type: 'line',
                            smooth: true,
                            xAxisIndex: 0,
                            yAxisIndex: 0,
                            data: []
                        },
                    ]
                },
                container: undefined,
                width: 0,
                height: 0,
                heatmap: undefined,
                scene: undefined,
                camera: undefined,
                group: undefined,
                renderer: undefined,
                originTemperature: 1601,
                points: undefined,
                positions: [],
                colors: [],
                temps: [],
                arcLength: 0,
                xLength: 0,
                yLength: 0,
                zScale: 10,
                xScale: 5,
                yScale: 5,
                zScaleUp: 5,
                yScaleUp: 2,
                scaleDown: 1.5,
                rOut: 0,
                rIn: 0,

                index2: 1,
                yIndex: 0,
                casterMarks: {
                    0: '',
                },
                coolingMarks: {
                    0: '',
                },
                curvePointsLiquid: undefined,
                liquidColors: [],
                liquidPositions: [],
                curvePointsSolid: undefined,
                solidColors: [],
                solidPositions: [],
                liquidSolidPositions: {
                    liquid: [],
                    solid: [],
                    liquidJoin: {},
                    solidJoin: {}
                },

                solidJoin: 0,
                liquidJoin: 0,

                textMat: undefined,
                font: undefined,
                fontHeight: 2,
                fontSize: 15,
                curveSegments: 10,
                bevelThickness: 0.1,
                bevelSize: 0.3,
                bevelSegments: 3,
                bevelEnabled: true,

                line: undefined,
            }
        },
        mounted() {
            this.$nextTick(function () {
                this.container = document.getElementById("canvas_container")
                this.width = this.container.clientWidth
                this.height = this.container.clientHeight
                console.log(this.container.clientWidth, this.container.clientHeight)

                this.maxZLength = this.config.coordinate.z_length
                this.max = this.config.coordinate.length / 2

                this.zScale = this.config.coordinate.z_scale
                this.xScale = this.config.coordinate.x_scale
                this.yScale = this.config.coordinate.y_scale

                this.xLength = this.config.coordinate.length / this.xScale
                this.yLength = this.config.coordinate.width / this.yScale

                this.rOut = this.config.coordinate.r / this.zScale
                this.rIn = this.rOut - this.yLength

                this.upLength = this.config.coordinate.center_start_distance / this.zScale
                this.arcLength = (this.config.coordinate.center_end_distance - this.config.coordinate.center_start_distance) / this.zScale
                this.downLength = (this.config.coordinate.z_length - this.config.coordinate.center_end_distance) / this.zScale

                this.option.xAxis[0].max = this.config.coordinate.z_length

                console.log(this.rOut, this.rIn)

                this.init()
                this.animate()

                // 设备分区标记
                this.casterMarks[0] = 'md'
                this.coolingMarks[0] = 'md'
                let index = 0
                let roller = {}
                for (let i = 1; i < this.config.segments.length; i++) {
                    index = this.config.segments[i].start - 1
                    roller = this.config.secondary_cooling_zone[index]
                    this.casterMarks[roller.distance] = this.config.segments[i].seg
                }

                // 冷却区分区标记
                for (let i = 0; i < this.config.cooling_zone.length; i++) {
                    index = this.config.cooling_zone[i].start - 1
                    roller = this.config.secondary_cooling_zone[index]
                    this.coolingMarks[roller.distance] = '' + (i + 1)
                }

                this.$root.$on("vertical_slice1_generated", (data) => {
                    console.log(data)
                    this.option.series[0].data = data.outer
                    this.option.series[1].data = data.inner
                })

                this.$root.$on("vertical_slice2_generated", (data) => {
                    console.log(data)
                    this.liquidSolidPositions.liquid = data.liquid
                    this.liquidSolidPositions.solid = data.solid
                    this.liquidSolidPositions.liquidJoin = data.liquid_join
                    this.liquidSolidPositions.solidJoin = data.solid_join

                    this.solidJoin = data.solid_join.join_index
                    this.liquidJoin = data.liquid_join.join_index

                    this.buildShapes(data.vertical_slice)

                    this.buildCurve(this.rOut, this.rIn, this.liquidSolidPositions.liquid, 400, this.curvePointsLiquid.geometry, this.liquidColors, this.liquidPositions)
                    this.buildCurve(this.rOut, this.rIn, this.liquidSolidPositions.solid, 1, this.curvePointsSolid.geometry, this.solidColors, this.solidPositions)

                    this.changeText(this.yIndex / 5 - 1)
                })
            })

        },
        methods: {
            init: function () {
                this.heatmap = this.createPalette()
                for (let canvas of this.heatmap.canvas) {
                    this.container.appendChild(canvas)
                }
                this.scene = new THREE.Scene()
                this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 10000)
                this.camera.position.set(0, 0, 950);
                this.scene.add(new THREE.AmbientLight(0xffffff))
                this.scene.background = new THREE.Color(0xffffff)

                this.group = new THREE.Group()
                this.group.position.set(-150, 190, 0)
                this.scene.add(this.group)

                this.renderer = new THREE.WebGLRenderer()
                this.renderer.setPixelRatio(window.devicePixelRatio)
                this.renderer.setSize(this.width, this.height)

                this.buildShapesInit(this.rOut)
                this.buildCurveInit()
                this.loadFont()
                this.container.appendChild(this.renderer.domElement)

                window.addEventListener('resize', this.onWindowResize, false)
            },
            buildLine: function (index) {
                this.group.remove(this.line)
                let parameters = {color: 0x212121}
                let points = []
                if (index < this.upLength) {
                    points.push(new THREE.Vector3(-this.rOut / this.scaleDown + this.yLength * this.yScaleUp / 2, (this.upLength - index) / this.scaleDown, 0))
                    points.push(new THREE.Vector3(-this.rOut / this.scaleDown + this.yLength * this.yScaleUp + 5, (this.upLength - index) / this.scaleDown, 0))
                } else if (index < this.upLength + this.arcLength) {
                    let xy1 = this.calculateXY(0, 0, this.rOut / this.scaleDown - this.yLength * this.yScaleUp / 2, 90 * (index - this.upLength) / this.arcLength * Math.PI / 180)
                    let xy2 = this.calculateXY(0, 0, this.rOut / this.scaleDown - (this.yLength * this.yScaleUp + 5), 90 * (index - this.upLength) / this.arcLength * Math.PI / 180)
                    points.push(new THREE.Vector3(xy1.x2, xy1.y2, 0))
                    points.push(new THREE.Vector3(xy2.x2, xy2.y2, 0))
                } else {
                    points.push(new THREE.Vector3((index - (this.upLength + this.arcLength)) / this.scaleDown, -this.rOut / this.scaleDown + this.yLength * this.yScaleUp / 2, 0))
                    points.push(new THREE.Vector3((index - (this.upLength + this.arcLength)) / this.scaleDown, -this.rOut / this.scaleDown + this.yLength * this.yScaleUp + 5, 0))
                }
                this.line = this.setLine(points, parameters)
                this.group.add(this.line)
            },
            setLine: function (points, parameters) {
                const material = new THREE.LineBasicMaterial(parameters);
                const geometry = new THREE.BufferGeometry().setFromPoints(points)
                return new THREE.Line(geometry, material)
            },
            changeText: function (index) {
                // let liquid = this.liquidSolidPositions.liquid
                // let solid = this.liquidSolidPositions.solid
                // if (liquid.length === 0 || solid.length === 0) {
                //     return
                // }
                this.group.remove(this.text)
                // let liquidValue = liquid[index] * 5
                let liquidValue = 5
                // let solidValue = solid[index] * 5
                let solidValue = 5
                let text = "L : " + liquidValue + " (mm) , S : " + solidValue + " (mm)"
                if (index < this.upLength) {
                    this.text = this.createText(text, -this.rOut / this.scaleDown + this.yLength * this.yScaleUp + 5, (this.upLength - index) / this.scaleDown, 0, 0)
                } else if (index < this.upLength + this.arcLength) {
                    let xy = this.calculateXY(0, 0, this.rOut / this.scaleDown - (this.yLength * this.yScaleUp + 5), 90 * (index - this.upLength) / this.arcLength * Math.PI / 180)
                    this.text = this.createText(text, xy.x2, xy.y2, 0, 90 * (index - this.upLength) / this.arcLength * Math.PI / 180)
                } else {
                    this.text = this.createText(text, (index - (this.upLength + this.arcLength)) / this.scaleDown, -this.rOut / this.scaleDown + this.yLength * this.yScaleUp + 5, 0, 90 * Math.PI / 180)
                }
                this.group.add(this.text)
                this.buildLine(index)
            },
            loadFont: function () {
                this.textMat = new THREE.MeshLambertMaterial({color: 0x212121})
                let loader = new FontLoader()
                this.font = loader.parse(fontJson)
                this.text = this.createText("L : 0 (mm) , S : 0 (mm)", -this.rOut / this.scaleDown + this.yLength * this.yScaleUp + 5, this.upLength / this.scaleDown, 0, 0)
                this.group.add(this.text)
                this.buildLine(0)
            },
            createText: function (txt, x, y, z, angle) {
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
                let text = new THREE.Mesh(textGeo, this.textMat)
                text.position.set(x, y, z)
                text.rotateZ(angle)
                text.castShadow = true;
                return text
            },
            buildShapesInit: function (rOut) {
                let colors = []
                let positions = []
                // up
                for (let i = 0; i < this.upLength / this.zScaleUp; i++) {
                    for (let j = 0; j < this.yLength / this.yScaleUp; j++) {
                        // positions
                        const x = -this.rOut / this.scaleDown + j * this.yScaleUp * this.yScaleUp
                        const y = (this.upLength - 1 - i * this.zScaleUp) / this.scaleDown
                        positions.push(x, y, 0)
                        // colors
                        const arr = this.heatmap.pickColor(1)

                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255

                        colors.push(vx, vy, vz)
                    }
                }
                // arc
                for (let i = 0; i < this.arcLength / this.zScaleUp; i++) {
                    for (let j = 0; j < this.yLength / this.yScaleUp; j++) {
                        // positions
                        let xy = this.calculateXY(0, 0, rOut / this.scaleDown - j * this.yScaleUp * this.yScaleUp, 90 * i * this.zScaleUp / this.arcLength * Math.PI / 180)
                        const x = xy.x2
                        const y = xy.y2
                        positions.push(x, y, 0)
                        // colors
                        const arr = this.heatmap.pickColor(1)
                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255

                        colors.push(vx, vy, vz)
                    }
                }
                // down
                for (let i = 0; i < this.downLength / this.zScaleUp; i++) {
                    for (let j = 0; j < this.yLength / this.yScaleUp; j++) {
                        // positions
                        positions.push(i * this.zScaleUp / this.scaleDown, (-this.rOut / this.scaleDown + j * this.yScaleUp * this.yScaleUp), 0)
                        // colors
                        const arr = this.heatmap.pickColor(1)

                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255

                        colors.push(vx, vy, vz)
                    }
                }
                this.colors = colors
                this.positions = positions
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
                geometry.computeBoundingSphere();
                const material = new THREE.PointsMaterial({size: 10, vertexColors: true});
                this.points = new THREE.Points(geometry, material);
                this.group.add(this.points)
            },
            buildShapes: function (data) {
                let colors = []
                let scale = 5
                // up
                for (let i = 0; i < 500 / scale; i++) {
                    for (let j = 0; j < 84; j++) {
                        // colors
                        const arr = this.heatmap.pickColor(Math.floor(data[i][j]) % this.originTemperature)

                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255

                        colors.push(vx, vy, vz)
                    }
                }
                // arc
                for (let i = 0; i < 3000 / scale; i++) {
                    for (let j = 0; j < 84; j++) {
                        // colors
                        const arr = this.heatmap.pickColor(Math.floor(data[i + 500 / scale][j]) % this.originTemperature)
                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255

                        colors.push(vx, vy, vz)
                    }
                }
                // down
                for (let i = 0; i < 500 / scale; i++) {
                    for (let j = 0; j < 84; j++) {
                        // colors
                        const arr = this.heatmap.pickColor(Math.floor(data[i + 3500 / scale][j]) % this.originTemperature)

                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255

                        colors.push(vx, vy, vz)
                    }
                }
                this.colors = colors
                this.points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
            },
            buildCurveInit: function () {
                let colors = []
                let positions = []
                const geometry1 = new THREE.BufferGeometry();
                geometry1.setAttribute('position', new THREE.Float32BufferAttribute(colors, 3));
                geometry1.setAttribute('color', new THREE.Float32BufferAttribute(positions, 3));
                geometry1.computeBoundingSphere();
                const material = new THREE.PointsMaterial({size: 3, vertexColors: true});
                this.curvePointsLiquid = new THREE.Points(geometry1, material);
                this.group.add(this.curvePointsLiquid)

                const geometry2 = new THREE.BufferGeometry();
                geometry1.setAttribute('position', new THREE.Float32BufferAttribute(colors, 3));
                geometry1.setAttribute('color', new THREE.Float32BufferAttribute(positions, 3));
                geometry1.computeBoundingSphere();

                this.curvePointsSolid = new THREE.Points(geometry2, material);
                this.group.add(this.curvePointsSolid)
            },
            buildCurve: function (rOut, rIn, data, colorIndex, geometry, colors1, positions1) {
                let positions = []
                let colors = []
                let scale = 5
                // let joined = false
                // up
                for (let i = 0; i < 500 / scale; i++) {
                    // if (data[i] === 42) {
                    //     joined = true
                    //     break
                    // }
                    if (data[i] === 0) {
                        continue
                    }
                    // positions
                    const x = data[i]
                    const y = rOut + 500 / scale - i
                    positions.push(x, y, 3)
                    positions.push(84 - x, y, 3)
                    // colors
                    const arr = this.heatmap.pickColor(colorIndex)

                    const vx = arr[0] / 255
                    const vy = arr[1] / 255
                    const vz = arr[2] / 255

                    colors.push(vx, vy, vz)
                    colors.push(vx, vy, vz)
                }
                // arc
                let step = 90 / (3000 / scale)
                for (let i = 0; i < 3000 / scale; i++) {
                    // if (data[i + 500 / scale] === 42 || joined) {
                    //     break
                    // }
                    if (data[i + 500 / scale] === 0) {
                        continue
                    }
                    // positions
                    let xy = this.calculateXY(rOut, rOut, rOut - data[i + 500 / scale], (i * step) - 180)
                    const x = xy.x2
                    const y = xy.y2
                    positions.push(x, y, 3)
                    let xy2 = this.calculateXY(rOut, rOut, rIn + data[i + 500 / scale], (i * step) - 180)
                    positions.push(xy2.x2, xy2.y2, 3)
                    // colors
                    const arr = this.heatmap.pickColor(colorIndex)
                    const vx = arr[0] / 255
                    const vy = arr[1] / 255
                    const vz = arr[2] / 255

                    colors.push(vx, vy, vz)
                    colors.push(vx, vy, vz)
                }
                // down
                for (let i = 0; i < 500 / scale; i++) {
                    // if (data[i + 3500 / scale] === 42 || joined) {
                    //     break
                    // }
                    if (data[i + 3500 / scale] === 0) {
                        continue
                    }
                    // positions
                    const x = rOut + i
                    positions.push(x, data[i + 3500 / scale], 3)
                    positions.push(x, 84 - data[i + 3500 / scale], 3)
                    // colors
                    const arr = this.heatmap.pickColor(colorIndex)

                    const vx = arr[0] / 255
                    const vy = arr[1] / 255
                    const vz = arr[2] / 255

                    colors.push(vx, vy, vz)
                    colors.push(vx, vy, vz)
                }
                colors1 = colors
                positions1 = positions
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions1, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors1, 3));
            },
            calculateXY: function (x1, y1, r, angle) {
                return {
                    x2: x1 - r * Math.cos(angle),
                    y2: y1 - r * Math.sin(angle)
                }
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
            showVerticalSlice1AtIndex: function (index) {
                index = Math.floor(index / 5)
                console.log(index)
                let message = {
                    type: "generate_vertical_slice1",
                    content: String(index)
                }
                if (this.conn !== undefined) {
                    this.conn.send(JSON.stringify(message));
                }
            },
            showVerticalSlice2AtIndex: function (index) {
                console.log(index)
                let message = {
                    type: "generate_vertical_slice2",
                    content: String(index)
                }
                if (this.conn !== undefined) {
                    this.conn.send(JSON.stringify(message));
                }
            },
            showEdgeAtYIndex: function (index) {
                index = index / this.zScale
                console.log("showEdgeAtYIndex", index)
                this.changeText(index)
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
        }
    }
</script>

<style scoped>
    #curves_container {
        width: 100%;
        height: calc(100vh - 30px);
        min-height: calc(100vh - 30px);
        max-height: calc(100vh - 30px);
        border: 1px solid #ddd;
        position: relative;
    }

    .el-tabs {
        height: 100%;
        box-sizing: border-box;
        overflow-y: auto;
    }

    .el-tabs--top {
        height: 100%;
        box-sizing: border-box;
    }

    .el-tabs--border-card {
        height: 100%;
        box-sizing: border-box;
    }

    .chart {
        height: calc(80vh - 10px);
        width: calc(100vw - 120px);
    }

    .bottom {
        box-sizing: border-box;
        text-align: center;
        width: 100%;
        z-index: 999;
        bottom: 0;
        background: white;
    }

    .block {
        display: inline-block;
    }

    #canvas_container {
        border: 1px solid #ddd;
        position: relative;
    }

    .slice_bottom {
        position: absolute;
        display: inline-block;
        left: 50%;
        top: 80px;
        transform: translateX(-50%);
        text-align: center;
    }

    .distance_bottom {
        box-sizing: border-box;
        text-align: left;
        width: 100%;
        z-index: 999;
        background: white;
    }

    .distance_bottom .block {
        box-sizing: border-box;
        width: 100%;
    }

    .info {
        font-size: larger;
        font-weight: bolder;
        display: inline-block;
        position: absolute;
        z-index: 999;
        top: 30px;
        right: 200px;
    }

    .block {
        background-color: #F0F4C3;
        padding: 0 20px 10px;
        border-top: 1px solid #ddd;
    }

    .block2 {
        border-bottom: 1px solid #ddd;
    }

    .slider-demo-block {
        display: flex;
        align-items: center;
    }

    .slider-demo-block .el-slider {
        margin-top: 0;
        margin-left: 12px;
    }

    .slider-demo-block .demonstration {
        font-size: 14px;
        line-height: 44px;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 0;
    }

    .slider-demo-block .demonstration + .el-slider {
        flex: 0 0 90%;
    }
</style>