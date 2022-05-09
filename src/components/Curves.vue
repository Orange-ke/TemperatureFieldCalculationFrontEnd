<template>
    <div id="curves_container">
        <el-tabs type="border-card">
            <el-tab-pane label="纵切面温度变化曲线">
                <v-chart class="chart" :option="option"></v-chart>
                <div class="bottom">
                    <div class="slider_container">
                        <div class="block">
                            <span class="demonstration">下标范围</span>
                            <el-slider
                                    :max="270"
                                    v-model="index1"
                                    :step="1">
                            </el-slider>
                        </div>
                    </div>
                    <div class="operation">
                        <el-input-number size="mini" v-model="index1" :step="1" :max="270" :min="1"></el-input-number>
                        <el-button size="mini" style="margin-left: 10px;" round type="primary"
                                   @click="showVerticalSlice1AtIndex(index1 - 1)">查看对应下标数据
                        </el-button>
                    </div>
                </div>
            </el-tab-pane>
            <el-tab-pane label="纵切面温度分布云图">
                <div class="info">
                    <div>固相线交汇处：{{solidJoin * 10}} mm</div>
                    <br>
                    <div>液相线交汇处：{{liquidJoin * 10}} mm</div>
                </div>
                <div id="canvas_container" style="width: 100%; height: 820px;"></div>
                <div class="slice_bottom">
                    <div class="slider_container">
                        <div class="block">
                            <span class="demonstration">下标范围</span>
                            <el-slider
                                    :max="270"
                                    v-model="index2"
                                    :step="1">
                            </el-slider>
                        </div>
                    </div>
                    <div class="operation">
                        <el-input-number size="mini" v-model="index2" :step="1" :max="270" :min="1"></el-input-number>
                        <el-button size="mini" style="margin-left: 10px;" round type="primary"
                                   @click="showVerticalSlice2AtIndex(index2 - 1)">查看对应下标数据
                        </el-button>
                    </div>
                </div>
                <div class="distance_bottom">
                    <div class="slider_container">
                        <div class="block" style="padding-top: 10px;">
                            <el-slider
                                    @change="showEdgeAtYIndex(yIndex)"
                                    :min="5"
                                    :max="4000"
                                    v-model="yIndex"
                                    :marks="marks"
                                    :step="5">
                            </el-slider>
                            <span class="demonstration">距离结晶器顶端距离(mm)</span>
                        </div>
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
    import {
        CanvasRenderer
    } from 'echarts/renderers'
    import {
        GridComponent,
        TooltipComponent,
        LegendComponent
    } from 'echarts/components'
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
        props: ['conn'],
        data() {
            return {
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
                            name: '离结晶器顶部距离',
                            min: 0,
                            max: 40000,
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

                // pane2
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
                sliceWidth: 0,
                sliceHeight: 0,
                rOut: 0,
                rIn: 0,

                index2: 1,
                yIndex: 0,
                marks: {
                    0: 'MD',
                    500: 'Seg_0',
                    1093.2: 'Seg_1',  // 20
                    1300.82: "Seg_2", // 27
                    1508.44: "Seq_3", // 34
                    1716.06: "Seq_4", // 41
                    1923.68: "Seq_5", // 48
                    2131.3: "Seq_6", // 55
                    2338.92: "Seq_7", // 62
                    2546.54: "Seq_8", // 69
                    2754.16: "Seq_9", // 76
                    2961.78: "Seq_10", // 83
                    3169.4: "Seq_11",// 90
                    3377.02: "Seq_12",// 97
                    3584.64: "Seq_13",// 104
                    3792.26: "Seq_14",// 111
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
                fontSize: 10,
                curveSegments: 10,
                bevelThickness: 0.1,
                bevelSize: 0.3,
                bevelSegments: 3,
                bevelEnabled: true,

                line: undefined,
            }
        },
        mounted() {
            this.container = document.getElementById("canvas_container")

            console.log(this.container)

            this.width = 1823
            this.height = 822

            console.log(this.width, this.height)

            let r = parseFloat((3000 / 5 * 4 / (Math.PI * 2)).toFixed(4))
            this.rOut = r + 84 / 2
            this.rIn = r - 84 / 2

            console.log(this.rOut, this.rIn)

            this.init()
            this.animate()

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
        },
        methods: {
            init: function () {
                this.heatmap = this.createPalette()
                for (let canvas of this.heatmap.canvas) {
                    this.container.appendChild(canvas)
                }
                this.scene = new THREE.Scene()
                this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 10000)
                this.camera.position.set(0, 150, 700);
                this.scene.add(new THREE.AmbientLight(0xffffff))
                this.scene.background = new THREE.Color(0xffffff)

                this.group = new THREE.Group()
                this.group.position.set(-200, -100, 0)
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
                if (index < 100) {
                    points.push(new THREE.Vector3(42, this.rOut + (100 - index), 0))
                    points.push(new THREE.Vector3(84 + 5, this.rOut + (100 - index), 0))
                } else if (index < 700) {
                    let step = 90 / 600
                    let xy1 = this.calculateXY(this.rOut, this.rOut, this.rIn + 42, ((index - 100) * step) - 180)
                    let xy2 = this.calculateXY(this.rOut, this.rOut, this.rIn - 5, ((index - 100) * step) - 180)
                    points.push(new THREE.Vector3(xy1.x2, xy1.y2, 0))
                    points.push(new THREE.Vector3(xy2.x2, xy2.y2, 0))
                } else if (index < 800) {
                    points.push(new THREE.Vector3(this.rOut + index - 700, 42, 0))
                    points.push(new THREE.Vector3(this.rOut + index - 700, 84 + 5, 0))
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
                let liquid = this.liquidSolidPositions.liquid
                let solid = this.liquidSolidPositions.solid
                if (liquid.length === 0 || solid.length === 0) {
                    return
                }
                this.group.remove(this.text)
                let liquidValue = liquid[index] * 5
                let solidValue = solid[index] * 5
                let text = "液相线距离坯壳厚度 : " + liquidValue + " (mm) , 固相线相线距离坯壳厚度 : " + solidValue + " (mm)"
                if (index < 100) {
                    this.text = this.createText(text, 84 + 5, this.rOut + (100 - index), 0, 0)
                } else if (index < 700) {
                    let step = 90 / 600
                    let xy = this.calculateXY(this.rOut, this.rOut, this.rIn - 5, ((index - 100) * step) - 180)
                    this.text = this.createText(text, xy.x2, xy.y2, 0, (index - 100) * step * Math.PI / 180)
                } else if (index < 800) {
                    this.text = this.createText(text, this.rOut + (index - 700), 84 + 5, 0, 90 * Math.PI / 180)
                }
                this.group.add(this.text)
                this.buildLine(index)
            },
            loadFont: function () {
                this.textMat = new THREE.MeshLambertMaterial({color: 0x212121})
                let loader = new FontLoader()
                this.font = loader.parse(fontJson)
                this.text = this.createText("L : 0 (mm) , S : 0 (mm)", 84 + 5, this.rOut + 100, 0, 0)
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
                let scale = 5
                // up
                for (let i = 0; i < 500 / scale; i++) {
                    for (let j = 0; j < 84; j++) {
                        // positions
                        const x = j
                        const y = rOut + 500 / scale - i
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
                let step = 90 / (3000 / scale)
                for (let i = 0; i < 3000 / scale; i++) {
                    for (let j = 0; j < 84; j++) {
                        // positions
                        let xy = this.calculateXY(rOut, rOut, rOut - j, (i * step) - 180)
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
                for (let i = 0; i < 500 / scale; i++) {
                    for (let j = 0; j < 84; j++) {
                        // positions
                        const x = rOut + i
                        positions.push(x, j, 0)
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
                const material = new THREE.PointsMaterial({size: 5, vertexColors: true});
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
                    x2: x1 + r * Math.cos(angle * Math.PI / 180),
                    y2: y1 + r * Math.sin(angle * Math.PI / 180)
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
                console.log(index / 5 - 1)
                this.changeText(index / 5 - 1)
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
        background: white;
    }

    .block {
        display: inline-block;
        width: 540px;
    }

    #canvas_container {
        border: 1px solid #ddd;
        position: relative;
    }

    .slice_bottom {
        position: absolute;
        display: inline-block;
        left: 50%;
        bottom: 80px;
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
        display: block;
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
</style>